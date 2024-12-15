"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback
} from 'react';

/**
 * Supported boundary conditions for the cellular automaton's neighbor retrieval.
 */
const BOUNDARY_MODES = [
  'wrap',
  'fixed0',
  'fixed1',
  'reflect',
  'randomBoundary',
  'gradientBoundary'
];

/**
 * Predefined color palettes for the automaton.
 * Each palette defines the "on" and "off" states' colors.
 */
const COLOR_PALETTES = [
  { on: 'black', off: 'white' },
  { on: 'black', off: 'red' },
  { on: '#00f', off: '#ff0' },
  { on: 'blue', off: 'green' },
  { on: '#f00', off: '#0f0' },
  { on: '#333', off: '#ccc' },
  { on: '#ffff00', off: '#ff6600' },
  { on: '#0033cc', off: '#ccffff' }
];

/**
 * @typedef {Object} CellularAutomataProps
 * @property {number} [gridSize=32] - The vertical size (height) of the grid.
 * @property {number} [ruleNumber=90] - The rule number (0-255) that governs the automaton's state transitions.
 * @property {boolean} [reversible=false] - If true, applies reversible rule transformations.
 * @property {number} [mutationProbability=0] - Probability (0 to 1) of rule mutation per line.
 * @property {boolean} [invertColors=false] - If true, swaps the on/off colors.
 * @property {boolean} [randomInitial=false] - If true, initializes the first line with random states instead of a single central cell.
 * @property {number} [boundaryIndex=0] - Index selecting from predefined boundary conditions.
 * @property {number} [colorIndex=0] - Index selecting from predefined color palettes.
 * @property {Function} [onRenderComplete] - Callback invoked when a new render is complete, providing a URL to the SVG.
 * @property {boolean} [isLargeScreen=true] - If true, uses a larger aspect ratio.
 * @property {number} [playSpeed=0] - Speed of animation in lines per second. 0 indicates no automatic animation.
 * @property {boolean} [isAnimating=false] - If true, animates forward by adding new lines over time.
 * @property {boolean} [shouldReset=false] - If true, resets the automaton to its initial state.
 * @property {Function} [onConfigChange] - Callback invoked whenever configurations may need to be synchronized.
 */

/**
 * The `CellularAutomata` component renders and manages the state of a 1D cellular automaton displayed as stacked rows.
 * It supports animation, reversible rules, mutation, and various boundary conditions.
 * 
 * This component:
 * - Initializes a grid (2D array) representing the history of the automaton.
 * - Renders the grid as an SVG, with cells as rectangles.
 * - Supports toggling parameters like `reversible` and `randomInitial` without losing newly generated lines.
 * - Allows mutation and custom boundary conditions.
 * - Can animate forward in time at a chosen speed.
 * - Provides a callback when the rendering is complete.
 *
 * @param {CellularAutomataProps} props - The configuration properties.
 * @returns {JSX.Element} The rendered SVG-based cellular automaton.
 */
