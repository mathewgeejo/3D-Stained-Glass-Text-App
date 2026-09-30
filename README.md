# 3D Stained Glass Text App

An interactive React and Three.js studio for turning text and pixel artwork into stained-glass compositions. The app renders colored light, atmospheric haze, glass texture, lead seams, and floor projections in real time.

The project was originally designed in Figma Make: [3D Stained Glass Text App

## Contents

- [Overview](#overview)
- [Features](#features)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Using the studio](#using-the-studio)
- [Artwork workshop](#artwork-workshop)
- [Lighting and scene controls](#lighting-and-scene-controls)
- [Saving and exporting](#saving-and-exporting)
- [Rendering model and limitations](#rendering-model-and-limitations)
- [Project structure](#project-structure)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Attributions](#attributions)

## Overview

The app has two visual modes:

1. **Classic Light** — the original black-stage renderer for stained-glass text, windows, and pixel artwork.
2. **Room Simulation** — a perspective room with a stained-glass opening, volumetric sunlight, atmospheric scattering, and a stone receiving floor.

The app opens in Classic Light. Enable **Room simulation** to switch to the room renderer. Each renderer keeps its own edits while switching, and only the active renderer is running. Reloading returns to Classic Light; the latest Room Simulation draft remains available in local browser storage.

Both renderers support three creation modes:

- **Text** — type up to 32 characters and generate a stained-glass composition.
- **Window** — start from a window template and customize it.
- **Pixel Art** — create or edit an artwork grid directly.

## Features

- Real-time WebGL2 stained-glass rendering with Three.js
- Text rendered as colored glass panes
- Gothic, rose, diamond, pixel-heart, and mosaic templates
- Pixel workshop with brush, eraser, color picker, flood fill, custom colors, and mirrored strokes
- Undo and redo for artwork changes, including clearing and template changes
- Editable grid dimensions and image import
- PNG, JPEG, and WebP image import with grid fitting
- PNG export for the rendered scene
- Transparent pixel-art PNG export
- Versioned JSON project save/load
- Automatic local draft persistence in the browser
- Classic Light and Room Simulation renderers
- Lighting presets and detailed scene controls
- High-quality and fast rendering modes
- Reduced-motion support for animated sun drift
- Mobile-friendly controls and overflow handling

## Requirements

- Node.js with npm
- A modern browser with WebGL2 and hardware acceleration
- A GPU capable of running real-time Three.js shaders

WebGL2 is required. If the browser cannot create a WebGL2 context, the renderer displays an error and scene export is disabled.

## Getting started

Install the dependencies from the project directory:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

The project also includes a production build script:

```bash
npm run build
```

## Using the studio

### 1. Choose a creation mode

Use the mode switch at the top of the screen:

- **Text:** edit the text field in the creation dock. Use **RESHUFFLE TEXT COLORS** to generate a different color arrangement without changing the text.
- **Window:** choose a starting template from the window selector.
- **Pixel Art:** work directly with the current artwork grid.

### 2. Open the workshop

Select **EDIT AS PIXELS** from Text mode or **OPEN WORKSHOP** from Window/Pixel Art mode. Opening the workshop converts generated text into editable cells when necessary.

### 3. Adjust the scene

In Classic Light, open **CONTROLS**. In Room Simulation, open **LIGHT & SCENE**. You can also drag across the scene to change the light direction:

- Classic Light changes the light angle.
- Room Simulation changes sunlight azimuth and elevation.

### 4. Export or save the result

- Use **SAVE PNG** to export the current rendered scene without the HUD.
- Use **SAVE PROJECT** in Room Simulation to save artwork and settings as JSON.
- Use **OPEN PROJECT** to restore a previously saved project.

## Artwork workshop

The workshop edits a grid of stained-glass cells. A colored cell represents painted glass; an empty cell represents an unpainted/transparent cell in the artwork model.

Available tools include:

- Brush painting
- Erasing
- Connected flood fill
- Color picking from existing cells
- Custom color selection
- Mirrored strokes
- Grid resizing
- Undo and redo
- Clear, with undo support
- PNG/JPEG/WebP image import
- Pixel PNG export

When importing an image, it is fitted to the current grid. Transparent image pixels become wall/empty cells, while white painted cells are treated as clear glass by the renderer. Pixel PNG exports preserve transparent empty cells.

## Lighting and scene controls

Room Simulation exposes the following groups of controls.

### Sunlight

- Sun direction / azimuth
- Sun elevation
- Sunlight strength
- Sun warmth
- Sun angular diameter

A smaller angular diameter produces sharper projections. Lower sun elevation creates longer pools of colored light on the floor. A solar diameter near `0.53°` is a useful real-world starting point.

### Air and glass

- Haze density
- Forward-scattering directionality
- Glass thickness
- Handmade glass texture
- Lead seam width

Setting haze to zero removes visible atmospheric shafts while preserving direct floor illumination.

### Room and lens

- Room ambient light
- Stone floor reflectance
- Camera exposure
- Lens bloom
- Camera rotation around the window
- Camera height
- Camera zoom

### Composition and palette

- Window scale
- Paint palette
- Palette application to existing artwork
- Text color reshuffling

### Motion and quality

- Sun drift toggle
- Time speed
- High quality: 72 volume samples and a 700,000-pixel render budget
- Fast quality: 32 volume samples and a 280,000-pixel render budget

Static scenes render when settings change. Hidden tabs pause rendering, and sun drift respects the browser's reduced-motion preference.

## Saving and exporting

### Local drafts

Room Simulation automatically saves the latest artwork and settings to browser `localStorage` under the app's versioned storage key. Drafts are local to the current browser and origin; they are not synced between browsers or devices.

Use a project file when you need a portable backup or want to transfer work to another browser.

### Project files

Room projects are saved as validated version-2 JSON files containing:

- Studio settings
- Artwork dimensions
- Artwork cell colors
- Project version metadata

Project files must be under 2 MB. Invalid files, unsupported versions, missing settings, and malformed artwork are rejected without replacing the current project.

### Image exports

- **Scene PNG:** exports the current Classic Light or Room Simulation render without the interface HUD.
- **Pixel PNG:** exports the current workshop artwork with transparent empty cells.

## Rendering model and limitations

The Room Simulation shader backtraces sunlight through the glass texture at each receiving point and integrates single scattering along camera rays in world space. It uses:

- Linear-RGB Beer–Lambert pigment absorption
- Refracted glass path length
- Approximate two-interface Schlick Fresnel transmission with IOR `1.5`
- Exponential atmospheric extinction on light and view paths
- A Henyey–Greenstein phase function
- Lambertian floor illumination
- Seven solar-disk samples to soften floor projections
- Filtered glass samples and averaged lead coverage to reduce aliasing
- Explicit lead seams in both visible panes and floor projections

This is a real-time approximation, not a spectral path tracer. It does not simulate focused caustics, multiple scattering, full indirect illumination, or complex room geometry. Glass microstructure uses a small-slope distortion approximation, and ambient room light is an artistic control.

The shader references are documented in PBRT's chapters on [transmittance](https://pbr-book.org/4ed/Volume_Scattering/Transmittance), [phase functions](https://www.pbr-book.org/4ed/Volume_Scattering/Phase_Functions), and [specular transmission](https://pbr-book.org/4ed/Reflection_Models/Specular_Reflection_and_Transmission).

## Project structure

```text
.
├── index.html                    Vite HTML entry point
├── package.json                  Scripts and dependencies
├── vite.config.ts                Vite configuration
├── default_shadcn_theme.css      Theme tokens from the original design setup
├── ATTRIBUTIONS.md               Third-party credits and licenses
├── src/
│   ├── main.tsx                  React entry point
│   ├── app/
│   │   ├── App.tsx               Classic/Room renderer switch
│   │   ├── ClassicStudio.tsx     Classic Light experience
│   │   ├── Studio.tsx            Room Simulation experience
│   │   ├── glassModel.ts         Artwork, settings, templates, validation
│   │   ├── store.tsx             Shared app context and palettes
│   │   ├── components/
│   │   │   ├── GlassStage.tsx     Classic Three.js renderer
│   │   │   ├── NaturalStage.tsx   Room Three.js renderer
│   │   │   ├── WindowEditor.tsx   Workshop editor
│   │   │   ├── PixelEditor.tsx    Pixel editing UI
│   │   │   └── ui/                Reusable UI primitives
│   │   ├── shaders/
│   │   │   ├── churchLight.ts     Room lighting shader
│   │   │   └── volumetricRay.ts   Classic volumetric shader
│   │   └── utils/                 Color, font, and application helpers
│   └── styles/                    Global, studio, HUD, and renderer styles
└── src/imports/                   Bundled image assets
```

## Development

The application is a Vite-powered React project written in TypeScript. The main runtime dependencies are React 18, Three.js, Vite, Radix UI, Material UI, Lucide React, and Tailwind CSS utilities.

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build in `dist/` |

There is no dedicated test script in `package.json`. Browser validation has covered shader startup, scene controls, templates, workshop editing, undo/redo, flood fill, mirrored painting, image import, text rendering, lighting presets, PNG/project export, project validation, draft persistence, and mobile overflow.

## Troubleshooting

### The renderer does not start

Confirm that the browser supports WebGL2 and that hardware acceleration is enabled. Try a current version of Chrome, Edge, or Firefox and check the browser's graphics settings.

### The scene is slow

Switch Room Simulation to **Fast** quality, disable sun drift, reduce bloom/haze, or use a smaller window scale. High quality intentionally uses more volume samples and a larger render budget.

### My draft is missing

Drafts are stored per browser and origin. Clearing site data, using private browsing, changing the development-server origin, or switching browsers can remove or hide the draft. Use **SAVE PROJECT** for durable backups.

### A project will not load

Confirm that the file is a version-2 project exported by this app and is smaller than 2 MB. Image files and arbitrary JSON files are not valid project files.

## Attributions

See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for third-party components, imagery, and license information.

- [shadcn/ui](https://ui.shadcn.com/) components are used under the [MIT License](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md).
- Photos from [Unsplash](https://unsplash.com/) are used under the [Unsplash License](https://unsplash.com/license).
