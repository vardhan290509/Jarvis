"use client";

import React, { useState, useRef, useEffect } from "react";
import { soundFX } from "@/lib/sound-effects";
import { RotateCw, Sparkles, Volume2, History } from "lucide-react";

interface KineticJogDialProps {
  onRotateStep: (direction: 1 | -1, totalSteps: number) => void;
  mode: "history" | "engine" | "speed";
  onChangeMode: (mode: "history" | "engine" | "speed") => void;
  currentValueLabel: string;
}

export const KineticJogDial: React.FC<KineticJogDialProps> = ({
  onRotateStep,
  mode,
  onChangeMode,
  currentValueLabel,
}) => {
  const [rotationAngle, setRotationAngle] = useState(0);
  const isDraggingRef = useRef(false);
  const startAngleRef = useRef(0);
  const currentAngleRef = useRef(0);
  const lastNotchRef = useRef(0);
  const dialRef = useRef<HTMLDivElement | null>(null);

  // Compute angle from center of dial to touch position
  const getAngle = (clientX: number, clientY: number): number => {
    if (!dialRef.current) return 0;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rad = Math.atan2(clientY - centerY, clientX - centerX);
    return rad * (180 / Math.PI);
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    isDraggingRef.current = true;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    startAngleRef.current = getAngle(clientX, clientY) - currentAngleRef.current;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const angle = getAngle(clientX, clientY) - startAngleRef.current;

    currentAngleRef.current = angle;
    setRotationAngle(angle);

    // Calculate notch clicks every 15 degrees
    const notchSize = 15;
    const currentNotch = Math.floor(angle / notchSize);
    if (currentNotch !== lastNotchRef.current) {
      const direction: 1 | -1 = currentNotch > lastNotchRef.current ? 1 : -1;
      lastNotchRef.current = currentNotch;
      soundFX.playJogTick(Math.abs(currentNotch));
      onRotateStep(direction, currentNotch);
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  // Generate 24 tick notches for a precision industrial wheel
  const ticks = Array.from({ length: 24 }).map((_, i) => i * 15);

  return (
    <div className="w-full bg-industrial-stone border-2 border-industrial-carbon p-3 rounded-sm shadow-tactile select-none">
      {/* Top Header & Mode Selectors */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-industrial-carbon">
          2D KINETIC JOG DIAL
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              soundFX.playClick(600);
              onChangeMode("engine");
            }}
            className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase border border-industrial-carbon rounded-xs transition-all ${
              mode === "engine"
                ? "bg-industrial-orange text-industrial-bone shadow-tactile-press translate-y-0.5"
                : "bg-industrial-bone text-industrial-carbon shadow-tactile-sm"
            }`}
            title="Switch NVIDIA NIM / Nebius AI"
          >
            ENGINE
          </button>

          <button
            onClick={() => {
              soundFX.playClick(600);
              onChangeMode("history");
            }}
            className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase border border-industrial-carbon rounded-xs transition-all ${
              mode === "history"
                ? "bg-industrial-orange text-industrial-bone shadow-tactile-press translate-y-0.5"
                : "bg-industrial-bone text-industrial-carbon shadow-tactile-sm"
            }`}
            title="Scrub Task History"
          >
            HISTORY
          </button>

          <button
            onClick={() => {
              soundFX.playClick(600);
              onChangeMode("speed");
            }}
            className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase border border-industrial-carbon rounded-xs transition-all ${
              mode === "speed"
                ? "bg-industrial-orange text-industrial-bone shadow-tactile-press translate-y-0.5"
                : "bg-industrial-bone text-industrial-carbon shadow-tactile-sm"
            }`}
            title="Adjust Voice Speed"
          >
            SPEED
          </button>
        </div>
      </div>

      {/* Main Wheel Area */}
      <div className="flex items-center justify-between gap-4">
        {/* Flat 2D Precision Rotary Wheel */}
        <div
          ref={dialRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          className="relative w-28 h-28 mx-auto rounded-full bg-industrial-bone border-4 border-industrial-carbon shadow-tactile flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none transition-transform"
        >
          {/* Rotating Notch Ring */}
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center pointer-events-none"
            style={{ transform: `rotate(${rotationAngle}deg)` }}
          >
            {ticks.map((deg, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-3 bg-industrial-carbon origin-bottom"
                style={{
                  top: 4,
                  transform: `rotate(${deg}deg)`,
                  transformOrigin: "50% 52px",
                  height: i % 6 === 0 ? "8px" : "4px",
                  backgroundColor: i % 6 === 0 ? "#FF4F00" : "#141413",
                }}
              />
            ))}

            {/* Thumb Dimple / Groove on Wheel */}
            <div className="absolute top-4 w-4 h-4 rounded-full bg-industrial-stone border-2 border-industrial-carbon shadow-inner flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-industrial-orange" />
            </div>
          </div>

          {/* Static Center Core */}
          <div className="w-12 h-12 rounded-full bg-industrial-stone border-2 border-industrial-carbon flex flex-col items-center justify-center text-center shadow-tactile-sm pointer-events-none">
            <RotateCw className="w-3.5 h-3.5 text-industrial-carbon" />
            <span className="text-[7px] font-mono font-bold mt-0.5 uppercase">JOG</span>
          </div>
        </div>

        {/* Readout Pill */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-[9px] font-mono text-industrial-carbon/70 uppercase">CURRENT VALUE</div>
          <div className="mt-0.5 px-2 py-1.5 bg-industrial-bone border border-industrial-carbon rounded-xs font-mono font-bold text-xs text-industrial-carbon shadow-tactile-sm break-all">
            {currentValueLabel}
          </div>
          <div className="mt-1 text-[8px] font-mono text-industrial-carbon/60">
            Rotate dial with thumb for micro-tuning
          </div>
        </div>
      </div>
    </div>
  );
};
