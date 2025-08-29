---
name: proof-assistant
status: backlog
created: 2025-08-29T17:42:06Z
progress: 0%
prd: .claude/prds/proof-assistant.md
github: [Will be updated when synced to GitHub]
---

# Epic: proof-assistant

## Overview

Build a web-first NPR proof assistant that treats graphs as the primary syntax for first-order logic. The implementation will leverage existing open-source libraries for graph manipulation and rendering while focusing on the unique NPR axiom system and dual-mode interaction pattern (formula building vs proof construction).

## Architecture Decisions

### Core Technology Choices
- **TypeScript + Vite**: Modern web development with type safety and fast builds
- **Cytoscape.js or Sigma.js**: Mature graph visualization libraries with built-in interaction support
- **Immer**: Immutable state management for undo/redo and proof history
- **Web Components**: For easy embedding without framework dependencies
- **IndexedDB**: Local-first storage with binary blob support

### Simplification Strategy
- **Leverage existing graph libraries** instead of building custom rendering from scratch
- **Use CSS transitions** for animations instead of complex physics engines initially
- **Start with click-based interactions** before adding gesture support
- **Adapt homotopy.io's data model** rather than reimplementing it entirely
- **Progressive enhancement**: Ship working MVP quickly, add polish incrementally

### Design Patterns
- **State machine** for mode switching (Formula ↔ Proof)
- **Command pattern** for reversible graph operations
- **Observer pattern** for reactive UI updates
- **Plugin architecture** for custom axioms and theories

## Technical Approach

### Frontend Components
- **Graph Canvas**: Cytoscape.js-based visualization with NPR-specific styling
- **Mode Switcher**: Toggle between formula and proof modes
- **Rule Palette**: Visual display of available rewrites on hover
- **History Timeline**: Visual proof history with snapshots
- **Axiom Library**: Collapsible panel with NPR axioms

### Core Services
- **NPR Engine**: TypeScript implementation of axiom system
- **Rewrite Detector**: Efficient pattern matching for applicable rules
- **Type Checker**: Well-formedness validation for formulas
- **Storage Service**: IndexedDB wrapper for local persistence
- **Export Service**: Generate shareable URLs and embeddable widgets

### Data Model
- Adapt homotopy.io's zigzag construction for NPR
- Binary serialization using MessagePack or Protocol Buffers
- Efficient diff storage for proof history
- Memoized rewrite detection cache

## Implementation Strategy

### MVP-First Approach
1. Get basic graph manipulation working with existing library
2. Implement core NPR axioms as graph transformations
3. Add mode switching and basic interactions
4. Polish animations and "fidget toy" feel later

### Risk Mitigation
- **Performance**: Start with small graphs, optimize later with WebWorkers
- **NPR Boxes**: Implement as grouped nodes initially, refine visual representation
- **Gesture complexity**: Ship with click-only, add gestures as enhancement

### Testing Approach
- Visual regression tests for graph transformations
- Property-based testing for axiom soundness
- User testing for interaction feel
- Performance benchmarks for large graphs

## Task Breakdown Preview

Simplified to under 10 high-impact tasks:

- [ ] **Core Setup**: TypeScript project with Vite, Cytoscape.js integration
- [ ] **Graph Data Model**: NPR-adapted zigzag structure with serialization
- [ ] **NPR Axiom Engine**: Core axiom implementations and pattern matching
- [ ] **Formula Builder Mode**: Drag-drop graph construction with type checking
- [ ] **Proof Mode**: Hover-highlight and click-apply rewrite system
- [ ] **Mode Switching**: State management and UI for dual modes
- [ ] **History & Undo**: Command pattern implementation with visual timeline
- [ ] **Local Storage**: IndexedDB integration for saving/loading
- [ ] **Web Component**: Packaging for embedding and standalone use
- [ ] **Polish Pass**: Animations, sounds, and fidget-toy refinements

## Dependencies

### External Libraries
- Cytoscape.js or Sigma.js (graph visualization)
- Immer (immutable state)
- MessagePack or Protobuf (binary serialization)
- Vite (build tooling)

### Knowledge Requirements
- NPR axiom system from reference paper
- Homotopy.io codebase (reference only)
- Graph algorithm optimization

### Prerequisites
- No backend dependencies (fully client-side)
- Modern browser with ES6+ support
- WebAssembly optional (for future optimization)

## Success Criteria (Technical)

### Performance Metrics
- 60 FPS during graph manipulation
- <50ms rewrite detection on hover
- <100ms for axiom application
- <1MB initial bundle size

### Quality Gates
- 100% soundness (no invalid proofs accepted)
- Zero runtime errors in production
- Works offline after first load
- Single-line embedding (`<npr-assistant></npr-assistant>`)

### User Experience
- First interaction within 5 seconds of load
- Intuitive enough for demo without instructions
- Visually distinct formula vs proof modes
- Satisfying animation feedback

## Estimated Effort

### Timeline
- **Week 1-2**: Core setup and graph model
- **Week 3-4**: NPR engine and basic modes
- **Week 5-6**: Interactions and storage
- **Week 7-8**: Polish and packaging
- **Total**: 2 months for MVP

### Resource Requirements
- 1-2 developers
- Familiarity with TypeScript and graph algorithms
- Access to NPR paper for axiom reference

### Critical Path
1. Graph library integration (blocks everything)
2. NPR axiom implementation (blocks proof mode)
3. Mode switching (blocks user testing)
4. Web component packaging (blocks distribution)