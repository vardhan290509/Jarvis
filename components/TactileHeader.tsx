"use client";

import React from "react";
import { soundFX } from "@/lib/sound-effects";
import { Sliders, Cpu, Battery, BatteryCharging, Compass, Radio } from "lucide-react";

interface TactileHeaderProps {
  engine: "nvidia" | "nebius" | "local-hybrid";
  modelName: string;
  latencyMs: number;
  tokensPerSec: number;
  batteryLevel?: number;
  isCharging?: boolean;
  isBlueprintMode: boolean;
  onToggleBlueprint: () => void;
  onOpenSettings: () => void;
}

export const TactileHeader: React.FC<TactileHeaderProps> = ({
  engine,
  modelName,
  latencyMs,
  tokensPerSec,
  batteryLevel,
  isCharging,
  isBlueprintMode,
  onToggleBlueprint,
  onOpenSettings,
}) => {
  return (
    <header className="w-full bg-industrial-stone border-b-2 border-industrial-carbon px-3 py-2 select-none">
      <div className="flex items-center justify-between text-xs font-mono text-industrial-carbon">
        {/* Left: Device & Model Spec */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-industrial-bone border border-industrial-carbon shadow-tactile-sm rounded-sm">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                engine === "nebius"
                  ? "bg-industrial-orange animate-pulse"
                  : engine === "nvidia"
                  ? "bg-industrial-moss animate-pulse"
                  : "bg-industrial-carbon"
              }`}
            />
            <span className="font-bold tracking-tight uppercase">
              {engine === "nebius" ? "NEBIUS AI" : engine === "nvidia" ? "NVIDIA NIM" : "TACTILE 01"}
            </span>
          </div>

          <span className="hidden sm:inline-block text-[10px] text-industrial-carbon/70 truncate max-w-[130px]">
            {modelName.split("/").pop()}
          </span>
        </div>

        {/* Center: Live Telemetry Metrics */}
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-industrial-orange animate-pulse" />
            <span>{latencyMs}ms</span>
          </div>

          <div className="hidden xs:flex items-center gap-1">
            <Cpu className="w-3 h-3 text-industrial-carbon/80" />
            <span>{tokensPerSec} t/s</span>
          </div>

          {batteryLevel !== undefined && (
            <div className="flex items-center gap-1">
              {isCharging ? (
                <BatteryCharging className="w-3 h-3 text-industrial-moss" />
              ) : (
                <Battery className="w-3 h-3 text-industrial-carbon" />
              )}
              <span>{Math.round(batteryLevel * 100)}%</span>
            </div>
          )}
        </div>

        {/* Right: Tactile Hardware Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Blueprint Mode Mechanical Toggle */}
          <button
            onClick={() => {
              soundFX.playRelay(!isBlueprintMode);
              onToggleBlueprint();
            }}
            className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border border-industrial-carbon rounded-sm transition-all flex items-center gap-1 ${
              isBlueprintMode
                ? "bg-industrial-orange text-industrial-bone shadow-tactile-press translate-y-0.5"
                : "bg-industrial-bone text-industrial-carbon shadow-tactile-sm active:translate-y-0.5 active:shadow-tactile-press"
            }`}
            title="Toggle Technical Blueprint Mode"
          >
            <Compass className="w-3 h-3" />
            <span className="hidden sm:inline">SCHEMATIC</span>
          </button>

          {/* Settings / Keys Drawer */}
          <button
            onClick={() => {
              soundFX.playClick(650);
              onOpenSettings();
            }}
            className="p-1.5 bg-industrial-bone border border-industrial-carbon shadow-tactile-sm rounded-sm hover:bg-industrial-stone active:translate-y-0.5 active:shadow-tactile-press"
            title="Hardware Configuration & API Keys"
          >
            <Sliders className="w-3.5 h-3.5 text-industrial-carbon" />
          </button>
        </div>
      </div>
    </header>
  );
};
