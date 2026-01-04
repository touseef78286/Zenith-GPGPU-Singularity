
import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center cursor-pointer">
      <div className="relative w-48 h-48 mb-8">
        <div className="absolute inset-0 border-2 border-violet-500 rounded-full animate-ping opacity-20"></div>
        <div className="absolute inset-4 border border-gold-500 rounded-full animate-pulse opacity-40"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-xs tracking-[0.8em] uppercase text-white opacity-80 animate-pulse mb-4">
          Initializing Singularity
        </h2>
        <div className="space-y-2">
          <p className="text-[10px] tracking-[0.2em] uppercase text-violet-400 opacity-50">
            Compiling GPGPU Kernels...
          </p>
          <p className="text-[9px] tracking-[0.3em] uppercase text-white/40">
            [ Click anywhere to enable Audio Reactive engine ]
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
