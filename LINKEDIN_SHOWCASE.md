# 🚀 Project Showcase: ZENITH GPGPU Particle Singularity

Below is a curated LinkedIn post and technical summary you can use to showcase this project.

---

## 💎 LinkedIn Post Template

**Headline: 🌌 1 Million Particles, One GPGPU Singularity: Engineering the Future of Creative Coding**

I just pushed the limits of WebGL to create **ZENITH**, a real-time Quantum Singularity experience built with React Three Fiber and custom GPGPU simulation.

This isn't just a visual; it’s a high-performance physics engine running 100% on the GPU. By leveraging **Frame Buffer Objects (FBO)**, I’m able to simulate over **1,000,000 particles** at 60FPS, all reacting dynamically to real-time audio input.

### 🛠️ Technical Deep Dive:
*   **GPGPU Physics:** Using `GPUComputationRenderer` to calculate position and velocity kernels on the GPU, enabling massive particle counts that would crush a standard CPU-bound loop.
*   **Audio-Reactive Engine:** Implemented a granular FFT (Fast Fourier Transform) analyzer that splits audio into Bass, Mid, and Treble bands. These frequencies drive the particle curl noise, camera kinetics, and volumetric fire displacement.
*   **Custom Shaders (GLSL):**
    *   **Volumetric Fire:** A torus geometry modified by 3D Simplex noise and vertex displacement to simulate heat-induced convection.
    *   **Gravitational Lensing:** A custom post-processing effect that bends space-time (UV coordinates) around the singularity core.
*   **Advanced Camera Kinetics:** The camera physically "kicks" back on bass hits and vibrates with high-frequency treble, creating a visceral sense of impact.

### 🧪 The Tech Stack:
*   **Framework:** React 19 + Three.js
*   **Renderer:** @react-three/fiber
*   **Simulation:** Custom FBO (GPGPU) Kernels
*   **Post-Processing:** @react-three/postprocessing (Bloom, Chromatic Aberration, Noise)
*   **Audio:** Web Audio API (MediaStream)

This project explores the intersection of high-performance engineering and generative art. It’s a testament to how far web browsers have come as a platform for immersive experiences.

Check out the "Quantum Burst" sequence in the video below! ⬇️

#WebGL #ThreeJS #ReactThreeFiber #GPGPU #CreativeCoding #FrontendEngineering #Shaders #GenerativeArt #JavaScript #WebDev

---

## 📝 Technical Specs (For your Portfolio/ReadMe)

### 1. GPGPU Simulation Kernels
The simulation uses two primary compute shaders:
- **Position Shader:** Handles the transition between different "states" (Sphere -> Katana -> Starfield) using smoothstep interpolation driven by the scroll offset.
- **Velocity Shader:** Computes 4 distinct forces:
  - **Gravity:** Pulls particles toward the center based on an inverse-square law.
  - **Vortex:** Creates orbital angular momentum.
  - **Curl Noise:** Simulates fluid-like turbulence.
  - **Audio-Burst:** Triggers a supernova expansion during the scroll sequence.

### 2. Audio Analysis
The `useAudioAnalyzer` hook utilizes the Web Audio API to create a real-time data stream. It calculates:
- **Bass (20Hz-200Hz):** Drives physical scale and camera "kicks."
- **Mids (200Hz-2kHz):** Drives rotation speed and orbital velocity.
- **Treble (2kHz-20kHz):** Drives high-frequency jitter, shimmers, and light saturation.

### 3. Visual Polish
- **Depth-Testing:** Particles are rendered with `depthWrite: false` and `AdditiveBlending` to create the glowing "plasma" look.
- **Color Gradients:** Particles shift from Violet to Plasma Orange based on their proximity to the "heat" source (the mouse and the singularity core).
- **Post-Effects:** A multi-pass effect composer adds a layer of realism with custom gravitational lensing that refracts the background particles.

---

### 💡 Pro-Tip for your post:
*Attach a high-quality screen recording of you scrolling through the "Quantum Burst" sequence while talking into your microphone or playing music to demonstrate the reactivity!*