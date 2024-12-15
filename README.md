# Automata

A customizable and interactive cellular automaton explorer that lets you experiment with one-dimensional reversible automata, visualizing how simple rules can create complex patterns. Watch as mathematical principles come to life through evolving patterns based on configurable rules and boundary conditions.

## How It Works

Each cell in the automaton has a binary state (on/off). At each time step, a cell's next state is determined by its current state and its neighbors' states, following a specific rule (0-255). The pattern grows downward, showing the evolution of states over time. In reversible mode, the previous state is considered, making patterns time-reversible and creating fascinating emergent behaviors.

## Features

- **Rule Configuration**: Adjust grid size and rule numbers (0-255)
- **Reversible Mode**: Toggle time-reversible patterns for unique evolutionary behaviors
- **Animation Controls**: Start, stop, and control animation speed and direction
- **Export Capability**: Download patterns as PNG images
- **Visual Customization**: Choose from multiple color palettes
- **Mutation System**: Add random mutations to explore chaos theory
- **Responsive Design**: Works seamlessly on all screen sizes
- **Interactive Controls**: Manipulate boundary conditions in real-time
- **Static Grid Manipulation**: Transform the grid while preserving animation history

## Mathematical Background

The automaton uses 8 possible state combinations (2³) for 3 binary cells, resulting in 256 possible rules (2⁸). The reversible mode adds the previous state to make patterns time-reversible, creating fascinating emergent behaviors. This implementation explores fundamental concepts in cellular automata and discrete mathematics.

## Installation

```bash
git clone https://github.com/sam-schorb/automata
cd automata
npm install
npm run dev

## Inspiration

Based on the concepts explored in [1D Reversible Automata](https://richiejp.com/1d-reversible-automata), this interactive implementation allows you to explore these mathematical concepts in real-time.