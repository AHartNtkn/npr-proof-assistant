# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains:
1. **Academic Paper**: LaTeX source for "The calculus of neo-Peircean relations" - a mathematical/logical paper dealing with category theory, string diagrams, and first-order logic
2. **NPR Proof Assistant** (in development): A web-based interactive proof assistant for the Neo-Peircean Relations calculus described in the paper

## Structure

- **Main document**: `arXiv-2505.05306v2/main.tex`
- **Sections**: Located in `arXiv-2505.05306v2/sections/`
- **TikZ diagrams**: Extensive collection in `arXiv-2505.05306v2/tikz/` with subdirectories for axioms and proofs
- **Bibliography**: `arXiv-2505.05306v2/main.bib`
- **Macros**: `arXiv-2505.05306v2/macros.tex`
- **Document class**: `arXiv-2505.05306v2/lmcs.cls`

## Common Commands

### Building the document
```bash
cd arXiv-2505.05306v2
pdflatex main.tex
bibtex main
pdflatex main.tex
pdflatex main.tex
```

### Quick compilation (without bibliography)
```bash
cd arXiv-2505.05306v2
pdflatex main.tex
```

## Key Components

The paper is structured around several theoretical concepts:
- Calculus of relations (historical background from De Morgan and Peirce)
- Diagrammatic first-order logic representations
- Cartesian and linear bicategories
- String diagrams and deep inference
- Complete axiomatizations using categorical structures

The extensive TikZ diagram collection provides visual representations of:
- Axioms for cartesian bicategories (cb/plus and cb/minus)
- Linear adjunctions and structures
- Encodings of first-order logic operations
- Various proofs and derivations

## NPR Proof Assistant Development

### Core Principles
- **Graphs ARE formulas**: The diagrams are not representations of formulas, they ARE the actual syntax
- **Two distinct modes**: 
  - Formula building (creative, like drawing with Lego bricks)
  - Proof construction (constrained, like manipulating a puzzle)
- **Local-first architecture**: Runs standalone with optional web embedding
- **Pure visual interaction**: No text representation of formulas should ever be shown
- **Playful design**: Should feel like a fidget toy, fun to use even when not actively proving

### Technical Guidelines
- Follow homotopy.io's interaction model and data structures
- Reference ZXLive and other string diagram tools for UI patterns
- Use TypeScript/JavaScript for web compatibility
- Optimize internal representation for computation, not human readability
- Support NPR-specific features (boxes, custom axioms) beyond standard string diagrams

### User Experience Goals
- Formula building should feel like drawing
- Proof manipulation should feel like playing with a physical object
- Hover-to-preview, click-to-apply interaction pattern
- Gesture-based shortcuts for common operations
- Smooth, satisfying animations with personality

## Development Rules

### Important Instructions
- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested

### Code Style
- Follow existing patterns in the codebase
- Check for existing libraries before adding new dependencies
- Maintain consistency with neighboring code
- NO unnecessary comments unless specifically requested

### Testing Philosophy
- Always use real implementations, never mock services
- Tests should be verbose for debugging purposes
- Design tests to reveal flaws, not just pass
- Test every function with realistic usage scenarios