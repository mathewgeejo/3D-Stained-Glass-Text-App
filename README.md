
  # 3D Stained Glass Text App

  This is a code bundle for 3D Stained Glass Text App. The original project is available at https://www.figma.com/design/h145hd7LD0C58gxXKT9mdI/3D-Stained-Glass-Text-App.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
## Stained Glass Type renderer

The active application is `src/app/App.tsx`; the renderer is `src/app/components/GlassStage.tsx`. React and Vite provide the UI, and Three.js runs batched glass and beam geometry with custom GLSL shaders, HDR bloom, and output tone mapping.

Type in the bottom field or open Controls. Drag the stage to change light direction. Controls include light intensity, beam length, source divergence, haze density, bloom, optical thickness, palette, tile scale, and optional slow movement. Save PNG exports the rendered scene without the HUD. Reset restores the reference-inspired TAKE TWO composition.

Lighting is a real-time visual approximation: linear-RGB Beer-Lambert glass absorption, approximate normal-incidence Fresnel transmission, additive single scattering, exponential atmospheric extinction, and beam divergence. It is not a spectral path tracer: full refraction, inter-pane occlusion, and physical caustics are not simulated. The reference is a stylized light-trail composition, which the default camera and light settings reproduce in that style.

WebGL2 and hardware acceleration are required. Animation honors reduced-motion preferences. Geometry is rebuilt only for text, palette, seed, scale, or viewport changes; lighting controls update uniforms.
