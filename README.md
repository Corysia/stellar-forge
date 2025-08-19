# 🌌 Stellar Forge

**Stellar Forge** is a procedural galaxy visualization tool built with BabylonJS. It renders sector-level star distributions based on astrophysical parameters, allowing users to explore generated star systems within a defined spatial cube. The project is designed for extensibility, realism, and interactive debugging of large-scale space simulations.

## Table of Contents

- [🌌 Stellar Forge](#-stellar-forge)
  - [Table of Contents](#table-of-contents)
  - [🚀 What It Does](#-what-it-does)
  - [✨ Try it Out](#-try-it-out)
  - [🧠 How It Works](#-how-it-works)
  - [📦 Project Structure](#-project-structure)
  - [🛠️ Technologies](#️-technologies)
  - [📐 Parameters](#-parameters)
  - [🧭 Current View](#-current-view)
  - [🧪 Known Quirks](#-known-quirks)
  - [🧱 Next Steps](#-next-steps)
  - [🧑‍🚀 Credits](#-credits)
  - [📄 License](#-license)

## 🚀 What It Does

- Generates a sector of stars using deterministic procedural logic
- Visualizes stars in 3D space using BabylonJS
- Frames the sector within a wireframe cube for spatial context
- Automatically positions the camera to fully contain the sector on first render
- Includes a minimap overlay showing galactic disk and sector marker
- Supports layer masking to separate main view from minimap assets

## ✨ Try it Out

Click the link below to view a live demo of Stellar Forge:

[https://corysia.github.io/stellar-forge/](https://corysia.github.io/stellar-forge/)

## 🧠 How It Works

- **Sector Generation**: Uses seeded parameters to generate star headers and expand them into full systems.
- **Coordinate Mapping**: Converts parsec-scale positions into Babylon world units, offset by sector origin.
- **Scene Graph**: All sector content is parented under a `TransformNode` for clean scaling and positioning.
- **Camera Fit**: Calculates the cube’s diagonal and adjusts the ArcRotateCamera to fully frame the sector.
- **Minimap**: A secondary camera renders the galactic disk and sector marker on a separate layer.

## 📦 Project Structure

```txt
src/ 
├── main.ts               # Entry point, sets up scene and camera 
├── forge/ 
│   ├── sectorForge.ts    # Sector generation logic 
│   └── models.ts         # Type definitions for galaxy and generation params 
└── render/ 
    └── GalaxyMinimap.ts  # Minimap camera and overlay rendering
```

## 🛠️ Technologies

- [BabylonJS](https://www.babylonjs.com/) — WebGL engine for 3D rendering
- TypeScript — Strong typing and modular architecture
- Procedural generation — Deterministic, seed-based star system creation

## 📐 Parameters

You can tweak the following to control galaxy structure and sector density:

```ts
const galaxyParams = {
  galaxySeed: 12345,
  sectorSizePc: 100,
  diskScaleLenKpc: 3,
  spiralArms: 4,
  ...
};

const genParams = {
  starCount: 50,
  binaryFraction: 0.2,
  wanderingFraction: 0.05,
  ...
};
```

## 🧭 Current View

- Cyan wireframe cube: represents the bounds of the current sector
- White spheres: primary stars of generated systems
- Minimap: shows galactic disk and sector location (not visible in main camera)

## 🧪 Known Quirks

- BabylonJS may report incorrect canvas dimensions on first frame; resolved via double requestAnimationFrame and forced engine.resize().
- Camera fit logic is sensitive to aspect ratio and FOV — currently tuned for ArcRotateCamera defaults.

## 🧱 Next Steps

- Add spectral class–based star coloring
- Visualize planetary systems and orbital paths
- Enable sector navigation and multi-sector loading
- Export sector data for use in simulation or gameplay

## 🧑‍🚀 Credits

Created by [Corysia](https://github.com/Corysia).

Procedural logic, camera math, and rendering architecture collaboratively debugged with Copilot.

## 📄 License

MIT — free to use, modify, and explore the stars.
