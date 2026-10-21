"use client";

import React, { useState, useRef } from "react";
import { soundFX } from "@/lib/sound-effects";
import { Crosshair, Activity } from "lucide-react";

export const DiagnosticPad: React.FC = () => {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const padRef = useRef<HTMLDivElement | null>(null);
  const lastSoundTick = useRef<number>(0);

  const handlePointer = (e: React.PointerEvent) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    const clampedX = Math.max(0, Math.min(rect.width, rawX));
    const clampedY = Math.max(0, Math.min(rect.height, rawY));

    const normX = Number((clampedX / rect.width).toFixed(2));
    const normY = Number((clampedY / rect.height).toFixed(2));

    setCoords({ x: normX, y: normY });

    // Throttle sound clicks
    const now = Date.now();
    if (now - lastSoundTick.current > 70) {
      lastSoundTick.current = now;
      soundFX.playClick(500 + normX * 800);
    }
  };

  const handlePointerLeave = () => {
    // Keep last coords or reset
  };

  return (
    <div className="w-full bg-industrial-bone border-2 border-industrial-carbon p-3 rounded-sm shadow-tactile select-none">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-industrial-carbon">
          <Activity className="w-3.5 h-3.5 text-industrial-orange" />
          <span>2D DIAGNOSTIC TOUCH MATRIX</span>
        </div>

        <div className="text-[10px] font-mono font-bold text-industrial-carbon">
          X: {coords ? coords.x.toFixed(2) : "0.50"} | Y: {coords ? coords.y.toFixed(2) : "0.50"}
        </div>
      </div>

      {/* Touch Area */}
      <div
        ref={padRef}
        onPointerDown={handlePointer}
        onPointerMove={(e) => {
          if (e.buttons > 0) handlePointer(e);
        }}
        onPointerUp={handlePointer}
        onPointerLeave={handlePointerLeave}
        className="relative w-full h-24 bg-industrial-stone border-2 border-industrial-carbon rounded-xs cursor-crosshair touch-none overflow-hidden"
      >
        {/* Dot Matrix Grid */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: "radial-gradient(#141413 1px, transparent 1px)",
            backgroundSize: "12px 12px",
          }}
        />

        {/* Center Target Axes */}
        <div className="absolute inset-y-0 left-1/2 w-[1px] bg-industrial-carbon/30 border-dashed" />
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-industrial-carbon/30 border-dashed" />

        {/* Crosshair Cursor */}
        {coords && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-75"
            style={{
              left: `${coords.x * 100}%`,
              top: `${coords.y * 100}%`,
            }}
          >
            <div className="relative flex items-center justify-center">
              <Crosshair className="w-5 h-5 text-industrial-orange animate-pulse" />
              <div className="absolute w-2 h-2 rounded-full bg-industrial-orange" />
            </div>
          </div>
        )}
      </div>

      <div className="mt-1.5 flex justify-between text-[8px] font-mono text-industrial-carbon/60">
        <span>DRAG TO TEST CALIBRATION & CAPACITIVE RESPONSE</span>
        <span>RES: 60FPS</span>
      </div>
    </div>
  );
};
