import { useEffect, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FONT } from '../utils/font';

export interface GlassSettings { text: string; angle: number; length: number; intensity: number; spread: number; haze: number; bloom: number; thickness: number; size: number; palette: string; seed: number; animate: boolean }
export const palettes: Record<string, string[]> = {
  Cathedral: ['#ff183d', '#ff6609', '#ffbd24', '#502cff', '#172bea', '#d524c9'],
  Ember: ['#ff280c', '#fa6308', '#ffa51c', '#ffc947', '#bf1431', '#ed4564'],
  Aurora: ['#2836f5', '#6854ff', '#bf2ce7', '#0b9ddc', '#29e1c9', '#466afe'],
  Crystal: ['#a0b9ff', '#c8ddff', '#838de0', '#f1e5ff', '#688ac7', '#d4baff'],
};
const vertex = `
attribute vec2 center;
attribute vec3 glassColor;
attribute float variation;
uniform vec2 viewport;
uniform float tileSize, angle, beamLength, spread, mode;
varying vec2 vUv;
varying vec3 vColor;
varying float vSeed;
void main(){
  vUv=uv; vColor=glassColor; vSeed=variation;
  vec2 p=center;
  if(mode<0.5){
    float a=angle+(center.x/viewport.x-0.5)*spread;
    vec2 direction=vec2(sin(a),-cos(a));
    vec2 across=vec2(cos(a),sin(a));
    float distance=uv.y*beamLength;
    float width=tileSize*(0.62+uv.y*(1.8+spread*3.0));
    p+=direction*distance+across*(uv.x-0.5)*width*2.0;
  }else{ p+=(uv-0.5)*tileSize*0.87; }
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,mode,1.0);
}`;
const fragment = `
precision highp float;
uniform float mode, intensity, haze, thickness, time;
varying vec2 vUv;
varying vec3 vColor;
varying float vSeed;
void main(){
  // Beer-Lambert absorption through colored glass. Linear RGB is used throughout.
  vec3 transmission=exp(log(max(vColor,vec3(0.002)))*thickness);
  float fresnel=0.96; // Normal-incidence transmission for an air/glass interface (IOR 1.5).
  if(mode<0.5){
    float t=vUv.y;
    float crossSection=exp(-pow(abs(vUv.x-0.5)*4.8,2.0));
    // Single-scattering approximation: haze scatters transmitted light into the view,
    // exponential extinction removes energy, and divergence dilutes the beam.
    float extinction=exp(-t*(2.0+haze*1.65));
    float scattering=(1.0-exp(-haze*0.7))*extinction/(1.0+t*2.5);
    float endFade=1.0-smoothstep(0.60,1.0,t);
    float texture=0.94+0.06*sin(t*31.0+vSeed*16.0+time*0.25);
    float energy=crossSection*scattering*endFade*intensity*0.18*texture;
    gl_FragColor=vec4(transmission*energy*fresnel,1.0);
  }else{
    vec2 edge=min(vUv,1.0-vUv);
    float rim=1.0-smoothstep(0.015,0.075,min(edge.x,edge.y));
    float bevel=(1.0-smoothstep(0.0,0.12,edge.y))*0.2;
    float mottling=0.90+0.1*sin(vUv.x*13.0+vSeed*40.0)*sin(vUv.y*9.0+vSeed);
    vec3 body=transmission*(0.3+intensity*0.38)*mottling;
    vec3 highlight=mix(transmission,vec3(0.7),0.22)*rim*(0.20+intensity*0.23);
    gl_FragColor=vec4(body+highlight+bevel*transmission,1.0);
  }
}`;

