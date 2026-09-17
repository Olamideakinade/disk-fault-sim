# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v1.0.0/).

## [v1.1.0] - 2025-02-18

### Added
- Diagnostics export and import functionality via JSON snapshots.
- Comprehensive keyboard shortcuts for workbench control (Space, C, R, Shift+R).
- Enhanced event logging with precise timestamping and status badges.
- Detailed fragmentation and health score metrics.

### Changed
- Optimized canvas rendering loop for smoother 60FPS block updates.
- Refactored state management to prevent memory leaks during rapid simulations.

### Fixed
- Edge cases in sector recovery algorithms where pinned blocks were incorrectly targeted.
