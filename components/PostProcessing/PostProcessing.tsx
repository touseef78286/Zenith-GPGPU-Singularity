
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import GravitationalLensing from './GravitationalLensing';
import { useAudioAnalyzer } from '../../hooks/useAudioAnalyzer';

const PostProcessing: React.FC = () => {
  const scroll = useScroll();
  const audioDataRef = useAudioAnalyzer();
  const bloomRef = useRef<any>(null);
  const chromRef = useRef<any>(null);

  useFrame(() => {
    const offset = scroll.offset;
    const { bass, treble, avg } = audioDataRef.current;
    
    // 1. Audio-Reactive Bloom
    if (bloomRef.current) {
      // Base intensity from supernova transition + reactive glow from bass/avg
      const burstIntensity = 1.5 + Math.pow(smoothstep(0.7, 0.85, offset), 2.0) * 15.0;
      const reactiveIntensity = avg * 8.0 + bass * 4.0;
      bloomRef.current.intensity = burstIntensity + reactiveIntensity;
    }

    // 2. Audio-Reactive Chromatic Aberration
    if (chromRef.current) {
      // Higher frequencies (treble) cause "glitchy" color separation
      const scrollAmount = offset * 0.015;
      const audioGlitch = treble * 0.02 + bass * 0.005;
      const totalAmount = scrollAmount + audioGlitch;
      
      const target = chromRef.current.offset;
      if (target) {
        if (typeof target.set === 'function') {
          target.set(totalAmount, totalAmount);
        } else {
          target.x = totalAmount;
          target.y = totalAmount;
        }
      }
    }
  });

  return (
    <EffectComposer disableNormalPass multisampling={0}>
      <GravitationalLensing />
      <ChromaticAberration ref={chromRef} offset={[0, 0]} />
      <Bloom 
        ref={bloomRef}
        intensity={2.0} 
        luminanceThreshold={0.1} // Lowered to catch more audio reactive highlights
        luminanceSmoothing={0.9} 
        mipmapBlur 
      />
      <Noise opacity={0.06} />
      <Vignette eskil={false} offset={0.1} darkness={1.3} />
    </EffectComposer>
  );
};

function smoothstep(min: number, max: number, value: number) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

export default PostProcessing;
