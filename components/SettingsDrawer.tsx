"use client";

import React, { useState, useEffect } from "react";
import { soundFX } from "@/lib/sound-effects";
import { AIProvider } from "@/lib/types";
import { Sliders, Key, Cpu, Volume2, Shield, Trash2, Check, RefreshCw } from "lucide-react";

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  preferredProvider: AIProvider;
  onSelectProvider: (provider: AIProvider) => void;
  nvidiaApiKey: string;
  onSaveNvidiaKey: (key: string) => void;
  nebiusApiKey: string;
  onSaveNebiusKey: (key: string) => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  onClearHistory: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  preferredProvider,
  onSelectProvider,
  nvidiaApiKey,
  onSaveNvidiaKey,
  nebiusApiKey,
  onSaveNebiusKey,
  soundEnabled,
  onToggleSound,
  onClearHistory,
}) => {
  const [localNvidiaKey, setLocalNvidiaKey] = useState(nvidiaApiKey);
  const [localNebiusKey, setLocalNebiusKey] = useState(nebiusApiKey);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    setLocalNvidiaKey(nvidiaApiKey);
  }, [nvidiaApiKey]);

  useEffect(() => {
    setLocalNebiusKey(nebiusApiKey);
  }, [nebiusApiKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveNvidiaKey(localNvidiaKey.trim());
    onSaveNebiusKey(localNebiusKey.trim());
    soundFX.playRelay(true);
    setSaveStatus("SAVED TO LOCAL SECURE STORAGE");
    setTimeout(() => setSaveStatus(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-industrial-carbon/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-industrial-bone border-t-4 sm:border-4 border-industrial-carbon p-4 shadow-tactile-lg max-h-[90dvh] overflow-y-auto">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-industrial-carbon">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-industrial-orange" />
            <span className="font-mono font-bold text-sm uppercase tracking-wider text-industrial-carbon">
              HARDWARE CONFIG & API KEYS
            </span>
          </div>

          <button
            onClick={() => {
              soundFX.playClick(450);
              onClose();
            }}
            className="text-xs font-mono font-bold text-industrial-carbon px-2 py-1 hover:bg-industrial-stone border border-industrial-carbon rounded-xs shadow-tactile-sm"
          >
            CLOSE
          </button>
        </div>

        <div className="py-3 space-y-4 font-mono text-xs text-industrial-carbon">
          {/* Provider Selection Buttons */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-industrial-carbon/80 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-industrial-orange" />
              <span>ACTIVE INFERENCE ENGINE ROUTER</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["auto", "nebius", "nvidia"] as AIProvider[]).map((prov) => (
                <button
                  key={prov}
                  onClick={() => {
                    soundFX.playRelay(prov !== preferredProvider);
                    onSelectProvider(prov);
                  }}
                  className={`py-2 px-2 border border-industrial-carbon font-bold uppercase text-[10px] rounded-xs transition-all ${
                    preferredProvider === prov
                      ? "bg-industrial-orange text-industrial-bone shadow-tactile-press translate-y-0.5"
                      : "bg-industrial-stone text-industrial-carbon shadow-tactile-sm active:translate-y-0.5"
                  }`}
                >
                  {prov === "auto" ? "AUTO LOAD-BAL" : prov === "nebius" ? "NEBIUS AI" : "NVIDIA NIM"}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-industrial-carbon/60">
              {preferredProvider === "auto"
                ? "Auto routes to lowest latency provider with automatic fallback."
                : preferredProvider === "nebius"
                ? "Forces inference via Nebius AI Studio Llama-3.3-70B."
                : "Forces inference via NVIDIA NIM Llama-3.3-70B."}
            </p>
          </div>

          {/* Nebius AI Studio Key */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-industrial-carbon/80 flex items-center gap-1">
              <Key className="w-3 h-3 text-industrial-orange" />
              <span>NEBIUS AI STUDIO API KEY</span>
            </label>
            <input
              type="password"
              value={localNebiusKey}
              onChange={(e) => setLocalNebiusKey(e.target.value)}
              placeholder="Paste Nebius API Key (Bearer token)..."
              className="w-full bg-industrial-stone border border-industrial-carbon px-2.5 py-1.5 text-xs text-industrial-carbon rounded-xs focus:outline-none focus:ring-1 focus:ring-industrial-orange"
            />
            <span className="text-[8px] text-industrial-carbon/60">
              Endpoint: https://api.studio.nebius.ai/v1 (or leave blank to use server .env)
            </span>
          </div>

          {/* NVIDIA NIM Key */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-industrial-carbon/80 flex items-center gap-1">
              <Key className="w-3 h-3 text-industrial-moss" />
              <span>NVIDIA NIM API KEY</span>
            </label>
            <input
              type="password"
              value={localNvidiaKey}
              onChange={(e) => setLocalNvidiaKey(e.target.value)}
              placeholder="Paste NVIDIA NIM Key (nvapi-...)..."
              className="w-full bg-industrial-stone border border-industrial-carbon px-2.5 py-1.5 text-xs text-industrial-carbon rounded-xs focus:outline-none focus:ring-1 focus:ring-industrial-moss"
            />
            <span className="text-[8px] text-industrial-carbon/60">
              Endpoint: https://integrate.api.nvidia.com/v1 (or leave blank to use server .env)
            </span>
          </div>

          {/* Sound & Haptic FX Toggle */}
          <div className="flex items-center justify-between p-2 bg-industrial-stone border border-industrial-carbon rounded-xs">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-industrial-carbon" />
              <div>
                <div className="font-bold text-[11px] uppercase">PROCEDURAL SOUND FX</div>
                <div className="text-[8px] text-industrial-carbon/70">Sub-2KB Web Audio relays & blips</div>
              </div>
            </div>

            <button
              onClick={() => {
                const nextState = !soundEnabled;
                soundFX.setSoundEnabled(nextState);
                if (nextState) soundFX.playRelay(true);
                onToggleSound(nextState);
              }}
              className={`px-3 py-1 text-[10px] font-bold uppercase border border-industrial-carbon rounded-xs ${
                soundEnabled
                  ? "bg-industrial-moss text-industrial-bone shadow-tactile-press"
                  : "bg-industrial-bone text-industrial-carbon shadow-tactile-sm"
              }`}
            >
              {soundEnabled ? "ENABLED" : "MUTED"}
            </button>
          </div>

          {/* Save Status Banner */}
          {saveStatus && (
            <div className="p-2 bg-industrial-moss text-industrial-bone font-bold text-[10px] text-center border border-industrial-carbon rounded-xs">
              ✓ {saveStatus}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-industrial-carbon/30">
            <button
              onClick={handleSave}
              className="flex-1 bg-industrial-carbon hover:bg-industrial-carbon/90 text-industrial-bone font-bold text-xs py-2 px-3 border border-industrial-carbon rounded-xs shadow-tactile active:translate-y-0.5 active:shadow-tactile-press flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>APPLY SETTINGS</span>
            </button>

            <button
              onClick={() => {
                soundFX.playClick(300);
                onClearHistory();
              }}
              className="bg-industrial-bone hover:bg-industrial-stone text-industrial-carbon font-bold text-xs py-2 px-3 border border-industrial-carbon rounded-xs shadow-tactile active:translate-y-0.5 active:shadow-tactile-press flex items-center gap-1"
              title="Reset conversation state"
            >
              <Trash2 className="w-3.5 h-3.5 text-industrial-carbon" />
              <span>RESET</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
