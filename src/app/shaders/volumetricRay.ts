import * as THREE from 'three';

export const volumetricRayVertexShader = `
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

export const volumetricRayFragmentShader = `
uniform vec3 uColor;
uniform float uTime;
uniform float uIntensity;
uniform float uAttenuation;
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;

// Simple 3D noise function
vec4 perm(vec4 x){return mod(((x * 34.0) + 1.0) * x, 289.0);}
float noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}

void main() {
    // vertical gradient: assuming vUv.y=1 is top, vUv.y=0 is bottom
    float verticalFade = smoothstep(0.0, 1.0, vUv.y);
    verticalFade = pow(verticalFade, uAttenuation);
    
    // soft edges based on viewing angle
    float viewDot = abs(vNormal.z); 
    float edgeFade = smoothstep(0.0, 1.0, viewDot);
    
    // Noise shimmer
    float n1 = noise(vWorldPosition * 2.0 - vec3(0.0, uTime * 1.5, 0.0));
    float n2 = noise(vWorldPosition * 4.0 - vec3(uTime * 0.5, uTime * 2.0, uTime * 0.5));
    float shimmer = 0.5 + 0.5 * (n1 * 0.7 + n2 * 0.3);
    
    float alpha = verticalFade * edgeFade * shimmer * uIntensity;
    
    gl_FragColor = vec4(uColor, alpha);
}
`;

export function createRayMaterial(colorHex: string) {
    return new THREE.ShaderMaterial({
        uniforms: {
            uColor: { value: new THREE.Color(colorHex) },
            uTime: { value: 0.0 },
            uIntensity: { value: 1.0 },
            uAttenuation: { value: 1.0 }
        },
        vertexShader: volumetricRayVertexShader,
        fragmentShader: volumetricRayFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
    });
}
