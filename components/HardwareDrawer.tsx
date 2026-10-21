"use client";

import React, { useState, useEffect } from "react";
import { soundFX } from "@/lib/sound-effects";
import { hardware, PermissionStatusMap } from "@/lib/hardware";
import { AIProvider, TaskReceipt } from "@/lib/types";
import {
  Sliders,
  Cpu,
  Key,
  Shield,
  Volume2,
  Mic,
  Bell,
  Users,
  MapPin,
  Trash2,
  CheckCircle2,
  RefreshCw,
  X,
  History,
} from "lucide-react";

interface HardwareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  preferredProvider: AIProvider;
  onSelectProvider: (p: AIProvider) => void;
  nvidiaApiKey: string;
  onSaveNvidiaKey: (k: string) => void;
  nebiusApiKey: string;
  onSaveNebiusKey: (k: string) => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  receipts: TaskReceipt[];
  onClearHistory: () => void;
}

export const HardwareDrawer: React.FC<HardwareDrawerProps> = ({
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
  receipts,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<"calibration" | "engine" | "history">("engine");
  const [localNvidiaKey, setLocalNvidiaKey] = useState(nvidiaApiKey);
  const [localNebiusKey, setLocalNebiusKey] = useState(nebiusApiKey);
  const [permissions, setPermissions] = useState<PermissionStatusMap | null>(null);
  const [calibrating, setCalibrating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    setLocalNvidiaKey(nvidiaApiKey);
  }, [nvidiaApiKey]);

  useEffect(() => {
    setLocalNebiusKey(nebiusApiKey);
  }, [nebiusApiKey]);

  useEffect(() => {
    if (isOpen) {
      hardware.getInitialPermissions().then(setPermissions);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyKeys = () => {
    onSaveNvidiaKey(localNvidiaKey.trim());
    onSaveNebiusKey(localNebiusKey.trim());
    soundFX.playRelay(true);
    setStatusMsg("API KEYS SAVED TO LOCAL DEVICE STORAGE");
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleRunCalibration = async () => {
    setCalibrating(true);
    soundFX.playRelay(true);

    await hardware.requestMicrophone();
    await hardware.requestNotifications();
    await hardware.acquireWakeLock();
    soundFX.startBackgroundKeepAlive();

    const updated = await hardware.getInitialPermissions();
    setPermissions(updated);
    setCalibrating(false);
    soundFX.playClick(1000);
    setStatusMsg("ALL HARDWARE SENSORS ENGAGED & PERMISSIONS CALIBRATED");
    setTimeout(() => setStatusMsg(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-industrial-carbon/70 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-industrial-bone border-t-4 sm:border-4 border-industrial-carbon p-3 shadow-tactile-lg max-h-[88dvh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-industrial-carbon">
          <div className="flex items-center gap-1.5 font-mono font-bold text-xs uppercase tracking-wider text-industrial-carbon">
            <Sliders className="w-4 h-4 text-industrial-orange" />
            <span>JARVIS // HARDWARE CHASSIS</span>
          </div>

          <button
            onClick={() => {
              soundFX.playClick(400);
              onClose();
            }}
            className="p-1 hover:bg-industrial-stone border border-industrial-carbon rounded-xs shadow-tactile-sm"
          >
            <X className="w-3.5 h-3.5 text-industrial-carbon" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 my-2 font-mono text-[10px] font-bold uppercase">
          <button
            onClick={() => {
              soundFX.playClick(600);
              setActiveTab("engine");
            }}
            className={`py-1.5 border border-industrial-carbon rounded-xs ${
              activeTab === "engine"
                ? "bg-industrial-orange text-industrial-bone shadow-tactile-press translate-y-0.5"
                : "bg-industrial-stone text-industrial-carbon shadow-tactile-sm"
            }`}
          >
            AI ENGINES
          </button>

          <button
            onClick={() => {
              soundFX.playClick(600);
              setActiveTab("calibration");
            }}
            className={`py-1.5 border border-industrial-carbon rounded-xs ${
              activeTab === "calibration"
                ? "bg-industrial-orange text-industrial-bone shadow-tactile-press translate-y-0.5"
                : "bg-industrial-stone text-industrial-carbon shadow-tactile-sm"
            }`}
          >
            SENSORS & APIS
          </button>

          <button
            onClick={() => {
              soundFX.playClick(600);
              setActiveTab("history");
            }}
            className={`py-1.5 border border-industrial-carbon rounded-xs ${
              activeTab === "history"
                ? "bg-industrial-orange text-industrial-bone shadow-tactile-press translate-y-0.5"
                : "bg-industrial-stone text-industrial-carbon shadow-tactile-sm"
            }`}
          >
            RECEIPTS ({receipts.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs pr-1">
          {/* Status Message */}
          {statusMsg && (
            <div className="p-2 bg-industrial-moss text-industrial-bone text-[10px] font-bold text-center border border-industrial-carbon rounded-xs">
              ✓ {statusMsg}
            </div>
          )}

          {/* TAB 1: AI Engines */}
          {activeTab === "engine" && (
            <div className="space-y-3">
              {/* Provider Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-industrial-carbon/80 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-industrial-orange" />
                  <span>INFERENCE ROUTER</span>
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(["auto", "nebius", "nvidia"] as AIProvider[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        soundFX.playRelay(p !== preferredProvider);
                        onSelectProvider(p);
                      }}
                      className={`py-1.5 text-[9px] font-bold uppercase border border-industrial-carbon rounded-xs ${
                        preferredProvider === p
                          ? "bg-industrial-carbon text-industrial-bone shadow-tactile-press"
                          : "bg-industrial-stone text-industrial-carbon shadow-tactile-sm"
                      }`}
                    >
                      {p === "auto" ? "AUTO LOAD-BAL" : p === "nebius" ? "NEBIUS AI" : "NVIDIA NIM"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nebius API Key */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-industrial-carbon/80 flex items-center gap-1">
                  <Key className="w-3 h-3 text-industrial-orange" />
                  <span>NEBIUS AI STUDIO KEY</span>
                </label>
                <input
                  type="password"
                  value={localNebiusKey}
                  onChange={(e) => setLocalNebiusKey(e.target.value)}
                  placeholder="Paste Nebius key (Bearer token)..."
                  className="w-full bg-industrial-stone border border-industrial-carbon p-2 text-xs text-industrial-carbon rounded-xs focus:outline-none focus:ring-1 focus:ring-industrial-orange"
                />
                <span className="text-[8px] text-industrial-carbon/60">
                  Target: https://api.studio.nebius.ai/v1 (Llama-3.3-70B-Instruct-fast)
                </span>
              </div>

              {/* NVIDIA NIM Key */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-industrial-carbon/80 flex items-center gap-1">
                  <Key className="w-3 h-3 text-industrial-moss" />
                  <span>NVIDIA NIM API KEY</span>
                </label>
                <input
                  type="password"
                  value={localNvidiaKey}
                  onChange={(e) => setLocalNvidiaKey(e.target.value)}
                  placeholder="Paste NVIDIA NIM key (nvapi-...)..."
                  className="w-full bg-industrial-stone border border-industrial-carbon p-2 text-xs text-industrial-carbon rounded-xs focus:outline-none focus:ring-1 focus:ring-industrial-moss"
                />
                <span className="text-[8px] text-industrial-carbon/60">
                  Target: https://integrate.api.nvidia.com/v1 (Llama-3.3-70B-Instruct)
                </span>
              </div>

              {/* Apply Keys Button */}
              <button
                onClick={handleApplyKeys}
                className="w-full bg-industrial-carbon hover:bg-industrial-carbon/90 text-industrial-bone font-bold text-xs py-2 border border-industrial-carbon rounded-xs shadow-tactile active:translate-y-0.5"
              >
                APPLY & SAVE KEYS
              </button>
            </div>
          )}

          {/* TAB 2: Hardware Calibration & Sensors */}
          {activeTab === "calibration" && (
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase text-industrial-carbon/80">
                MOBILE WEB SENSOR BINDINGS
              </div>

              {[
                { title: "MIC & SPEECH RECOGNITION", ok: permissions?.microphone === "granted", icon: <Mic className="w-3.5 h-3.5" /> },
                { title: "PUSH NOTIFICATIONS & ALERTS", ok: permissions?.notifications === "granted", icon: <Bell className="w-3.5 h-3.5" /> },
                { title: "SCREEN WAKE LOCK (KEEP ALIVE)", ok: permissions?.wakeLock !== "unsupported", icon: <Shield className="w-3.5 h-3.5" /> },
                { title: "DEVICE CONTACT RESOLUTION", ok: true, icon: <Users className="w-3.5 h-3.5" /> },
                { title: "GEOLOCATION & BATTERY SENSORS", ok: true, icon: <MapPin className="w-3.5 h-3.5" /> },
              ].map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-industrial-stone border border-industrial-carbon rounded-xs text-[10px]">
                  <div className="flex items-center gap-1.5 font-bold">
                    {s.icon}
                    <span>{s.title}</span>
                  </div>
                  <span className={`font-bold flex items-center gap-0.5 ${s.ok ? "text-industrial-moss" : "text-industrial-amber"}`}>
                    {s.ok ? <CheckCircle2 className="w-3 h-3" /> : "PROMPT"}
                    {s.ok ? "ENGAGED" : "UNBOUND"}
                  </span>
                </div>
              ))}

              <button
                onClick={handleRunCalibration}
                disabled={calibrating}
                className="w-full bg-industrial-orange hover:bg-industrial-orange/90 text-industrial-bone font-bold text-xs py-2 border border-industrial-carbon rounded-xs shadow-tactile active:translate-y-0.5"
              >
                {calibrating ? "ENGAGING SENSORS..." : "CALIBRATE ALL SENSORS & APIS"}
              </button>
            </div>
          )}

          {/* TAB 3: Receipts Archive */}
          {activeTab === "history" && (
            <div className="space-y-2">
              {receipts.length === 0 ? (
                <div className="p-4 text-center text-industrial-carbon/60 text-[10px]">
                  NO EXECUTED ACTION RECEIPTS RECORDED YET.
                </div>
              ) : (
                receipts.map((r) => (
                  <div key={r.id} className="p-2 bg-industrial-stone border border-industrial-carbon rounded-xs space-y-1 text-[10px]">
                    <div className="flex items-center justify-between font-bold">
                      <span className="uppercase text-industrial-orange">#{r.id.slice(-5)} // {r.tool}</span>
                      <span className="text-industrial-carbon/60">{new Date(r.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-industrial-carbon leading-snug">{r.summary}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Universal Hardware Controls */}
          <div className="pt-2 border-t border-industrial-carbon/30 flex items-center justify-between">
            {/* Sound Toggle */}
            <button
              onClick={() => {
                const n = !soundEnabled;
                soundFX.setSoundEnabled(n);
                if (n) soundFX.playRelay(true);
                onToggleSound(n);
              }}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase p-1.5 bg-industrial-stone border border-industrial-carbon rounded-xs shadow-tactile-sm"
            >
              <Volume2 className="w-3.5 h-3.5 text-industrial-carbon" />
              <span>SFX: {soundEnabled ? "ON" : "OFF"}</span>
            </button>

            {/* Clear History */}
            <button
              onClick={() => {
                soundFX.playClick(300);
                onClearHistory();
              }}
              className="flex items-center gap-1 text-[10px] font-bold uppercase p-1.5 bg-industrial-stone hover:bg-industrial-bone border border-industrial-carbon rounded-xs shadow-tactile-sm text-industrial-carbon"
            >
              <Trash2 className="w-3.5 h-3.5 text-industrial-carbon" />
              <span>RESET CONVERSATION</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
