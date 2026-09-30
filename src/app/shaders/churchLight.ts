export const churchVertex = `
varying vec2 vUv;
void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }
`;

export const churchFragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D artwork, scatterMap;
uniform vec2 resolution, grid, windowSize;
uniform vec3 sunDirection, sunColor, eyePosition;
uniform float intensity, haze, anisotropy, thickness, roughness, lead, sunSize;
uniform float ambient, floorReflectance, zoom, clockTime, steps;
const float floorY=-2.4;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.0),f.x),f.y);}
vec4 pane(vec2 uv, float soften){
  if(any(lessThan(uv,vec2(0.0)))||any(greaterThan(uv,vec2(1.0)))) return vec4(0.0);
  vec4 pixel=soften>0.1?texture2D(scatterMap,vec2(uv.x,1.0-uv.y)):texture2D(artwork,vec2(uv.x,1.0-uv.y));
  vec2 cell=fract(uv*grid);
  float edge=min(min(cell.x,1.0-cell.x),min(cell.y,1.0-cell.y));
  float openPane=smoothstep(lead*0.5,lead*0.5+max(0.015,soften),edge);
  if(soften>0.1) openPane=(1.0-lead)*(1.0-lead);
  // Pigment transmittance is linear, with absorption over the refracted path length.
  float cosInside=sqrt(1.0-(1.0-sunDirection.z*sunDirection.z)/(1.5*1.5));
  vec3 pigment=pow(max(pixel.rgb,vec3(0.025)),vec3(2.2));
  vec3 transmitted=exp(log(pigment)*thickness/max(cosInside,0.1));
  float F=0.04+0.96*pow(1.0-abs(sunDirection.z),5.0);
  float ripple=1.0-roughness*0.16*noise(uv*grid*3.0);
  return vec4(transmitted*(1.0-F)*(1.0-F)*ripple,pixel.a*openPane);
}
vec2 windowUV(vec2 p){return (p-vec2(0.0,0.35))/windowSize+0.5;}
vec3 transmittedAt(vec3 p, vec2 disk, float volume){
  if(p.z<0.0) return vec3(0.0);
  // Backtrace toward an extended sun. Its angular diameter controls the penumbra.
  vec3 d=normalize(sunDirection+vec3(disk*sunSize*0.00872665,0.0));
  float path=p.z/max(d.z,0.08);
  vec2 hit=p.xy-d.xy*path;
  // A flat parallel pane preserves the outgoing direction; handmade surface slopes
  // perturb it slightly. This is a small-slope approximation, not a caustic solver.
  vec2 distortion=vec2(noise(hit*8.0),noise(hit*8.0+13.0))-0.5;
  hit+=distortion*roughness*0.022*path;
  vec4 glass=pane(windowUV(hit),mix(0.025,0.2,volume));
  return glass.rgb*glass.a*exp(-haze*path);
}
vec3 floorLight(vec3 p){
  vec3 sum=transmittedAt(p,vec2(0.0),0.0);
  for(int i=0;i<6;i++){
    float a=float(i)*1.04719755;
    sum+=transmittedAt(p,vec2(cos(a),sin(a))*0.78,0.0);
  }
  return sum/7.0;
}
void main(){
  vec2 screen=(vUv-0.5)*2.0;
  screen.x*=resolution.x/resolution.y;
  vec3 ro=eyePosition;
  vec3 forward=normalize(vec3(0.0,-0.55,1.0)-ro);
  vec3 right=normalize(cross(forward,vec3(0,1,0)));
  vec3 up=cross(right,forward);
  vec3 rd=normalize(forward+right*screen.x*0.52/zoom+up*screen.y*0.52/zoom);
  float wallT=rd.z<0.0?-ro.z/rd.z:100.0;
  float floorT=rd.y<0.0?(floorY-ro.y)/rd.y:100.0;
  float distance=min(wallT,floorT);
  vec3 point=ro+rd*distance;
  vec3 surface=vec3(0.0);
  if(floorT<wallT){
    vec2 tile=point.xz*vec2(0.8,0.6);tile.x+=mod(floor(tile.y),2.0)*0.5;
    vec2 seam=min(fract(tile),1.0-fract(tile));
    float mortar=smoothstep(0.006,0.022,min(seam.x,seam.y));
    float stone=0.70+noise(point.xz*13.0)*0.20+noise(point.xz*85.0)*0.10;
    vec3 albedo=vec3(0.37,0.34,0.29)*stone*mix(0.46,1.0,mortar)*floorReflectance;
    // Lambertian irradiance on stone; the cosine changes with solar elevation.
    surface=albedo*(ambient+floorLight(point)*sunColor*intensity*max(-sunDirection.y,0.0)*2.5);
  }else{
    vec2 uv=windowUV(point.xy);
    vec4 glass=pane(uv,0.012);
    float stone=noise(point.xy*22.0)*0.2+0.8;
    float joints=smoothstep(0.006,0.02,min(fract(point.x*0.7),fract(point.y*1.4)));
    surface=vec3(0.23,0.215,0.195)*ambient*stone*mix(0.65,1.0,joints);
    // Glass receives incident sunlight; lead and opaque cells block it.
    surface=mix(surface,glass.rgb*sunColor*intensity*0.55,glass.a);
    if(all(greaterThan(uv,vec2(0)))&&all(lessThan(uv,vec2(1)))){
      vec4 cell=texture2D(artwork,vec2(uv.x,1.0-uv.y));
      surface+=vec3(0.045)*cell.a*(1.0-glass.a)*ambient;
    }
  }
  // Integrate single scattering along the camera ray in world space. No per-pixel
  // glowing tubes: every sample sees the same aperture and directional sunlight.
  vec3 volume=vec3(0.0);
  float segment=min(distance,22.0)/steps;
  float jitter=hash(gl_FragCoord.xy);
  float g=anisotropy;
  float mu=dot(sunDirection,-rd);
  float phase=(1.0-g*g)/(12.5663706*pow(max(0.01,1.0+g*g-2.0*g*mu),1.5));
  for(int i=0;i<72;i++){
    if(float(i)>=steps) break;
    float t=(float(i)+jitter)*segment;
    vec3 p=ro+rd*t;
    if(p.y<floorY||p.z<0.0||p.z>12.0) continue;
    vec3 incident=transmittedAt(p,vec2(0.0),1.0);
    float dust=0.90+0.10*noise(p.xz*2.0+vec2(clockTime*0.025,p.y));
    volume+=incident*sunColor*intensity*haze*0.92*phase*exp(-haze*t)*segment*dust*5.0;
  }
  vec3 color=surface*exp(-haze*distance)+volume;
  // Very subtle lens vignette, with all energy accumulated before tone mapping.
  color*=1.0-0.15*smoothstep(0.25,1.5,length(vUv-0.5));
  gl_FragColor=vec4(color,1.0);
}
`;
