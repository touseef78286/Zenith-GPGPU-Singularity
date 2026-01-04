
import { useEffect, useRef } from 'react';

export interface AudioData {
  bass: number;
  mid: number;
  treble: number;
  avg: number;
}

export const useAudioAnalyzer = () => {
  const audioDataRef = useRef<AudioData>({ bass: 0, mid: 0, treble: 0, avg: 0 });
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    let animationFrame: number;
    let audioContext: AudioContext | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let stream: MediaStream | null = null;

    const setupAudio = async () => {
      if (audioContext) return; // Prevent multiple initializations

      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        const analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 512;
        analyzer.smoothingTimeConstant = 0.8;
        
        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyzer);
        
        analyzerRef.current = analyzer;
        dataArrayRef.current = dataArray;

        const update = () => {
          if (analyzerRef.current && dataArrayRef.current) {
            analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
            
            const len = dataArrayRef.current.length;
            
            // Bass: Lower 10%
            let bassSum = 0;
            const bassEnd = Math.floor(len * 0.1);
            for (let i = 0; i < bassEnd; i++) bassSum += dataArrayRef.current[i];
            const bassTarget = bassSum / (bassEnd * 255);

            // Mid: Middle 10-40%
            let midSum = 0;
            const midStart = bassEnd;
            const midEnd = Math.floor(len * 0.4);
            for (let i = midStart; i < midEnd; i++) midSum += dataArrayRef.current[i];
            const midTarget = midSum / ((midEnd - midStart) * 255);

            // Treble: Upper 40-90%
            let trebleSum = 0;
            const trebleStart = midEnd;
            const trebleEnd = Math.floor(len * 0.9);
            for (let i = trebleStart; i < trebleEnd; i++) trebleSum += dataArrayRef.current[i];
            const trebleTarget = trebleSum / ((trebleEnd - trebleStart) * 255);

            // Average
            let total = 0;
            for (let i = 0; i < len; i++) total += dataArrayRef.current[i];
            const avgTarget = total / (len * 255);

            // Smooth the values (Lerp)
            const lerp = 0.15;
            audioDataRef.current.bass += (bassTarget - audioDataRef.current.bass) * lerp;
            audioDataRef.current.mid += (midTarget - audioDataRef.current.mid) * lerp;
            audioDataRef.current.treble += (trebleTarget - audioDataRef.current.treble) * lerp;
            audioDataRef.current.avg += (avgTarget - audioDataRef.current.avg) * lerp;
          }
          animationFrame = requestAnimationFrame(update);
        };
        update();
      } catch (e) {
        console.warn("Audio analysis context could not start (likely microphone permission denied):", e);
      }
    };

    const handleInteraction = () => {
      setupAudio();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      if (audioContext) audioContext.close();
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  return audioDataRef;
};
