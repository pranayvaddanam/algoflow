/**
 * Silk — Three.js procedural 3D animated background.
 *
 * Renders a full-viewport plane mesh with a custom ShaderMaterial using
 * simplex noise to create an organic, flowing, abstract animation in
 * dark green/teal tones. Positioned fixed behind all content.
 *
 * Color palette: #0a0f0d base, subtle #137636 primary, hints of #5dcaa5.
 * Designed to be very subtle — a background, not a distraction.
 */

import { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface SilkProps {
  /** Additional CSS classes for the container. */
  className?: string;

  /** Animation speed multiplier (default 0.3). */
  speed?: number;

  /** Overall opacity of the effect (default 0.4). */
  opacity?: number;
}

/**
 * Vertex shader — passes UV coordinates to fragment shader.
 */
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Fragment shader — simplex noise-based organic flow.
 *
 * Uses a 3D noise function seeded with UV + time to create flowing
 * color bands in the AlgoFlow green palette. Multiple octaves for
 * depth and complexity.
 */
const fragmentShader = `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec2 uResolution;

  varying vec2 vUv;

  //
  // Simplex 3D noise (Ashima Arts)
  //
  vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 1.0 / 7.0;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vec2 uv = vUv;

    // Aspect-corrected coordinates
    float aspect = uResolution.x / uResolution.y;
    vec2 st = vec2(uv.x * aspect, uv.y);

    // Multiple noise octaves for organic depth
    float n1 = snoise(vec3(st * 1.5, uTime * 0.15)) * 0.5 + 0.5;
    float n2 = snoise(vec3(st * 3.0 + 5.0, uTime * 0.1)) * 0.5 + 0.5;
    float n3 = snoise(vec3(st * 0.8 - 3.0, uTime * 0.08)) * 0.5 + 0.5;

    // Color palette — dark greens matching AlgoFlow design system
    vec3 bgDark = vec3(0.039, 0.059, 0.051);    // #0a0f0d
    vec3 primary = vec3(0.075, 0.463, 0.212);    // #137636
    vec3 streamGreen = vec3(0.365, 0.792, 0.647); // #5dcaa5
    vec3 teal = vec3(0.055, 0.235, 0.165);        // dark teal midtone

    // Mix colors based on noise layers
    vec3 color = bgDark;
    color = mix(color, teal, n1 * 0.4);
    color = mix(color, primary, n2 * 0.2);
    color = mix(color, streamGreen, n3 * 0.08);

    // Vignette — darken edges for depth
    float vignette = 1.0 - smoothstep(0.3, 1.2, length(uv - 0.5) * 1.4);
    color *= mix(0.6, 1.0, vignette);

    gl_FragColor = vec4(color, uOpacity);
  }
`;

/**
 * Silk background component.
 *
 * Creates a full-viewport Three.js canvas with a procedural noise
 * animation. Positioned fixed behind all content with -z-10.
 * Cleans up renderer and animation frame on unmount.
 */
export function Silk({ className, speed = 0.3, opacity = 0.4 }: SilkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameIdRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Shader material
    const uniforms = {
      uTime: { value: 0.0 },
      uOpacity: { value: opacity },
      uResolution: {
        value: new THREE.Vector2(container.clientWidth, container.clientHeight),
      },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
    });

    // Full-screen plane
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Animation loop
    const clock = new THREE.Clock();

    function animate() {
      frameIdRef.current = requestAnimationFrame(animate);
      uniforms.uTime.value = clock.getElapsedTime() * speed;
      renderer.render(scene, camera);
    }

    animate();

    // Resize handler
    function handleResize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(w, h);
    }

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameIdRef.current);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      rendererRef.current = null;
    };
  }, [speed, opacity]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 -z-10 ${className ?? ''}`}
      aria-hidden="true"
    />
  );
}
