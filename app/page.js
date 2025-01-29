'use client';

import { CellularAutomata } from '@/components/CellularAutomata';
import InfoModal from '@/components/InfoModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { CircleHelp, Download } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The `Page` component provides a user interface for configuring and viewing the CellularAutomata component.
 * Users can:
 * - Adjust parameters (rule number, grid size, mutation probability, color palette).
 * - Toggle reversible, invert colors, and random initial options.
 * - Start/stop animation.
 * - Reset the automaton.
 * - Download the current state as PNG or SVG.
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
    randomInitial: false,
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

  const pauseAnimation = useCallback(async () => {
    if (isAnimating) {
      setIsAnimating(false);
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    return isAnimating;
  }, [isAnimating]);

  const resumeAnimation = useCallback(wasAnimating => {
    if (wasAnimating) {
      setIsAnimating(true);
    }
  }, []);

  const handleDownloadSVG = useCallback(async () => {
    if (!automataRef.current) return;
    const wasAnimating = await pauseAnimation();

    try {
      const originalSvg = automataRef.current.querySelector('svg');
      if (!originalSvg) return;

      // Get the dimensions, but adjust width to match the display area
      const svgRect = originalSvg.getBoundingClientRect();

      // Create wrapper SVG with background
      const wrapper = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg'
      );
      wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      wrapper.setAttribute('width', svgRect.width);
      wrapper.setAttribute('height', svgRect.height);
      wrapper.setAttribute('viewBox', `0 0 ${svgRect.width} ${svgRect.height}`);

      // Add the content
      const svgContent = originalSvg.cloneNode(true);
      svgContent.setAttribute('width', '100%');
      svgContent.setAttribute('height', '100%');
      wrapper.appendChild(svgContent);

      const svgData = new XMLSerializer().serializeToString(wrapper);
      const svgBlob = new Blob([svgData], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const url = URL.createObjectURL(svgBlob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'cellular-automata.svg';
      a.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading SVG:', error);
    } finally {
      resumeAnimation(wasAnimating);
    }
  }, [pauseAnimation, resumeAnimation]);

  const handleDownloadPNG = useCallback(async () => {
    if (!automataRef.current) return;
    const wasAnimating = await pauseAnimation();

    try {
      const originalSvg = automataRef.current.querySelector('svg');
      if (!originalSvg) return;

      const svgRect = originalSvg.getBoundingClientRect();

      // Create a high-resolution canvas
      const scale = 2;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = svgRect.width * scale;
      canvas.height = svgRect.height * scale;

      // Create wrapper SVG with background
      const wrapper = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg'
      );
      const rect = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect'
      );
      const svgContent = originalSvg.cloneNode(true);

      wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      wrapper.setAttribute('width', svgRect.width);
      wrapper.setAttribute('height', svgRect.height);
      wrapper.setAttribute('viewBox', `0 0 ${svgRect.width} ${svgRect.height}`);

      rect.setAttribute('width', '100%');
      rect.setAttribute('height', '100%');
      rect.setAttribute('fill', 'rgb(9, 9, 11)');

      svgContent.setAttribute('width', '100%');
      svgContent.setAttribute('height', '100%');

      wrapper.appendChild(rect);
      wrapper.appendChild(svgContent);

      const svgData = new XMLSerializer().serializeToString(wrapper);
      const svgBlob = new Blob([svgData], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        // Scale context for higher resolution
        ctx.scale(scale, scale);
        // Draw the image
        ctx.drawImage(img, 0, 0, svgRect.width, svgRect.height);

        // Get high-quality PNG
        const pngUrl = canvas.toDataURL('image/png', 1.0);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = 'cellular-automata.png';
        a.click();

        URL.revokeObjectURL(url);
        resumeAnimation(wasAnimating);
      };
      img.src = url;
    } catch (error) {
      console.error('Error downloading PNG:', error);
      resumeAnimation(wasAnimating);
    }
  }, [pauseAnimation, resumeAnimation]);

  // Slider configuration parameters for display.
  const sliderConfigs = [
    {
      label: 'Grid Size',
      key: 'gridSize',
      min: 10,
      max: 200,
      step: 10,
      format: v => String(v),
    },
    {
      label: 'Rule Number',
      key: 'ruleNumber',
      min: 0,
      max: 255,
      step: 1,
      format: v => String(v),
    },
    {
      label: 'Mutation Probability',
      key: 'mutationProbability',
      min: 0,
      max: 1,
      step: 0.01,
      format: v => `${Math.round(v * 100)}%`,
    },
    {
      label: 'Color Palette',
      key: 'colorIndex',
      min: 0,
      max: 7,
      step: 1,
      format: v => String(v),
    },
  ];

  // Boolean options for toggles.
  const booleanConfigs = [
    { key: 'reversible', label: 'Reversible' },
    { key: 'invertColors', label: 'Invert Colors' },
    { key: 'randomInitial', label: 'Random Initial' },
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
                  {sliderConfigs.map(
                    ({ label, key, min, max, step, format }) => (
                      <div key={key} className="space-y-2">
                        <Label className="text-zinc-200">
                          {label}: {format(config[key])}
                        </Label>
                        <Slider
                          min={min}
                          max={max}
                          step={step}
                          value={[config[key]]}
                          onValueChange={([value]) =>
                            handleConfigChange(key, value)
                          }
                          className="dark"
                        />
                      </div>
                    )
                  )}

                  {/* Toggles */}
                  {booleanConfigs.map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        id={key}
                        checked={config[key]}
                        onCheckedChange={value =>
                          handleConfigChange(key, value)
                        }
                        className="dark"
                      />
                      <Label htmlFor={key} className="text-zinc-200">
                        {label}
                      </Label>
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
                    <Label htmlFor="animate" className="text-zinc-200">
                      Animate
                    </Label>
                  </div>

                  {/* Action buttons */}
                  <div className="flex space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="flex-1 gap-2">
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleDownloadPNG}>
                          Download as PNG
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDownloadSVG}>
                          Download as SVG
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
