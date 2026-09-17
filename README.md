# Disk Fault Simulation Workbench

[![Live Demo](https://img.shields.io/badge/🎮_Live_Demo-Play_on_GitHub_Pages-2ea44f?style=for-the-badge)](https://olamideakinade.github.io/disk-fault-sim/)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Olamideakinade/disk-fault-sim)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

![Project Snapshot](preview.svg)

> 🚀 **Live Demo Available:** Test and play this project live right now: **[https://olamideakinade.github.io/disk-fault-sim/](https://olamideakinade.github.io/disk-fault-sim/)**

Disk Fault Simulation Workbench is a browser-based visualization and failure testing tool designed to model block allocation, inode distribution, filesystem fragmentation, and simulated sector corruption. It runs entirely client-side using Vanilla JavaScript, HTML5 Canvas, and modern CSS.

## Key Capabilities

- **Block Map Visualization**: Real-time canvas rendering of disk blocks tracking free, allocated, corrupted, and pinned states.
- **Filesystem Operations**: Simulate sequential writes, random allocations, file deletions, and defragmentation passes.
- **Fault Injection Engine**: Inject bad sectors, unreadable blocks, or simulated drive drops to observe integrity recovery mechanisms.
- **State Persistence**: Save disk layouts and simulation histories to `localStorage` for comparative runs.
- **Zero Dependencies**: Pure vanilla stack without heavy frontend frameworks or build steps.

## Quickstart

Clone the repository and serve the static files using any local web server:

```bash
git clone https://github.com/Olamideakinade/disk-fault-sim.git
cd disk-fault-sim
python3 -m http.server 8080
```

Navigate to `http://localhost:8080` in your browser.

## Architecture & Design

The application is structured into decoupled modules:

- `index.html`: Layout container featuring control panels, metrics readouts, and canvas viewports.
- `style.css`: Linear-inspired dark UI theme utilizing CSS variables and grid/flexbox layouts.
- `app.js`: Core simulation loop, block state management, rendering pipeline, and event handling.

## License

MIT