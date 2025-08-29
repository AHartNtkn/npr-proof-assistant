---
name: proof-assistant
description: Local-first interactive proof assistant for Neo-Peircean Relations with dual formula-building and proof modes
status: backlog
created: 2025-08-29T16:53:41Z
---

# PRD: proof-assistant

## Executive Summary

A local-first interactive proof assistant for Neo-Peircean Relations (NPR) calculus with two distinct modes: formula building (like drawing with Lego bricks) and proof construction (like manipulating a physical puzzle). The graphs ARE the formulas - not representations of formulas - making this a purely graphical formal logic system. Built as a standalone application that can also be embedded in web interfaces, it follows the interaction paradigm of homotopy.io while incorporating concepts from other string diagram tools like ZXLive. The tool should be as fun to play with as a fidget toy, even when not actively proving theorems.

## Problem Statement

First-order logic has always been presented through tree-like syntactic structures that obscure the geometric relationships inherent in logical formulas. NPR offers a genuinely graphical syntax where the diagrams themselves ARE the formulas, not mere visualizations. However, no tool exists that treats these graphs as the primary and only syntax.

Current gaps:
- No distinction between formula construction (creative) and proof manipulation (rule-constrained)
- Existing tools treat diagrams as representations rather than as the formulas themselves
- No local-first tool that can also be embedded in web contexts
- String diagram tools don't support NPR's specific needs (boxes, particular axioms)
- No proof assistant that doubles as an enjoyable fidget toy

## User Stories

### Primary Mode: Formula Builder
**Purpose:** Construct NPR formulas/theories through drawing-like interactions
**Feel:** Like sketching with smart Lego bricks that snap together correctly

**User Journey:**
1. Opens blank canvas in formula mode
2. Drags nodes/edges onto canvas (initial version)
3. Connects elements with drawing-like gestures (future)
4. System ensures well-formedness automatically
5. Builds complex formulas through composition
6. Switches to proof mode when ready to prove properties

**Interaction Style:**
- Drag-and-drop nodes initially
- Drawing gestures for connections (goal)
- Free-form construction within type constraints
- Immediate visual feedback on validity

### Secondary Mode: Proof Constructor
**Purpose:** Transform formulas through valid NPR axiom applications
**Feel:** Like manipulating a physical geometric puzzle with specific rules

**User Journey:**
1. Loads formula to prove or transform
2. Hovers to see applicable rewrites highlighted
3. Clicks to apply transformations
4. Uses gestures for common axioms
5. Watches smooth animations of transformations
6. Builds proof through series of valid moves

**Interaction Style:**
- Restricted to valid axiom applications
- Hover-preview of transformations
- Click-to-apply rewrites
- Gesture shortcuts for common operations
- Cannot "break" the formula

### Tertiary Persona: Fidget User
**Background:** Someone who enjoys playing with interactive visualizations
**Goals:** Explore and play with logical structures for fun

**User Journey:**
1. Opens tool during break/downtime
2. Loads interesting formula or proof
3. Plays with transformations to see patterns
4. Discovers unexpected relationships
5. Shares interesting discoveries
6. Returns regularly for mental stimulation

## Requirements

### Functional Requirements

**Dual-Mode Architecture:**
- **Formula Mode**: Free-form construction with type checking
  - Drag-and-drop node placement
  - Edge drawing/connection tools
  - Automatic well-formedness checking
  - Box construction for quantifiers/special operators
  - Copy/paste subgraphs
- **Proof Mode**: Constrained transformation interface
  - Only valid axiom applications allowed
  - Preview-before-apply interaction
  - Proof history tracking
  - Cannot create ill-formed states

**Core NPR Implementation:**
- Graphs ARE formulas (not representations)
- Support for NPR-specific boxes (beyond homotopy.io)
- Complete NPR axiom system
- Custom axiom definition for theories
- Type checking for well-formedness

**Local-First Design:**
- Runs as standalone application
- No server or accounts required
- Can be embedded as iframe/component
- File-based storage (not cloud)
- Works offline completely

**Interaction Features:**
- Smooth animations for all transformations
- Hover highlighting of applicable rules
- Gesture recognition for common operations
- Visual feedback for valid/invalid operations
- Playful physics-based animations (bouncy, satisfying)

