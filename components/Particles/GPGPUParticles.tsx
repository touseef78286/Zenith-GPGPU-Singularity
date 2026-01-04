
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three-stdlib';
import { simulationPositionShader, simulationVelocityShader, particleVertexShader, particleFragmentShader } from './Shaders';
import { useScroll } from '@react-three/drei';
import { useAudioAnalyzer } from '../../hooks/useAudioAnalyzer';

const TEXTURE_SIZE = 1024; // ~1M particles
const PARTICLES_COUNT = TEXTURE_SIZE * TEXTURE_SIZE;

const GPGPUParticles: React.FC = React.memo(() => {
  const { gl } = useThree();
  const scroll = useScroll();
  const audioDataRef = useAudioAnalyzer();
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const [isReady, setIsReady] = useState(false);
  
  const gpuComputeRef = useRef<GPUComputationRenderer | null>(null);
  const variablesRef = useRef<{ posVar: any; velVar: any } | null>(null);
  const lastScrollOffset = useRef(0);
  const scrollVelocity = useRef(0);

  // Stable geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const uvs = new Float32Array(PARTICLES_COUNT * 2);
    for (let i = 0; i < PARTICLES_COUNT; i++) {
      uvs[i * 2 + 0] = (i % TEXTURE_SIZE) / TEXTURE_SIZE;
      uvs[i * 2 + 1] = Math.floor(i / TEXTURE_SIZE) / TEXTURE_SIZE;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PARTICLES_COUNT * 3), 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    return geo;
  }, []);

  const initialUniforms = useMemo(() => ({
    uPosition: { value: null },
    uVelocity: { value: null },
    uTime: { value: 0 },
    uPixelRatio: { value: gl.getPixelRatio() },
    uSize: { value: 1.2 },
    uMouse: { value: new THREE.Vector3(0, 0, 0) },
    uProgress: { value: 0 },
    uBass: { value: 0 },
    uMid: { value: 0 },
    uTreble: { value: 0 }
  }), []);

  useEffect(() => {
    const gpu = new GPUComputationRenderer(TEXTURE_SIZE, TEXTURE_SIZE, gl);
    
    const posTexture = gpu.createTexture();
    const velTexture = gpu.createTexture();
    const katanaTexture = gpu.createTexture();
    const starfieldTexture = gpu.createTexture();

    const posData = posTexture.image.data;
    const katanaData = katanaTexture.image.data;
    const starfieldData = starfieldTexture.image.data;

    for (let i = 0; i < PARTICLES_COUNT; i++) {
      const i4 = i * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 2 + Math.random() * 2;
      posData[i4 + 0] = r * Math.sin(phi) * Math.cos(theta);
      posData[i4 + 1] = r * Math.sin(phi) * Math.sin(theta);
      posData[i4 + 2] = r * Math.cos(phi);
      posData[i4 + 3] = 1.0;

      katanaData[i4 + 0] = (Math.random() - 0.5) * 12.0;
      katanaData[i4 + 1] = (Math.random() - 0.5) * 0.05;
      katanaData[i4 + 2] = (Math.random() - 0.5) * 0.02;
      katanaData[i4 + 3] = 1.0;

      const sTheta = Math.random() * Math.PI * 2;
      const sPhi = Math.acos(Math.random() * 2 - 1);
      const sR = 30 + Math.random() * 50;
      starfieldData[i4 + 0] = sR * Math.sin(sPhi) * Math.cos(sTheta);
      starfieldData[i4 + 1] = sR * Math.sin(sPhi) * Math.sin(sTheta);
      starfieldData[i4 + 2] = sR * Math.cos(sPhi);
      starfieldData[i4 + 3] = 1.0;
    }

    const posVar = gpu.addVariable('uPosition', simulationPositionShader, posTexture);
    const velVar = gpu.addVariable('uVelocity', simulationVelocityShader, velTexture);

    gpu.setVariableDependencies(posVar, [posVar, velVar]);
    gpu.setVariableDependencies(velVar, [posVar, velVar]);

    posVar.material.uniforms.uKatana = { value: katanaTexture };
    posVar.material.uniforms.uStarfield = { value: starfieldTexture };
    posVar.material.uniforms.uProgress = { value: 0 };
    posVar.material.uniforms.uTime = { value: 0 };

    velVar.material.uniforms.uTime = { value: 0 };
    velVar.material.uniforms.uProgress = { value: 0 };
    velVar.material.uniforms.uMouse = { value: new THREE.Vector3(0, 0, 0) };
    velVar.material.uniforms.uScrollVel = { value: 0 };
    velVar.material.uniforms.uBass = { value: 0 };
    velVar.material.uniforms.uMid = { value: 0 };
    velVar.material.uniforms.uTreble = { value: 0 };

    const error = gpu.init();
    if (error !== null) {
      console.error('GPGPU Initialization Error:', error);
    } else {
      gpuComputeRef.current = gpu;
      variablesRef.current = { posVar, velVar };
      setIsReady(true);
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      if (gpuComputeRef.current) gpuComputeRef.current.dispose();
      geometry.dispose();
    };
  }, []);

  useFrame((state) => {
    if (!isReady || !gpuComputeRef.current || !variablesRef.current) return;

    const currentOffset = scroll.offset;
    scrollVelocity.current = Math.abs(currentOffset - lastScrollOffset.current) * 10.0;
    lastScrollOffset.current = currentOffset;

    const { bass, mid, treble } = audioDataRef.current;
    const { posVar, velVar } = variablesRef.current;
    
    posVar.material.uniforms.uTime.value = state.clock.getElapsedTime();
    posVar.material.uniforms.uProgress.value = currentOffset;
    
    velVar.material.uniforms.uTime.value = state.clock.getElapsedTime();
    velVar.material.uniforms.uProgress.value = currentOffset;
    velVar.material.uniforms.uScrollVel.value = scrollVelocity.current;
    velVar.material.uniforms.uBass.value = bass;
    velVar.material.uniforms.uMid.value = mid;
    velVar.material.uniforms.uTreble.value = treble;
    
    const vector = new THREE.Vector3(mouseRef.current.x, mouseRef.current.y, 0.5);
    vector.unproject(state.camera);
    const dir = vector.sub(state.camera.position).normalize();
    const distance = -state.camera.position.z / dir.z;
    const worldMousePos = state.camera.position.clone().add(dir.multiplyScalar(distance));
    velVar.material.uniforms.uMouse.value.copy(worldMousePos);

    gpuComputeRef.current.compute();

    if (materialRef.current) {
      const posRT = gpuComputeRef.current.getCurrentRenderTarget(posVar);
      const velRT = gpuComputeRef.current.getCurrentRenderTarget(velVar);
      
      if (posRT && velRT) {
        materialRef.current.uniforms.uPosition.value = posRT.texture;
        materialRef.current.uniforms.uVelocity.value = velRT.texture;
        materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
        materialRef.current.uniforms.uMouse.value.copy(worldMousePos);
        materialRef.current.uniforms.uProgress.value = currentOffset;
        materialRef.current.uniforms.uBass.value = bass;
        materialRef.current.uniforms.uMid.value = mid;
        materialRef.current.uniforms.uTreble.value = treble;
      }
    }
  });

  return (
    <points ref={pointsRef} frustumCulled={false} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        attach="material"
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={initialUniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}, () => true);

export default GPGPUParticles;
