import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useAppContext, PALETTES } from '../store';
import { volumetricRayVertexShader, volumetricRayFragmentShader } from '../shaders/volumetricRay';

export const Scene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { grid, paletteName, rayIntensity, rayAttenuation, bloomIntensity, triggerExport } = useAppContext();
  const sceneRef = useRef<THREE.Scene | null>(null);
  const materialsRef = useRef<THREE.ShaderMaterial[]>([]);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    
    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0a0c');
    sceneRef.current = scene;

    // Setup camera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    // position camera to look at the text
    camera.position.set(5, -10, 35);

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, -5, 0);

    // Post processing
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), bloomIntensity, 0.4, 0.85);
    bloomPassRef.current = bloomPass;
    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // Animation loop
    const clock = new THREE.Clock();
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      
      // Update shader uniforms
      materialsRef.current.forEach(mat => {
        if (mat.uniforms.uTime) {
          mat.uniforms.uTime.value = elapsedTime;
        }
      });

      controls.update();
      composer.render();
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []); // Run once on mount

  // Update scene based on state
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear existing objects
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    const palette = PALETTES[paletteName] || PALETTES['Classic Stained'];
    materialsRef.current = [];

    const rows = grid.length;
    const cols = grid[0]?.length || 0;
    
    // Center the group
    const group = new THREE.Group();
    group.position.set(-cols * 0.5, rows * 0.5, 0);
    // Tilt the whole structure backwards slightly
    group.rotation.x = -Math.PI / 4; 
    
    const rayLength = 30; // Longer rays
    
    // Geometries
    // Flatter boxes for stained glass feel
    const boxGeo = new THREE.BoxGeometry(0.9, 0.9, 0.2); 
    // Cone shape spreading out
    const rayGeo = new THREE.CylinderGeometry(0.45, 1.2, rayLength, 16, 1, true);
    // Move ray origin to top so it scales downwards easily
    rayGeo.translate(0, -rayLength / 2, 0);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        if (cell && cell.active) {
          const colorHex = palette[cell.colorIndex % palette.length];
          const color = new THREE.Color(colorHex);
          
          // Glass tile
          const glassMat = new THREE.MeshPhysicalMaterial({
            color: color,
            transmission: 0.9,
            opacity: 1,
            metalness: 0,
            roughness: 0.1,
            ior: 1.5,
            thickness: 0.5,
            side: THREE.DoubleSide
          });
          const glassMesh = new THREE.Mesh(boxGeo, glassMat);
          glassMesh.position.set(c, -r, 0);
          group.add(glassMesh);

          // Volumetric Ray
          const rayMat = new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: color },
                uTime: { value: 0.0 },
                uIntensity: { value: rayIntensity },
                uAttenuation: { value: rayAttenuation }
            },
            vertexShader: volumetricRayVertexShader,
            fragmentShader: volumetricRayFragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
          });
          materialsRef.current.push(rayMat);
          
          const rayMesh = new THREE.Mesh(rayGeo, rayMat);
          // Position ray just below the glass tile
          rayMesh.position.set(c, -r - 0.45, 0);
          group.add(rayMesh);
        }
      }
    }

    scene.add(group);

  }, [grid, paletteName, rayIntensity, rayAttenuation]); // Re-render objects when grid or styling changes

  // Update effect intensities without recreating objects
  useEffect(() => {
    materialsRef.current.forEach(mat => {
      mat.uniforms.uIntensity.value = rayIntensity;
      mat.uniforms.uAttenuation.value = rayAttenuation;
    });
  }, [rayIntensity, rayAttenuation]);

  useEffect(() => {
    if (bloomPassRef.current) {
      bloomPassRef.current.strength = bloomIntensity;
    }
  }, [bloomIntensity]);

  useEffect(() => {
    if (triggerExport > 0 && rendererRef.current) {
        const dataURL = rendererRef.current.domElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'stained-glass-3d.png';
        link.href = dataURL;
        link.click();
    }
  }, [triggerExport]);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full overflow-hidden bg-black" />;
};
