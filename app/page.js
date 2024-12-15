"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CellularAutomata } from '@/components/CellularAutomata';
import InfoModal from '@/components/InfoModal';
import { CircleHelp } from 'lucide-react';

/**
 * The `Page` component provides a user interface for configuring and viewing the CellularAutomata component.
 * Users can:
 * - Adjust parameters (rule number, grid size, mutation probability, color palette).
 * - Toggle reversible, invert colors, and random initial options.
 * - Start/stop animation.
 * - Reset the automaton.
 * - Download the current state as a PNG image.
 *
 * This component demonstrates how to integrate the `CellularAutomata` component, providing interactive controls.
 */
export default function Page() {
  // Unified configuration state for the automaton.
  const [config, setConfig] = useState({
    gridSize: 200,
    ruleNumber: 110,
    mutationProbability: 0,
    colorIndex: 0,
    reversible: false,
    invertColors: false,
    randomInitial: false
  });

  // Reference to track if screen is large enough to adjust aspect ratio.
  const [isLargeScreen, setIsLargeScreen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);


  // Animation and reset states.
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldReset, setShouldReset] = useState(false);

  // A reference to the container that holds the CellularAutomata for download operations.
  const automataRef = useRef(null);

  // Auto-open modal with slight delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsModalOpen(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Check screen size for responsive layout.
  useEffect(() => {
    const checkScreenSize = () => setIsLargeScreen(window.innerWidth >= 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  /**
   * Update a specific configuration key with a new value.
   * @param {string} key - The configuration key to update.
   * @param {any} value - The new value for the configuration key.
   */
  const handleConfigChange = useCallback((key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Handle reset requests by triggering a short-lived `shouldReset` state.
   * This causes the CellularAutomata component to reinitialize.
   */
  const handleReset = useCallback(() => {
    setShouldReset(true);
    // Clear after one tick, allowing effect to trigger.
    setTimeout(() => setShouldReset(false), 0);
  }, []);

  /**
   * Handle the download action:
   * - Temporarily stop animation (if running) to ensure a stable image.
   * - Convert the SVG to a PNG and prompt for download.
   * - Restore animation state if it was previously running.
   */
  const handleDownload = useCallback(async () => {
    if (!automataRef.current) return;
    const wasAnimating = isAnimating;
    setIsAnimating(false);

    await new Promise(resolve => requestAnimationFrame(resolve));

    try {
      const svgElement = automataRef.current.querySelector('svg');
      if (!svgElement) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const svgRect = svgElement.getBoundingClientRect();
      canvas.width = svgRect.width;
      canvas.height = svgRect.height;

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        // Dark background before drawing SVG
        ctx.fillStyle = 'rgb(9, 9, 11)';  // Changed to match dark background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = 'cellular-automata.png';
        a.click();

        URL.revokeObjectURL(url);
        if (wasAnimating) {
          setIsAnimating(true);
        }
      };
      img.src = url;
    } catch (error) {
      console.error('Error during download:', error);
      if (wasAnimating) {
        setIsAnimating(true);
      }
    }
  }, [isAnimating]);

  // Slider configuration parameters for display.
  const sliderConfigs = [
    {
      label: 'Grid Size',
      key: 'gridSize',
      min: 10,
      max: 200,
      step: 10,
      format: v => String(v)
    },
    {
      label: 'Rule Number',
      key: 'ruleNumber',
      min: 0,
      max: 255,
      step: 1,
      format: v => String(v)
    },
    {
      label: 'Mutation Probability',
      key: 'mutationProbability',
      min: 0,
      max: 1,
      step: 0.01,
      format: v => `${Math.round(v * 100)}%`
    },
    {
      label: 'Color Palette',
      key: 'colorIndex',
      min: 0,
      max: 7,
      step: 1,
      format: v => String(v)
    }
  ];

  // Boolean options for toggles.
  const booleanConfigs = [
    { key: 'reversible', label: 'Reversible' },
    { key: 'invertColors', label: 'Invert Colors' },
    { key: 'randomInitial', label: 'Random Initial' }
  ];


  return (
    <div className="w-screen h-screen overflow-auto bg-zinc-950 dark">
      <div className="mx-auto h-full w-full max-w-screen-2xl flex flex-col lg:flex-row">
        {/* Main display area */}
        <div className="flex-grow h-screen lg:h-full min-w-0 order-1 lg:order-2">
          <div ref={automataRef} className="relative h-full">
            <CellularAutomata
              {...config}
              isAnimating={isAnimating}
              playSpeed={isAnimating ? 10 : 0}
              isLargeScreen={isLargeScreen}
              shouldReset={shouldReset}
              onConfigChange={handleConfigChange}
            />
          </div>
        </div>

        {/* Control panel */}
        <div className="w-full lg:w-1/4 lg:min-w-[28%] lg:flex lg:items-center order-2 lg:order-1">
          <div className="w-full p-4">
            <Card className="lg:border bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Sliders */}
                  {sliderConfigs.map(({ label, key, min, max, step, format }) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-zinc-200">{label}: {format(config[key])}</Label>
                      <Slider
                        min={min}
                        max={max}
                        step={step}
                        value={[config[key]]}
                        onValueChange={([value]) => handleConfigChange(key, value)}
                        className="dark"
                      />
                    </div>
                  ))}

                  {/* Toggles */}
                  {booleanConfigs.map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        id={key}
                        checked={config[key]}
                        onCheckedChange={value => handleConfigChange(key, value)}
                        className="dark"
                      />
                      <Label htmlFor={key} className="text-zinc-200">{label}</Label>
                    </div>
                  ))}

                  {/* Animation toggle */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="animate"
                      checked={isAnimating}
                      onCheckedChange={setIsAnimating}
                      className="dark"
                    />
                    <Label htmlFor="animate" className="text-zinc-200">Animate</Label>
                  </div>

                  {/* Action buttons - Reordered */}
                  <div className="flex space-x-2">
                    <Button 
                      className="flex-1"
                      onClick={handleDownload}
                    >
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-zinc-700 hover:bg-zinc-800"
                      onClick={handleReset}
                    >
                      Reset
                    </Button>
                    <Button
                      variant="outline"
                      className="w-12 px-0 border-zinc-700 hover:bg-zinc-800 transition-all duration-300 hover:scale-105"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <CircleHelp className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Info Modal with state */}
      <InfoModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}