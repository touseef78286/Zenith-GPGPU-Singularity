
import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls, Scroll } from '@react-three/drei';
import Experience from './components/Experience';
import Overlay from './components/Overlay';
import LoadingScreen from './components/LoadingScreen';

const App: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Artificial delay to ensure shaders are ready and aesthetics are presented
    const timer = setTimeout(() => setIsLoaded(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full h-screen bg-black overflow-hidden">
      {!isLoaded && <LoadingScreen />}
      
      <Canvas
        shadows
        camera={{ position: [0, 0, 10], fov: 45 }}
        gl={{ 
          antialias: false, 
          powerPreference: "high-performance",
          alpha: false
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#000']} />
        
        <Suspense fallback={null}>
          <ScrollControls pages={3} damping={0.2}>
            <Experience />
            <Scroll html>
              <Overlay />
            </Scroll>
          </ScrollControls>
        </Suspense>
      </Canvas>

      <div className="fixed bottom-8 left-8 z-50 pointer-events-none opacity-50 text-[10px] uppercase tracking-[0.2em]">
        ZENITH GPGPU Engine v3.0 // 1M PARTICLES
      </div>
    </div>
  );
};

export default App;
