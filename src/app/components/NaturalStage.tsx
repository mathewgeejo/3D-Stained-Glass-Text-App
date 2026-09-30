import { useEffect, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { type Artwork, type StudioSettings } from '../glassModel';
import { churchFragment, churchVertex } from '../shaders/churchLight';

export function NaturalStage({ settings, artwork, onStats, onError, exportRef }: {
  settings: StudioSettings; artwork: Artwork; onStats: (s: { tiles: number; fps: number }) => void;
  onError: (s: string) => void; exportRef: MutableRefObject<(() => void) | null>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const current = useRef({ settings, artwork }); current.current = { settings, artwork };
  useEffect(() => {
    const mount = host.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' }); }
    catch { onError('Enable hardware acceleration and reload to use the light simulator.'); return; }
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), camera = new THREE.Camera();
    let texture = new THREE.DataTexture(new Uint8Array(4), 1, 1);
    let scatterTexture = new THREE.DataTexture(new Uint8Array(4), 1, 1);
    const uniforms = {
      artwork: { value: texture }, scatterMap: { value: scatterTexture }, resolution: { value: new THREE.Vector2(1, 1) }, grid: { value: new THREE.Vector2(1, 1) },
      windowSize: { value: new THREE.Vector2(3, 4) }, sunDirection: { value: new THREE.Vector3() }, sunColor: { value: new THREE.Color() }, eyePosition: { value: new THREE.Vector3() },
      intensity: { value: 5 }, haze: { value: 0.1 }, anisotropy: { value: 0.35 }, thickness: { value: 0.7 }, roughness: { value: 0.2 }, lead: { value: 0.09 }, sunSize: { value: 0.6 },
      ambient: { value: 0.1 }, floorReflectance: { value: 0.65 }, zoom: { value: 1 }, clockTime: { value: 0 }, steps: { value: 64 },
    };
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader: churchVertex, fragmentShader: churchFragment, depthTest: false, depthWrite: false });
    const geometry = new THREE.PlaneGeometry(2, 2); scene.add(new THREE.Mesh(geometry, material));
    const composer = new EffectComposer(renderer), bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.22, 0.35, 0.8), output = new OutputPass();
    composer.addPass(new RenderPass(scene, camera)); composer.addPass(bloom); composer.addPass(output);
    let previousArt: Artwork | null = null, quality = '', count = 0, frame = 0, frames = 0, last = performance.now(), previous = last, time = 0;
    let lastSettings: StudioSettings | null = null, dirty = true;
    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      const limit = current.current.settings.quality === 'high' ? 700000 : 280000;
      renderer.setPixelRatio(Math.min(devicePixelRatio, Math.sqrt(limit / Math.max(1, w * h))));
      renderer.setSize(w, h); composer.setSize(w, h); uniforms.resolution.value.set(w, h);
      dirty = true;
    };
    const observer = new ResizeObserver(resize); observer.observe(mount); resize();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    function render(now: number) {
      frame = requestAnimationFrame(render);
      if (document.hidden) { previous = now; return; }
      const { settings: s, artwork: art } = current.current;
      if (!dirty && s === lastSettings && art === previousArt && (!s.animate || reduced.matches)) return;
      if (s.animate && !reduced.matches) time += Math.min((now - previous) / 1000, 0.1) * s.speed;
      previous = now;
      if (quality !== s.quality) { quality = s.quality; resize(); }
      if (previousArt !== art) {
        const bytes = new Uint8Array(art.width * art.height * 4); count = 0;
        art.cells.forEach((hex, i) => { if (!hex) return; const n = parseInt(hex.slice(1), 16); bytes.set([n >> 16, (n >> 8) & 255, n & 255, 255], i * 4); count++; });
        texture.dispose(); texture = new THREE.DataTexture(bytes, art.width, art.height); texture.needsUpdate = true;
        texture.magFilter = texture.minFilter = THREE.NearestFilter; uniforms.artwork.value = texture;
        scatterTexture.dispose(); scatterTexture = new THREE.DataTexture(bytes, art.width, art.height);
        scatterTexture.magFilter = scatterTexture.minFilter = THREE.LinearFilter; scatterTexture.needsUpdate = true;
        uniforms.scatterMap.value = scatterTexture;
        uniforms.grid.value.set(art.width, art.height); previousArt = art;
      }
      const aspect = art.width / art.height;
      const wh = Math.min(4.3, 5.7 / aspect) * s.size;
      uniforms.windowSize.value.set(wh * aspect, wh);
      const az = (s.azimuth + (s.animate && !reduced.matches ? Math.sin(time * 0.12) * 12 : 0)) * Math.PI / 180, el = s.elevation * Math.PI / 180;
      uniforms.sunDirection.value.set(Math.sin(az) * Math.cos(el), -Math.sin(el), Math.cos(az) * Math.cos(el));
      uniforms.sunColor.value.setRGB(1, 1 - s.warmth * 0.24, 1 - s.warmth * 0.58);
      const yaw = s.cameraYaw * Math.PI / 180;
      uniforms.eyePosition.value.set(Math.sin(yaw) * 8.5, s.cameraHeight, Math.cos(yaw) * 8.5);
      for (const key of ['intensity', 'haze', 'anisotropy', 'thickness', 'roughness', 'lead', 'sunSize', 'ambient', 'zoom'] as const) uniforms[key].value = s[key];
      uniforms.floorReflectance.value = s.floor; uniforms.clockTime.value = time;
      uniforms.steps.value = s.quality === 'high' ? 72 : 32;
      // Pull back on tall screens so the entire window fits.
      uniforms.zoom.value *= Math.min(1, mount.clientWidth / mount.clientHeight * 1.45);
      bloom.strength = s.bloom; renderer.toneMappingExposure = s.exposure; composer.render();
      dirty = false; lastSettings = s;
      frames++; if (!s.animate || now - last > 900) { onStats({ tiles: count, fps: s.animate ? Math.round(frames * 1000 / (now - last)) : 0 }); frames = 0; last = now; }
    }
    frame = requestAnimationFrame(render);
    exportRef.current = () => { composer.render(); renderer.domElement.toBlob(blob => { if (!blob) return; const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'stained-glass-studio.png'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }); };
    const lost = (e: Event) => { e.preventDefault(); onError('The graphics context was interrupted. Save your project and reload to restore the scene.'); };
    renderer.domElement.addEventListener('webglcontextlost', lost);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); exportRef.current = null; renderer.domElement.removeEventListener('webglcontextlost', lost); texture.dispose(); scatterTexture.dispose(); material.dispose(); geometry.dispose(); bloom.dispose(); output.dispose(); composer.dispose(); renderer.dispose(); renderer.domElement.remove(); };
  }, [onStats, onError, exportRef]);
  return <div ref={host} className="glass-canvas" role="img" aria-label="Sunlight passing through stained glass into a stone room" />;
}
