import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from 'next/link';

const customStyles = `
  @keyframes modalEntry {
    0% {
      opacity: 0;
      transform: scale(0.95) translateY(10px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes modalExit {
    0% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    100% {
      opacity: 0;
      transform: scale(0.95) translateY(10px);
    }
  }

  @keyframes backdropEntry {
    0% {
      opacity: 0;
      backdrop-filter: blur(0px);
    }
    100% {
      opacity: 1;
      backdrop-filter: blur(4px);
    }
  }

  .modal-animate-in {
    animation: modalEntry 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .modal-animate-out {
    animation: modalExit 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .backdrop-animate-in {
    animation: backdropEntry 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Style scrollbar to match background */
  * {
    scrollbar-width: thin;
    scrollbar-color: rgb(24, 24, 27) rgb(24, 24, 27);
  }
  
  *::-webkit-scrollbar {
    width: 8px;
  }
  
  *::-webkit-scrollbar-track {
    background: rgb(24, 24, 27);
  }
  
  *::-webkit-scrollbar-thumb {
    background-color: rgb(24, 24, 27);
    border-radius: 4px;
  }
`;

export default function InfoModal({ open, onOpenChange }) {
  return (
    <>
      <style>{customStyles}</style>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="bg-zinc-900 border-zinc-800 w-full lg:max-w-[50%] h-[80vh] p-0 modal-animate-in fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          {/* Top bar - opaque */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-zinc-900 z-10" />
          
          {/* Bottom bar - opaque */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-zinc-900 z-10" />
          
          <Link 
            href="https://www.iimaginary.com/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="absolute left-6 top-6 z-20 transition-all duration-300 hover:opacity-60"
          >
            <div className="w-10 h-10 relative">
              <img
                src="/cloudLogoSVG.svg"
                alt="iImaginary Cloud Logo"
                className="invert"
              />
            </div>
          </Link>

          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-6 top-6 z-30 text-white hover:opacity-70 transition-opacity"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
              <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </button>

          <ScrollArea className="h-full">
            <div className="p-6 pt-16">
              <DialogHeader>
                <DialogTitle className="text-3xl font-bold text-zinc-100 mb-4">
                  <br/>
                  Automata
                </DialogTitle>
              </DialogHeader>
              
              <div className="text-zinc-300 space-y-6">
                <p className="text-lg leading-relaxed">
                  Automata is an interactive cellular automaton explorer that lets you experiment with 
                  one-dimensional reversible automata, visualizing how simple rules can create complex patterns.
                </p>

                <section>
                  <h3 className="text-zinc-100 font-semibold text-lg mb-2">How It Works</h3>
                  <p className="text-zinc-300">
                    Each cell in the automaton has a binary state (on/off). At each time step, a cell's next 
                    state is determined by its current state and its neighbors' states, following a specific rule 
                    (0-255). The pattern grows downward, showing the evolution of states over time.
                  </p>
                </section>

                <section>
                  <h3 className="text-zinc-100 font-semibold text-lg mb-2">Key Features</h3>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                    <li>Adjust grid size and rule numbers</li>
                    <li>Toggle reversible mode for time-reversible patterns</li>
                    <li>Control animation speed and direction</li>
                    <li>Export patterns as PNG images</li>
                    <li>Choose from multiple color palettes</li>
                    <li>Add random mutations to explore chaos theory</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-zinc-100 font-semibold text-lg mb-2">Inspiration</h3>
                  <p className="text-zinc-300">
                    Based on the concepts explored in Richie Paterson's article on 
                    <a 
                      href="https://richiejp.com/1d-reversible-automata" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 ml-1"
                    >
                      1D Reversible Automata
                    </a>
                    , this interactive implementation allows you to explore these mathematical concepts 
                    in real-time.
                  </p>
                </section>

                <section>
                  <h3 className="text-zinc-100 font-semibold text-lg mb-2">Mathematical Background</h3>
                  <p className="text-zinc-300">
                    The automaton uses 8 possible state combinations (2³) for 3 binary cells, 
                    resulting in 256 possible rules (2⁸). The reversible mode adds the previous state 
                    to make patterns time-reversible, creating fascinating emergent behaviors.
                  </p>
                </section>

                <section>
                  <h3 className="text-zinc-100 font-semibold text-lg mb-2">Source Code</h3>
                  <p className="text-zinc-300">
                    View the complete source code and contribute on 
                    <a 
                      href="https://github.com/sam-schorb/automata" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 ml-1"
                    >
                      GitHub
                    </a>
                    . The project is open source and welcomes contributions.
                  </p>
                </section>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}