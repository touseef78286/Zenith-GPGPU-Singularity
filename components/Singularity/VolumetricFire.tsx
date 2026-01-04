
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAudioAnalyzer } from '../../hooks/useAudioAnalyzer';

const fireVertexShader = `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vDistortion;

  // Simplex 3D Noise for displacement
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    // Calculate heat-induced displacement reactive to Bass and Mids
    float noiseValue = snoise(position * (1.5 + uMid) + uTime * 0.8);
    float displacement = noiseValue * (0.1 + uBass * 0.4);
    vDistortion = noiseValue;
    
    vec3 newPosition = position + normal * displacement;
    vPosition = newPosition;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fireFragmentShader = `
  uniform float uTime;
  uniform float uBass;
  uniform float uTreble;
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vDistortion;

  float hash(float n) { return fract(sin(n) * 43758.5453123); }
  float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
    float n = p.x + p.y*57.0 + 113.0*p.z;
    return mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                   mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y),
               mix(mix( hash(n+113.0), hash(n+114.0),f.x),
                   mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);
  }

  void main() {
    // Proximity to singularity core
    float dist = length(vPosition.xz);
    float radial = 1.0 - smoothstep(0.4, 0.85, dist);
    float height = 1.0 - abs(vPosition.y * 3.0);
    
    // UV Heat Distortion (Simulates refraction) reactive to Treble
    vec2 distortedUv = vUv + vec2(vDistortion * (0.05 + uTreble * 0.1));
    
    // Roiling plasma layers
    float n1 = noise(vPosition * 2.5 + uTime * 1.2);
    float n2 = noise(vPosition * 5.0 - uTime * 2.0);
    float n3 = noise(vPosition * 10.0 + uTime * 3.0);
    
    // Composite heat mask
    float mask = radial * height * (n1 * 0.6 + n2 * 0.3 + n3 * 0.1);
    mask = smoothstep(0.15, 0.8, mask + uBass * 0.2);
    
    // Fresnel / Rim Light Effect (Heat haze glow at edges)
    vec3 viewDir = normalize(-vPosition);
    float fresnel = pow(1.0 - dot(vNormal, viewDir), 3.0);
    
    // Color Palette
    vec3 heatColor = vec3(1.0, 0.4, 0.1); 
    vec3 plasmaColor = vec3(0.6, 0.1, 1.0); 
    
    // Blend colors based on radial distance and noise
    vec3 color = mix(plasmaColor, heatColor, radial);
    color = mix(color, vec3(1.0, 0.9, 0.8), mask * 0.5); 
    
    // Add rim glow reactive to Bass and Treble
    color += fresnel * heatColor * (1.5 + uBass * 2.0 + uTreble);
    
    // Final output with alpha based on mask and edge falloff
    float alpha = mask * (0.8 + fresnel * 0.5);
    
    gl_FragColor = vec4(color * (1.5 + uBass * 2.0 + uTreble * 3.0), alpha);
  }
`;

const VolumetricFire: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const audioDataRef = useAudioAnalyzer();

  const initialUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uBass: { value: 0 },
    uMid: { value: 0 },
    uTreble: { value: 0 }
  }), []);

  useFrame((state) => {
    const { bass, mid, treble } = audioDataRef.current;
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.uBass.value = bass;
      materialRef.current.uniforms.uMid.value = mid;
      materialRef.current.uniforms.uTreble.value = treble;
    }
    
    if (meshRef.current) {
      meshRef.current.rotation.z += 0.005 + mid * 0.02;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.8, 0.28, 64, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={fireVertexShader}
        fragmentShader={fireFragmentShader}
        uniforms={initialUniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export default VolumetricFire;
