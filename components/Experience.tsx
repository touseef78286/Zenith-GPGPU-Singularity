
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';
import GPGPUParticles from './Particles/GPGPUParticles';
import PostProcessing from './PostProcessing/PostProcessing';
import VolumetricFire from './Singularity/VolumetricFire';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';

const Experience: React.FC = React.memo(() => {
  const scroll = useScroll();
  const audioDataRef = useAudioAnalyzer();
  const singularityRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  
  // Smoothing factors for physics
  const lerpFactor = 0.15;
  const currentCameraPos = useRef(new THREE.Vector3(0, 0, 10));

  useFrame((state) => {
    const scrollOffset = scroll.offset;
    const { bass, mid, treble, avg } = audioDataRef.current;
    const time = state.clock.getElapsedTime();
    
    // --- 1. Advanced Camera Kinetics ---
    // Bass creates a physical "kick" backwards
    const targetZ = 10 + (bass * 2.5);
    currentCameraPos.current.z = THREE.MathUtils.lerp(currentCameraPos.current.z, targetZ, lerpFactor);
    
    // Treble creates high-frequency micro-jitter (Heat Haze effect)
    const jitterStrength = treble * 0.12;
    currentCameraPos.current.x = Math.sin(time * 35.0) * jitterStrength;
    currentCameraPos.current.y = Math.cos(time * 30.0) * jitterStrength;
    
    state.camera.position.copy(currentCameraPos.current);
    
    // FOV reacts to the energy average (expansion on drop)
    const targetFov = 45 + (avg * 15.0) - (treble * 5.0);
    state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, targetFov, 0.1);
    state.camera.updateProjectionMatrix();

    // --- 2. Harmonic Singularity Dynamics ---
    if (singularityRef.current) {
      // Orbital Velocity: Mids drive the primary rotation
      singularityRef.current.rotation.y += 0.005 + (mid * 0.12);
      
      // Structural Wobble: Bass creates heavy tilts
      const bassTilt = Math.sin(time * 0.5) * 0.2 + (bass * 0.4);
      singularityRef.current.rotation.x = THREE.MathUtils.lerp(singularityRef.current.rotation.x, bassTilt, 0.1);
      
      // High-Freq Jitter: Treble causes microscopic Z-axis vibration
      const trebleVibration = Math.cos(time * 20.0) * (treble * 0.15);
      singularityRef.current.rotation.z = THREE.MathUtils.lerp(singularityRef.current.rotation.z, trebleVibration, 0.1);
      
      // Nuanced Scaling: Multi-layer scaling (Base + Bass Kick + Treble Shiver)
      const baseScale = 1.0 - scrollOffset * 0.5;
      const kick = bass * 0.6;
      const shiver = Math.sin(time * 50.0) * (treble * 0.02);
      singularityRef.current.scale.setScalar(baseScale + kick + shiver);
    }

    // --- 3. Dynamic Spectrum Lighting ---
    if (lightRef.current) {
      // Intensity: Drastic flash on bass hits
      lightRef.current.intensity = 1.0 + (bass * 15.0) + (avg * 5.0);
      
      // Color: Shift Hue based on mids (Violet to Cyan) and increase brightness on peaks
      const hue = 0.78 - (mid * 0.25); // Range from deep violet to electric blue
      const saturation = 0.7 + (treble * 0.3); // Saturation increases with high frequencies
      const lightness = 0.5 + (bass * 0.4); // Brightness peaks with bass
      lightRef.current.color.setHSL(hue, saturation, Math.min(lightness, 1.0));
    }
  });

  return (
    <>
      <ambientLight intensity={0.05} />
      <pointLight 
        ref={lightRef}
        position={[10, 10, 10]} 
        intensity={2} 
        color="#8844ff" 
      />
      
      <group ref={singularityRef}>
        <GPGPUParticles />
        <VolumetricFire />
        
        {/* The Event Horizon Core */}
        <mesh>
          <sphereGeometry args={[0.5, 64, 64]} />
          <meshBasicMaterial color="black" />
        </mesh>
      </group>

      <PostProcessing />
    </>
  );
}, () => true);

export default Experience;
