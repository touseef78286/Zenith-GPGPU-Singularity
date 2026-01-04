
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import { Effect } from 'postprocessing';
import { useAudioAnalyzer } from '../../hooks/useAudioAnalyzer';

const fragmentShader = `
  uniform float strength;
  uniform float radius;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 center = vec2(0.5, 0.5);
    vec2 dir = uv - center;
    float dist = length(dir);
    
    // Gravitational Lensing logic
    float force = strength * exp(-dist * dist / (radius * radius));
    vec2 lensedUv = uv - dir * force;
    
    outputColor = texture2D(inputBuffer, lensedUv);
  }
`;

class LensingEffect extends Effect {
  public uniforms: Map<string, THREE.IUniform>;

  constructor({ strength = 0.5, radius = 0.5 } = {}) {
    const uniformsMap = new Map<string, THREE.IUniform>([
      ['strength', new THREE.Uniform(strength)],
      ['radius', new THREE.Uniform(radius)],
    ]);

    super('LensingEffect', fragmentShader, {
      uniforms: uniformsMap,
    });

    this.uniforms = uniformsMap;
  }

  toJSON() {
    return { type: 'LensingEffect' };
  }
}

const GravitationalLensing: React.FC = React.memo(() => {
  const scroll = useScroll();
  const audioDataRef = useAudioAnalyzer();
  
  const effect = useMemo(() => new LensingEffect({ strength: 0.4, radius: 0.5 }), []);

  useFrame(() => {
    if (effect.uniforms) {
      const offset = scroll.offset;
      const { bass } = audioDataRef.current;
      const strengthUniform = effect.uniforms.get('strength');
      
      if (strengthUniform) {
        // Base strength reduces as we move past the singularity (scroll)
        // Reactive strength pulses on bass hits
        const baseStrength = 0.4 * (1.0 - smoothstep(0.7, 0.9, offset));
        const pulseStrength = bass * 0.25;
        strengthUniform.value = baseStrength + pulseStrength;
      }
    }
  });

  return <primitive object={effect} dispose={null} />;
}, () => true);

function smoothstep(min: number, max: number, value: number) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

export default GravitationalLensing;