export const CellularAutomata = ({
  gridSize = 32,
  ruleNumber = 90,
  reversible = false,
  mutationProbability = 0,
  invertColors = false,
  randomInitial = false,
  boundaryIndex = 0,
  colorIndex = 0,
  onRenderComplete,
  isLargeScreen = true,
  playSpeed = 0,
  isAnimating = false,
  shouldReset = false,
  onConfigChange
}) => {
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const scrollRef = useRef(0);
  const prevLineRef = useRef(null);
  const lastEffectStateRef = useRef({ reversible: false, randomInitial: false });

  const [hasEverAnimated, setHasEverAnimated] = useState(false);

  // Determine grid dimensions based on screen size and given gridSize.
  const gridHeight = gridSize;
  const gridWidth = Math.floor(gridSize * (isLargeScreen ? 1.33 : 0.75));

  const [state, setState] = useState(() => ({
    grid: [],
    totalLines: gridHeight,
    bufferedLines: [],
    lastUpdate: Date.now()
  }));

  // Keep track of previous configuration to detect changes.
  const prevConfigRef = useRef({
    gridSize, ruleNumber, reversible, mutationProbability, invertColors, randomInitial, boundaryIndex, colorIndex
  });
  const currentConfig = { gridSize, ruleNumber, reversible, mutationProbability, invertColors, randomInitial, boundaryIndex, colorIndex };

  const configChanged = useMemo(
    () => Object.keys(currentConfig).some(k => currentConfig[k] !== prevConfigRef.current[k]),
    [currentConfig]
  );

  useEffect(() => {
    prevConfigRef.current = currentConfig;
  }, [currentConfig]);

  /**
   * Randomly mutate the rule with given probability.
   */
  const getMutatedRule = useCallback((baseRule) => {
    if (mutationProbability > 0 && Math.random() < mutationProbability) {
      return Math.floor(Math.random() * 256);
    }
    return baseRule;
  }, [mutationProbability]);

  /**
   * Retrieve neighbor cells with given boundary conditions.
   */
  const getNeighbor = useCallback((row, pos, width) => {
    const mode = BOUNDARY_MODES[boundaryIndex];
    if (mode === 'wrap') return row[(pos + width) % width];
    if (mode === 'fixed0') return pos < 0 || pos >= width ? 0 : row[pos];
    if (mode === 'fixed1') return pos < 0 || pos >= width ? 1 : row[pos];
    if (mode === 'reflect') {
      let p = pos;
      if (p < 0) p = -p;
      if (p >= width) p = 2 * (width - 1) - p;
      return row[Math.max(0, Math.min(p, width - 1))];
    }
    if (mode === 'randomBoundary') return pos < 0 || pos >= width ? (Math.random() < 0.5 ? 1 : 0) : row[pos];
    if (mode === 'gradientBoundary') {
      if (pos < 0) return 0;
      if (pos >= width) return 1;
      return row[pos];
    }
    return row[(pos + width) % width];
  }, [boundaryIndex]);

  /**
   * Compute the next line of the automaton given the current row, 
   * and optionally the previous row (for reversible mode).
   */
  const computeNextLineWithRule = useCallback(
    (currentRow, prevRow, useReversible) => {
      const next = new Array(gridWidth).fill(0);
      const currentRule = getMutatedRule(ruleNumber);

      for (let x = 0; x < gridWidth; x++) {
        const left = getNeighbor(currentRow, x - 1, gridWidth);
        const center = currentRow[x];
        const right = getNeighbor(currentRow, x + 1, gridWidth);
        const pattern = (left << 2) | (center << 1) | right;
        let nextState = ((currentRule >> pattern) & 1) === 1 ? 1 : 0;

        // Apply reversible rule if enabled.
        if (useReversible && prevRow) {
          nextState = nextState ^ prevRow[x];
        }

        next[x] = nextState;
      }

      return next;
    },
    [gridWidth, ruleNumber, getMutatedRule, getNeighbor]
  );

  /**
   * Generate an initial row. If useRandom is true, it's randomized;
   * otherwise, a single cell in the center is 'on'.
   */
  const getInitialRow = useCallback((width, useRandom) => {
    if (useRandom) {
      return new Array(width).fill(0).map(() => (Math.random() < 0.5 ? 1 : 0));
    }
    return new Array(width).fill(0).map((_, i) => (i === Math.floor(width / 2) ? 1 : 0));
  }, []);

  /**
   * Re-interpret the current static grid with the updated parameters.
   * This does not revert to a pre-animation state, but rather
   * recomputes subsequent lines using the current top line as a starting point.
   */
  const applyEffectToStaticGrid = useCallback((currentGrid, applyReversible, applyRandom) => {
    if (currentGrid.length === 0) return currentGrid;

    const newGrid = [];
    let prevRow = null;

    // Keep the first row as-is to avoid losing the current pattern.
    newGrid.push([...currentGrid[0]]);

    // Recompute each subsequent line based on the new parameters.
    for (let y = 1; y < currentGrid.length; y++) {
      const currentRow = newGrid[y - 1];
      const nextRow = computeNextLineWithRule(currentRow, applyReversible ? prevRow : null, applyReversible);
      newGrid.push(nextRow);
      if (applyReversible) {
        prevRow = currentRow;
      }
    }

    return newGrid;
  }, [computeNextLineWithRule]);

  /**
   * Generate the initial grid from scratch using the initial parameters.
   */
  const generateInitialGrid = useCallback(() => {
    const grid = [];
    let prevRow = null;

    // First row
    const firstRow = getInitialRow(gridWidth, randomInitial);
    grid.push(firstRow);

    // Subsequent rows
    for (let y = 1; y < gridHeight; y++) {
      const currentRow = grid[y - 1];
      const nextRow = computeNextLineWithRule(currentRow, prevRow, reversible);
      grid.push(nextRow);
      if (reversible) prevRow = currentRow;
    }

    return grid;
  }, [gridWidth, gridHeight, randomInitial, reversible, getInitialRow, computeNextLineWithRule]);

  /**
   * Compute the next line during animation, updating prevLineRef if reversible.
   */
  const computeNextLine = useCallback((prevLine) => {
    const nextLine = computeNextLineWithRule(
      prevLine,
      reversible ? prevLineRef.current : null,
      reversible
    );
    if (reversible) {
      prevLineRef.current = prevLine;
    }
    return nextLine;
  }, [reversible, computeNextLineWithRule]);

  // Detect changes in reversible or randomInitial after animation has occurred
  // and apply them to the current static grid.
  useEffect(() => {
    if (!isAnimating && !shouldReset && state.grid.length > 0) {
      const effectsChanged = reversible !== lastEffectStateRef.current.reversible ||
                             randomInitial !== lastEffectStateRef.current.randomInitial;

      if (effectsChanged) {
        if (hasEverAnimated) {
          // Transform the current grid in place
          const newGrid = applyEffectToStaticGrid(state.grid, reversible, randomInitial);
          setState(current => ({ ...current, grid: newGrid }));
        } else {
          // If never animated, regenerate initial grid
          const newGrid = generateInitialGrid();
          setState(current => ({ ...current, grid: newGrid }));
        }

        lastEffectStateRef.current = { reversible, randomInitial };
      }
    }
  }, [
    reversible, randomInitial, isAnimating, shouldReset, hasEverAnimated,
    applyEffectToStaticGrid, generateInitialGrid, state.grid
  ]);

  // Handle reset events by generating a fresh initial grid.
  useEffect(() => {
    if (shouldReset) {
      scrollRef.current = 0;
      prevLineRef.current = null;

      const newGrid = generateInitialGrid();
      setState({
        grid: newGrid,
        totalLines: gridHeight,
        bufferedLines: [],
        lastUpdate: Date.now()
      });

      lastEffectStateRef.current = { reversible, randomInitial };
    }
  }, [shouldReset, generateInitialGrid, gridHeight, reversible, randomInitial]);

  // On initial mount, generate the initial grid.
  useEffect(() => {
    const initialGrid = generateInitialGrid();
    setState({
      grid: initialGrid,
      totalLines: gridHeight,
      bufferedLines: [],
      lastUpdate: Date.now()
    });
  }, []); // run once on mount

  // If configuration changes while static, regenerate the initial grid.
  useEffect(() => {
    if (!isAnimating && !shouldReset && configChanged) {
      const newGrid = generateInitialGrid();
      setState(current => ({
        ...current,
        grid: newGrid,
        totalLines: gridHeight,
        bufferedLines: [],
        lastUpdate: Date.now()
      }));
    }
  }, [isAnimating, configChanged, shouldReset, generateInitialGrid, gridHeight]);

  // Animation logic: periodically compute and add a new line at the bottom,
  // removing the top line (scrolling effect).
  useEffect(() => {
    if (!isAnimating) return;

    setHasEverAnimated(true);
    let lastTime = performance.now();
    const frameInterval = playSpeed > 0 ? (1000 / playSpeed) : 1000;

    const animate = (currentTime) => {
      if (!isAnimating) return;
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= frameInterval) {
        lastTime = currentTime;
        setState(prevState => {
          const lastLine = prevState.grid[prevState.grid.length - 1];
          const nextLine = computeNextLine(lastLine);

          const newGrid = [...prevState.grid.slice(1), nextLine];
          const newBufferedLines = [...prevState.bufferedLines, nextLine].slice(-gridHeight * 2);

          return {
            grid: newGrid,
            totalLines: prevState.totalLines + 1,
            bufferedLines: newBufferedLines,
            lastUpdate: Date.now()
          };
        });

        scrollRef.current += 1;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isAnimating, playSpeed, gridHeight, computeNextLine]);

  // Determine SVG parameters
  const viewBoxWidth = isLargeScreen ? 1.33 : 0.75;
  const cellWidth = viewBoxWidth / gridWidth;
  const cellHeight = 1 / gridHeight;

  // Construct SVG paths for "on" cells.
  const pathData = useMemo(() => {
    if (!state.grid.length) return '';
    const paths = [];
    for (let y = 0; y < state.grid.length; y++) {
      for (let x = 0; x < state.grid[y].length; x++) {
        if (state.grid[y][x] === 1) {
          const px = x * cellWidth;
          const py = y * cellHeight;
          paths.push(`M${px},${py}h${cellWidth}v${cellHeight}h${-cellWidth}z`);
        }
      }
    }
    return paths.join(' ');
  }, [state.grid, cellWidth, cellHeight]);

  // Invoke onRenderComplete callback if provided, passing a blob URL of the current SVG.
  useEffect(() => {
    if (onRenderComplete) {
      const svgElement = document.querySelector('#cellular-automata-svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        onRenderComplete(url);
        URL.revokeObjectURL(url);
      }
    }
  }, [pathData, onRenderComplete]);

  // Determine the colors from the chosen palette.
  const palette = COLOR_PALETTES[colorIndex] || COLOR_PALETTES[0];
  const onColor = invertColors ? palette.off : palette.on;
  const offColor = invertColors ? palette.on : palette.off;

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg
        id="cellular-automata-svg"
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewBoxWidth} 1`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
        shapeRendering="crispEdges"
      >
        {/* Background rectangle for "off" cells */}
        <rect width={viewBoxWidth} height="1" fill={offColor} />
        {/* Paths for "on" cells */}
        <path d={pathData} fill={onColor} />
      </svg>
    </div>
  );
};