function glyph(character: string): number[][] {
  if (FONT[character]) return FONT[character];
  // Rasterize digits, punctuation, and other glyphs instead of silently dropping them.
  const canvas = document.createElement('canvas'); canvas.width=12; canvas.height=14;
  const ctx=canvas.getContext('2d')!; ctx.font='bold 12px monospace'; ctx.fillStyle='#fff'; ctx.textBaseline='top'; ctx.fillText(character,0,0);
  const data=ctx.getImageData(0,0,12,14).data;
  return Array.from({length:7},(_,y)=>Array.from({length:6},(_,x)=>Number(data[((y*2+1)*12+x*2)*4+3]>80)));
}
function makeGeometry(text: string, width: number, height: number, settings: GlassSettings) {
  const letters=Array.from(text.toUpperCase()).map(glyph);
  const columns=letters.reduce((n,g)=>n+g[0].length+1,0)-1;
  const tile=Math.min(width*0.73/Math.max(columns,1),height*0.019, width*0.045)*settings.size;
  const positions:number[]=[], uvs:number[]=[], centers:number[]=[], colors:number[]=[], seeds:number[]=[];
  const palette=palettes[settings.palette] || palettes.Cathedral;
  let column=0, count=0;
  for(const letter of letters){
    for(let y=0;y<7;y++) for(let x=0;x<letter[y].length;x++) if(letter[y][x]){
      const hash=Math.sin((column+x)*127.1+y*311.7+settings.seed*74.7)*43758.5453;
      const seed=hash-Math.floor(hash);
      const color=new THREE.Color(palette[Math.floor(seed*palette.length)]);
      const cx=width*0.52+(column+x-columns/2)*tile;
      const cy=height*0.66-y*tile;
      for(const [u,v] of [[0,0],[1,0],[0,1],[0,1],[1,0],[1,1]]){
        positions.push(0,0,0); uvs.push(u,v); centers.push(cx,cy); colors.push(color.r,color.g,color.b); seeds.push(seed);
      } count++;
    } column+=letter[0].length+1;
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.setAttribute('center',new THREE.Float32BufferAttribute(centers,2));
  geometry.setAttribute('glassColor',new THREE.Float32BufferAttribute(colors,3));
  geometry.setAttribute('variation',new THREE.Float32BufferAttribute(seeds,1));
  return {geometry,tile,count};
}

export function GlassStage({settings,onStats,onError,exportRef}:{ settings:GlassSettings; onStats:(s:{tiles:number;fps:number})=>void; onError:(s:string)=>void; exportRef:MutableRefObject<(()=>void)|null> }){
  const host=useRef<HTMLDivElement>(null);
  const current=useRef(settings); current.current=settings;
  useEffect(()=>{
    const mount=host.current!;
    let renderer:THREE.WebGLRenderer;
    try { renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true,powerPreference:'high-performance'}); }
    catch { onError('WebGL is unavailable. Enable hardware acceleration to render the glass.'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));
    renderer.setClearColor(0x000000); renderer.toneMapping=THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);
    const scene=new THREE.Scene();
    const camera=new THREE.OrthographicCamera(0,1,1,0,-10,10); camera.position.z=5;
    const composer=new EffectComposer(renderer);
    const renderPass=new RenderPass(scene,camera);
    const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),0.55,0.35,0.85);
    const output=new OutputPass(); composer.addPass(renderPass); composer.addPass(bloom); composer.addPass(output);
    const uniforms={viewport:{value:new THREE.Vector2()},tileSize:{value:10},angle:{value:0},beamLength:{value:400},spread:{value:0.2},intensity:{value:1},haze:{value:1},thickness:{value:1},time:{value:0}};
    const rayMaterial=new THREE.ShaderMaterial({uniforms:{...uniforms,mode:{value:0}},vertexShader:vertex,fragmentShader:fragment,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,side:THREE.DoubleSide});
    const tileMaterial=new THREE.ShaderMaterial({uniforms:{...uniforms,mode:{value:1}},vertexShader:vertex,fragmentShader:fragment,depthTest:false,depthWrite:false});
    let geometry=new THREE.BufferGeometry();
    const rays=new THREE.Mesh(geometry,rayMaterial), tiles=new THREE.Mesh(geometry,tileMaterial);
    rays.frustumCulled=tiles.frustumCulled=false; rays.renderOrder=0;tiles.renderOrder=1;scene.add(rays,tiles);
    let width=0,height=0,key='',tileCount=0,frame=0,frames=0,last=performance.now(),elapsed=0,previous=last;
    const resize=()=>{
      width=mount.clientWidth;height=mount.clientHeight;
      renderer.setSize(width,height);composer.setSize(width,height);
      camera.right=width;camera.top=height;camera.updateProjectionMatrix();uniforms.viewport.value.set(width,height);key='';
    };
    const observer=new ResizeObserver(resize); observer.observe(mount);resize();
    const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
    function render(now:number){
      frame=requestAnimationFrame(render);
      const s=current.current;
      if(s.animate&&!reducedMotion.matches) elapsed+=Math.min((now-previous)/1000,0.1);
      previous=now;
      const nextKey=JSON.stringify([s.text,s.palette,s.seed,s.size,width,height]);
      if(key!==nextKey){
        const next=makeGeometry(s.text,width,height,s);geometry.dispose();geometry=next.geometry;rays.geometry=tiles.geometry=geometry;uniforms.tileSize.value=next.tile;tileCount=next.count;key=nextKey;
      }
      uniforms.angle.value=(s.angle+(s.animate&&!reducedMotion.matches?Math.sin(elapsed*0.16)*6:0))*Math.PI/180;
      uniforms.beamLength.value=Math.min(height,width*1.1)*s.length;uniforms.spread.value=s.spread;
      uniforms.intensity.value=s.intensity;uniforms.haze.value=s.haze;uniforms.thickness.value=s.thickness;uniforms.time.value=elapsed;
      rays.visible=s.length>0&&s.intensity>0&&s.haze>0;bloom.strength=s.bloom;
      if(!document.hidden) composer.render();
      frames++;if(now-last>=800){onStats({tiles:tileCount,fps:Math.round(frames*1000/(now-last))});frames=0;last=now;}
    }
    frame=requestAnimationFrame(render);
    exportRef.current=()=>{composer.render();renderer.domElement.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='stained-glass.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'image/png');};
    const lost=(event:Event)=>{event.preventDefault();onError('The graphics context was interrupted. Reload to restore the scene.');};
    renderer.domElement.addEventListener('webglcontextlost',lost);
    return ()=>{cancelAnimationFrame(frame);observer.disconnect();exportRef.current=null;renderer.domElement.removeEventListener('webglcontextlost',lost);geometry.dispose();rayMaterial.dispose();tileMaterial.dispose();bloom.dispose();output.dispose();composer.dispose();renderer.dispose();renderer.domElement.remove();};
  },[onStats,onError,exportRef]);
  return <div ref={host} className="glass-canvas" role="img" aria-label={`Colored stained glass spelling ${settings.text || 'nothing'}, with transmitted light beams`} />;
}


