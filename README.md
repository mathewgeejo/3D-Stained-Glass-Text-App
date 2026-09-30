
  # 3D Stained Glass Text App

  This is a code bundle for 3D Stained Glass Text App. The original project is available at https://www.figma.com/design/h145hd7LD0C58gxXKT9mdI/3D-Stained-Glass-Text-App.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
## Stained Glass Studio

The app opens in **Classic Light**, the black-stage text renderer from commit `5dfc606`. Enable **Room simulation** in the top bar to use the room, workshop, and advanced light controls. Disable it to return to Classic. Each version keeps its own edits while switching; only the visible renderer runs. Reloading always starts in Classic, and room projects remain saved locally for the next time you enable the room.

`src/app/App.tsx` switches between `ClassicStudio.tsx` and `Studio.tsx`. Classic uses the original `components/GlassStage.tsx` renderer. In the room version, `components/NaturalStage.tsx` manages Three.js and `shaders/churchLight.ts` renders a perspective room with a stained-glass aperture, participating air, and a stone receiving floor.

Choose Text, Window, or Pixel Art at the top. Open Workshop edits the current window; Edit as Pixels converts typed text into editable artwork. The workshop supports a brush, eraser, connected flood fill, color picker, custom colors, mirrored strokes, grid resizing, undo/redo, and Gothic, rose, diamond, heart, and mosaic templates. Clear is undoable. PNG/JPEG/WebP import fits an image to the grid; transparent cells become opaque wall, and white painted cells act as clear glass. Pixel PNG exports the artwork with transparent empty cells.

Drag the scene horizontally/vertically to adjust sunlight azimuth/elevation. Light & Scene includes four lighting presets and controls for solar angular diameter, warmth, strength, haze, scattering directionality, glass thickness, handmade surface texture, lead seam width, floor reflectance, ambient illumination, exposure, bloom, window scale, camera angle/height/zoom, sun drift, and rendering quality. A solar diameter around 0.53 degrees is a useful starting point. Sunlight casts the actual painted pattern onto the floor; lowering the sun lengthens the projection. Zero haze removes atmospheric shafts while preserving the floor illumination.

Save PNG exports the room without the HUD. Save/Open Project round-trip the artwork and settings as a validated version-2 JSON file. The latest draft is also saved locally in the browser after edits. Reset Light preserves the artwork. Draft storage is local to the browser and origin; use a project file for backups or transfer.

### Light transport and limits

The shader backtraces sunlight through the glass texture at each receiving point, integrating single scattering along camera rays in world space. It uses linear-RGB Beer-Lambert pigment absorption with refracted path length, approximate two-interface Schlick Fresnel transmission (IOR 1.5), exponential atmospheric extinction on the light and view paths, a Henyey–Greenstein phase function, and Lambertian floor illumination. Seven solar-disk samples soften the floor projection. Filtered glass samples and averaged lead coverage reduce aliasing in the volume; visible panes and the floor retain explicit lead seams.

This is a real-time approximation, not a spectral path tracer. Glass microstructure uses a small-slope distortion approximation; focused caustics, multiple scattering, full indirect illumination, and complex room geometry are not simulated. Ambient room light is an artistic control. The reference formulas are described in PBRT's [transmittance](https://pbr-book.org/4ed/Volume_Scattering/Transmittance), [phase functions](https://www.pbr-book.org/4ed/Volume_Scattering/Phase_Functions), and [specular transmission](https://www.pbr-book.org/4ed/Reflection_Models/Specular_Reflection_and_Transmission) chapters.

WebGL2 and hardware acceleration are required. High quality uses 72 volume samples and a 700,000-pixel render budget; Fast uses 32 samples and 280,000 pixels. Static scenes render on changes, and hidden tabs pause rendering. Sun drift respects reduced-motion preferences. GPU resources are disposed on unmount.

Validation: browser checks cover shader compilation, scene controls, haze changes, templates, clear/undo/redo, flood fill, mirrored painting, erasing, image import, text, lighting presets, PNG/project export, project loading and invalid-file rejection, draft persistence, and mobile overflow. The active TypeScript dependency graph was checked with TypeScript 5.9.3. No production build was run.
