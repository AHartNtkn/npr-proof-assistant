# NPR Proof Assistant

An interactive proof assistant for Neo-Peircean Relations (NPR) - a graphical syntax for first-order logic.

## Overview

NPR Proof Assistant is a web-based tool that treats string diagrams as the primary syntax for logical formulas, not just visualizations. It provides two distinct modes:

- **Formula Building Mode**: Create NPR formulas through intuitive drag-and-drop interactions
- **Proof Mode**: Transform formulas using valid NPR axioms with visual feedback

## Features

- 🎨 Pure visual interaction - no text representation of formulas
- 🧩 Dual modes for formula construction and proof manipulation  
- 🎮 Designed to feel like a fidget toy - fun to use even when not proving
- 💾 Local-first architecture - works offline, no accounts needed
- 🔌 Embeddable as a web component in any page

## Development Status

🚧 **Under Development** - This project is in early stages of implementation.

## Tech Stack

- TypeScript
- Vite
- Graph visualization library (TBD: Cytoscape.js or Sigma.js)
- Web Components for embedding

## Getting Started

```bash
# Clone the repository
git clone https://github.com/AHartNtkn/npr-proof-assistant.git
cd npr-proof-assistant

# Install dependencies (once package.json is set up)
npm install

# Start development server
npm run dev
```

## Documentation

- [Product Requirements](.claude/prds/proof-assistant.md)
- [Technical Epic](.claude/epics/proof-assistant/epic.md)

## Reference

Based on "The calculus of neo-Peircean relations" paper. The proof assistant implements the NPR axiom system described in the paper, providing an interactive environment for exploring this alternative syntax for first-order logic.

## License

MIT

## Contributing

This project is in early development. Contributions and feedback are welcome!