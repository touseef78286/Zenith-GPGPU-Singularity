
export const simulationPositionShader = `
  uniform float uTime;
  uniform float uProgress;
  uniform sampler2D uKatana;
  uniform sampler2D uStarfield;

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 pos = texture2D(uPosition, uv);
    vec4 vel = texture2D(uVelocity, uv);
    vec4 katana = texture2D(uKatana, uv);
    vec4 starfield = texture2D(uStarfield, uv);

    float katanaPhase = smoothstep(0.4, 0.7, uProgress);
    float supernovaPhase = smoothstep(0.7, 0.9, uProgress);
    float starfieldPhase = smoothstep(0.9, 1.0, uProgress);
    
    pos.xyz += vel.xyz;

    pos.xyz = mix(pos.xyz, katana.xyz, katanaPhase * (1.0 - supernovaPhase));
    pos.xyz = mix(pos.xyz, starfield.xyz, starfieldPhase);

    gl_FragColor = pos;
  }
`;

export const simulationVelocityShader = `
  uniform float uTime;
  uniform float uProgress;
  uniform float uScrollVel;
  uniform vec3 uMouse;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;

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

  vec3 curlNoise(vec3 p) {
    const float e = 0.1;
    vec3 dx = vec3(e, 0.0, 0.0);
    vec3 dy = vec3(0.0, e, 0.0);
    vec3 dz = vec3(0.0, 0.0, e);
    float p_x0 = snoise(p - dx);
    float p_x1 = snoise(p + dx);
    float p_y0 = snoise(p - dy);
    float p_y1 = snoise(p + dy);
    float p_z0 = snoise(p - dz);
    float p_z1 = snoise(p + dz);
    return vec3(p_y1 - p_y0 - (p_z1 - p_z0), p_z1 - p_z0 - (p_x1 - p_x0), p_x1 - p_x0 - (p_y1 - p_y0)) / (2.0 * e);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 pos = texture2D(uPosition, uv).xyz;
    vec3 vel = texture2D(uVelocity, uv).xyz;

    float supernovaPhase = smoothstep(0.7, 0.8, uProgress);
    float starfieldPhase = smoothstep(0.9, 1.0, uProgress);

    float speedFactor = exp(uProgress * 3.0) * (1.0 + uBass * 0.5);
    
    vec3 gravityDir = normalize(-pos);
    vec3 gravityForce = gravityDir * (1.5 / (length(pos) + 0.5));
    
    // Vortex swells with mids
    vec3 vortexForce = cross(pos, vec3(0.0, 1.0, 0.0)) * (0.15 + uMid * 0.5) * speedFactor;
    
    // Curl noise complexified by treble
    vec3 fluidNoise = curlNoise(pos * (0.3 + uTreble * 0.2) + uTime * 0.2) * (0.05 + uTreble * 0.1) * speedFactor;

    // Supernova Burst reactive to Bass
    vec3 burst = normalize(pos) * supernovaPhase * (1.5 + uBass * 2.0);

    vec3 mouseDir = pos - uMouse;
    float mouseDist = length(mouseDir);
    vec3 repel = normalize(mouseDir) * (0.8 / (mouseDist * mouseDist + 0.1));

    vel += (gravityForce + vortexForce + fluidNoise + burst + repel) * 0.016;
    
    float damping = mix(0.96, 0.9, supernovaPhase);
    damping = mix(damping, 0.5, starfieldPhase); 
    vel *= damping;

    gl_FragColor = vec4(vel, 1.0);
  }
`;

export const particleVertexShader = `
  uniform sampler2D uPosition;
  uniform sampler2D uVelocity;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uTime;
  uniform vec3 uMouse;
  uniform float uProgress;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  
  varying vec3 vColor;

  void main() {
    vec4 pos = texture2D(uPosition, uv);
    vec4 vel = texture2D(uVelocity, uv);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos.xyz, 1.0);
    
    float distToMouse = length(pos.xyz - uMouse);
    float heat = 1.0 - smoothstep(0.0, 3.0, distToMouse);
    
    vec3 violet = vec3(0.6, 0.2, 1.0);
    vec3 white = vec3(1.0, 1.0, 1.0);
    vec3 plasmaOrange = vec3(1.0, 0.27, 0.0); 
    
    // Audio-reactive color shifting
    vec3 audioShift = vec3(uBass * 0.2, uMid * 0.1, uTreble * 0.3);
    vec3 baseColor = mix(violet + audioShift, white, smoothstep(0.0, 5.0, length(pos.xyz)));
    
    float burst = smoothstep(0.7, 0.85, uProgress);
    float afterglow = smoothstep(0.85, 0.9, uProgress) * (1.0 - smoothstep(0.9, 0.98, uProgress));
    
    vColor = mix(baseColor, plasmaOrange, heat);
    vColor += burst * vec3(1.0, 0.9, 0.8) * (2.0 + uBass); 
    
    vec3 afterglowColor = vec3(1.0, 0.3, 0.1);
    float flicker = 0.7 + 0.3 * sin(uTime * (12.0 + uTreble * 20.0) + pos.x * 100.0);
    vColor += afterglow * afterglowColor * flicker * 0.6;
    
    // Nuanced point sizing with treble jitter
    float trebleJitter = 1.0 + uTreble * 0.5 * sin(uTime * 50.0 + pos.z);
    gl_PointSize = uSize * uPixelRatio * (15.0 / -mvPosition.z) * trebleJitter;
    
    if(uProgress > 0.95) gl_PointSize *= 0.5;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const particleFragmentShader = `
  varying vec3 vColor;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    
    float strength = 1.0 - smoothstep(0.0, 0.5, d);
    gl_FragColor = vec4(vColor, strength);
  }
`;