**Data Philosophy:**
- Internal representation optimized for computation only
- Binary format for efficiency
- Visual rendering IS the human interface
- No textual representation needed or wanted

### Non-Functional Requirements

**Performance:**
- 60+ FPS during interactions
- Instant hover feedback (<10ms)
- Smooth animations feel physical
- Handles large formulas without lag

**Architecture:**
- JavaScript/TypeScript for universal deployment
- Can run as Electron app locally
- Can embed in any web page
- WebAssembly for performance-critical parts
- No backend services required

**Playfulness:**
- Animations have personality (bounce, ease)
- Satisfying click/transformation sounds (optional)
- Visual effects make interactions fun
- Should feel like a fidget toy
- Addictive interaction loop

**Deployment Options:**
- Standalone desktop app (Electron)
- Browser bookmark/PWA
- Embeddable web component
- Local HTML file
- No installation complexity

## Success Criteria

**Core Metrics:**
- Formula building feels like drawing (user feedback)
- Proof mode feels like physical puzzle (user feedback)
- Users play with it even when not working
- Zero text visible during normal use
- Works identically online and offline

**Engagement Metrics:**
- Users open it as a fidget toy during breaks
- Average session includes "just playing around"
- Users share interesting patterns they discover
- Described as "addictive" or "satisfying"

**Technical Success:**
- Graphs truly ARE the formulas (no hidden text representation)
- Mode switching is seamless
- No performance degradation with complex formulas
- Embedding requires single line of code

## Constraints & Assumptions

### Design Constraints
- Graphs are THE syntax, not a visualization
- No textual formulas ever shown
- Must support NPR-specific features beyond homotopy.io
- Local-first, no user accounts

### Technical Constraints
- Must run without server
- Browser-compatible JavaScript
- Efficient binary storage
- Embeddable without dependencies

### Assumptions
- Users want visual-only interaction
- Fidget-toy aspect increases adoption
- Local-first important for academics
- Drawing-like formula building is achievable

## Out of Scope

**Explicitly Excluded:**
- Text representation of formulas
- User accounts or cloud storage
- Server-side anything
- Translation to/from traditional FOL
- Symbolic (text) manipulation
- Command-line interface
- Integration with text-based proofs
- Human-readable file formats

**Future Possibilities:**
- Actual drawing (pen/pencil) for formula construction
- Multi-user collaboration (peer-to-peer)
- Advanced gesture recognition
- VR/AR manipulation
- AI-suggested rewrites

## Dependencies

### Technical Stack
- **Core**: TypeScript
- **Desktop**: Electron wrapper
- **Rendering**: WebGL/Canvas
- **Animations**: Spring physics library
- **Gestures**: Hammer.js or similar

### Reference Systems
- **homotopy.io**: Core interaction model and data structures
- **ZXLive**: Additional string diagram UI patterns
- **Globular**: Historical precedent
- **NPR Paper**: Axiom specifications

## Risk Analysis

**High Risk:**
- Drawing-like formula building might be too ambitious initially
- NPR boxes might not fit homotopy.io model well
- Achieving true "fidget toy" feel

**Medium Risk:**
- Performance with very large graphs
- Gesture design for NPR-specific operations
- Making both modes feel cohesive

**Low Risk:**
- Technical implementation
- Local-first architecture
- Embedding capability

## Implementation Roadmap

**Phase 1: Core Architecture (Month 1)**
- Dual-mode system design
- Graph-as-formula data structure
- Basic NPR axiom implementation
- Local storage system

**Phase 2: Formula Builder Mode (Month 2)**
- Drag-and-drop nodes
- Edge connection tools
- Type checking system
- Box construction

**Phase 3: Proof Mode (Month 3)**
- Rewrite rule engine
- Hover preview system
- Click-to-apply interface
- Proof history

**Phase 4: Polish & Playfulness (Month 4)**
- Spring animations
- Gesture recognition
- Satisfying effects
- Fidget toy features

**Phase 5: Deployment Options (Month 5)**
- Electron packaging
- Web component build
- Embedding framework
- Documentation

**Phase 6: Advanced Formula Building (Month 6)**
- Drawing-like interactions
- Advanced gestures
- Pattern recognition
- User testing refinement