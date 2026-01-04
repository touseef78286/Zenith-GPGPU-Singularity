
import React from 'react';

const Overlay: React.FC = () => {
  return (
    <div className="w-full text-white pointer-events-none">
      {/* Section 1: Introduction */}
      <section className="h-screen flex flex-col items-center justify-center p-10 text-center">
        <h1 className="text-7xl font-black tracking-tighter mb-4 uppercase italic drop-shadow-2xl">The Quantum Burst</h1>
        <p className="max-w-md text-sm uppercase tracking-[0.4em] opacity-60">
          Phase 2 // GPGPU Singularity Engine
        </p>
        <div className="mt-20 animate-bounce opacity-30">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
          </svg>
        </div>
      </section>

      {/* Section 2: Katana Unsheathing */}
      <section className="h-screen flex flex-col items-end justify-center p-20">
        <div className="max-w-xl text-right">
          <h2 className="text-6xl font-black mb-6 uppercase tracking-tight italic">Blade of Light</h2>
          <p className="text-lg opacity-70 leading-relaxed uppercase tracking-widest text-sm">
            At max velocity, geometry emerges from entropy. 
            A procedural unsheathing of pure light.
          </p>
          <div className="mt-8 h-[1px] w-48 bg-white/20 ml-auto"></div>
        </div>
      </section>

      {/* Section 3: Supernova */}
      <section className="h-screen flex flex-col items-center justify-center p-10 text-center">
        <div className="bg-black/10 backdrop-blur-md p-16 border border-white/5 rounded-sm">
          <h2 className="text-7xl font-black mb-4 uppercase italic tracking-tighter">ZENITH</h2>
          <p className="max-w-md text-xs uppercase tracking-[0.8em] opacity-80 mb-10">
            Total System Reset // Starfield Initiated
          </p>
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="pointer-events-auto px-12 py-4 border border-white/20 text-[10px] tracking-[0.5em] uppercase hover:bg-white hover:text-black transition-all duration-700"
          >
            Rewind Sequence
          </button>
        </div>
      </section>
    </div>
  );
};

export default Overlay;
