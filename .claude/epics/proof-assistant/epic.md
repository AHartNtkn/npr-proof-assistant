---
name: proof-assistant
status: backlog
created: 2025-08-29T20:08:09Z
updated: 2025-08-29T20:22:17Z
progress: 0%
prd: .claude/prds/proof-assistant.md
github: https://github.com/AHartNtkn/npr-proof-assistant/issues/12
---

# Epic: proof-assistant

## Overview
Build a local-first, purely visual proof assistant for Neo-Peircean Relations where graphs ARE the formulas. The system features two distinct modes: creative formula building (drawing-like) and constrained proof construction (puzzle-like), with a focus on delightful interactions that make it fun to use as a fidget toy.

## Architecture Decisions

### Core Architecture
- **Single-page application** with TypeScript/React for universal deployment
- **Canvas-based rendering** using WebGL for performant graph manipulation
- **Local-first storage** using IndexedDB for persistence without servers
- **Binary graph representation** optimized for computational efficiency
- **Dual-mode state machine** clearly separating formula and proof contexts

### Technology Choices
- **React + TypeScript**: Type safety and component architecture
- **PixiJS or Three.js**: WebGL abstraction for smooth 60+ FPS rendering
- **React Spring**: Physics-based animations for satisfying interactions
- **Zustand**: Lightweight state management for mode switching and graph state
- **Vite**: Fast build tooling with hot module replacement

### Design Patterns
- **Command pattern** for undo/redo in both modes
- **Observer pattern** for reactive graph updates
- **Strategy pattern** for mode-specific interaction handlers
- **Memento pattern** for proof history tracking

## Technical Approach

### Frontend Components

#### Core Graph Engine
- Custom WebGL renderer for nodes, edges, and boxes
- Efficient graph data structure with adjacency lists
- Spatial indexing for fast hit detection
- Type system for edge/node compatibility checking

#### UI Components
- Mode switcher (Formula ↔ Proof)
- Axiom palette (proof mode only)
- Canvas viewport with pan/zoom
- Minimal HUD showing current mode
- Ghost preview layer for hover effects

#### State Management
- Graph state (nodes, edges, boxes, types)
- Mode state (formula/proof)
- Interaction state (dragging, hovering, selected)
- History state (undo/redo stacks per mode)
- View state (zoom, pan, viewport)

### Backend Services
None required - fully client-side application. All computation happens in the browser.

### Infrastructure

#### Build & Bundle
- Vite for development and production builds
- Tree-shaking to minimize bundle size
- Code splitting for lazy loading advanced features
- WebAssembly modules for performance-critical graph algorithms

#### Deployment Options
- Static hosting (GitHub Pages, Netlify)
- Progressive Web App with offline support
- Electron wrapper for desktop distribution
- Single HTML file with embedded JS/CSS

## Implementation Strategy

### Development Phases
1. **Phase 1: Core Foundation** - Graph data structure, basic rendering, mode switching
2. **Phase 2: Formula Mode** - Node/edge creation, type checking, visual feedback
3. **Phase 3: Proof Mode** - Axiom application, preview system, validation
4. **Phase 4: Polish** - Animations, gestures, performance optimization
5. **Phase 5: Distribution** - PWA, Electron, embedding support

### Risk Mitigation
- Start with canvas rendering, add WebGL optimization later if needed
- Implement core NPR axioms first, extend gradually
- Use existing graph layout algorithms initially
- Test on low-end devices early to ensure performance

### Testing Approach
- Visual regression tests for graph rendering
- Property-based testing for axiom applications
- Performance benchmarks for 60 FPS target
- User testing for "fidget toy" feel

## Task Breakdown Preview

High-level task categories that will be created:
- [ ] Core Architecture: Set up TypeScript/React project with canvas rendering
- [ ] Graph Engine: Implement efficient graph data structure and operations
- [ ] Formula Mode: Build node/edge creation with type checking
- [ ] Proof Mode: Create axiom application engine with preview
- [ ] Visual Polish: Add spring animations and smooth interactions
- [ ] NPR Axioms: Implement complete axiom set from paper
- [ ] Persistence: Add local storage with IndexedDB
- [ ] Distribution: Create PWA and Electron builds

## Dependencies

### External Dependencies
- NPR paper for axiom specifications
- homotopy.io codebase for interaction patterns
- No runtime service dependencies

### Development Dependencies
- Modern browser with WebGL support
- Node.js for build tooling
- TypeScript compiler

### Prerequisite Work
- Finalize NPR axiom set from paper
- Define binary graph format specification
- Create visual design language for nodes/edges

## Success Criteria (Technical)

### Performance Benchmarks
- 60+ FPS during all interactions
- <10ms hover feedback latency
- <100ms mode switch time
- <500KB initial bundle size

### Quality Gates
- 100% type coverage with TypeScript strict mode
- Zero runtime errors in production
- Works offline after first load
- Supports graphs with 1000+ nodes smoothly

### Acceptance Criteria
- Formula mode allows free-form graph construction
- Proof mode correctly applies all NPR axioms
- Animations feel natural and satisfying
- No text formulas visible anywhere
- Works identically online and offline

## Estimated Effort

### Overall Timeline
- **Total Duration**: 8-10 weeks with single developer
- **MVP (Phases 1-3)**: 4-5 weeks
- **Polish (Phase 4)**: 2-3 weeks
- **Distribution (Phase 5)**: 1-2 weeks

### Resource Requirements
- 1 full-stack developer with WebGL experience
- Design consultation for visual language
- User testing group (5-10 mathematicians/logicians)

### Critical Path Items
1. Graph engine performance (must hit 60 FPS)
2. Axiom implementation correctness
3. Mode switching clarity
4. Animation feel and responsiveness

## Tasks Created
- [ ] #13 - Core Architecture Setup (parallel: true)
- [ ] #14 - Graph Engine Implementation (parallel: false)
- [ ] #16 - Formula Mode Development (parallel: true)
- [ ] #18 - Proof Mode Engine (parallel: true)
- [ ] #15 - Visual Polish and Animations (parallel: true)
- [ ] #17 - NPR Axioms Implementation (parallel: true)
- [ ] #19 - Persistence Layer (parallel: true)
- [ ] #20 - Distribution and Deployment (parallel: false)

Total tasks: 8
Parallel tasks: 6
Sequential tasks: 2
Estimated total effort: 148 hours (~4 weeks)