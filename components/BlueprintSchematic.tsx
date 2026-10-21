"use client";

import React, { useState, useEffect } from "react";
import { soundFX } from "@/lib/sound-effects";
import { Cpu, Zap, Activity, HardDrive, Compass, Terminal, Shield } from "lucide-react";

interface BlueprintSchematicProps {
  onClose: () => void;
  fps: number;
  latencyMs: number;
  tokensPerSec: number;
  engine: string;
  model: string;
  batteryLevel?: number;
  isCharging?: boolean;
  orientation?: { alpha: number | null; beta: number | null; gamma: number | null };
}

export const BlueprintSchematic: React.FC<BlueprintSchematicProps> = ({
  onClose,
  fps,
  latencyMs,
  tokensPerSec,
  engine,
  model,
  batteryLevel,
  isCharging,
  orientation,
}) => {
  const [activeWorkers, setActiveWorkers] = useState(2);
  const [swStatus, setSwStatus] = useState("CONNECTED");

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(() => setSwStatus("RUNNING [BACKGROUND SYNC ON]"));
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#0B2545] text-[#E0F2FE] p-4 font-mono overflow-y-auto select-none">
      {/* High-Contrast Blueprint Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #64B5F6 1px, transparent 1px),
            linear-gradient(to bottom, #64B5F6 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative z-10 max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#64B5F6] pb-2">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#38BDF8] animate-spin" style={{ animationDuration: "12s" }} />
            <div>
              <h1 className="text-sm font-bold tracking-widest uppercase">
                JARVIS // TECHNICAL BLUEPRINT SCHEMATIC
              </h1>
              <p className="text-[10px] text-[#93C5FD]">SYSTEM DIAGNOSTIC SPECIFICATION V1.0</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFX.playRelay(false);
              onClose();
            }}
            className="px-2.5 py-1 bg-[#1E3A8A] border border-[#64B5F6] text-[#E0F2FE] text-xs font-bold uppercase hover:bg-[#3B82F6] active:translate-y-0.5"
          >
            CLOSE [ESC]
          </button>
        </div>

        {/* Telemetry Matrix Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-[#0F325E] border border-[#64B5F6]/60 rounded-xs space-y-1">
            <div className="text-[10px] text-[#93C5FD] uppercase flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-[#38BDF8]" />
              FRAME STABILITY
            </div>
            <div className="text-xl font-bold text-white">{fps} FPS</div>
            <div className="text-[9px] text-[#93C5FD]">TARGET: 60/120 FPS LOCKED</div>
          </div>

          <div className="p-2.5 bg-[#0F325E] border border-[#64B5F6]/60 rounded-xs space-y-1">
            <div className="text-[10px] text-[#93C5FD] uppercase flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
              API RESPONSE LATENCY
            </div>
            <div className="text-xl font-bold text-white">{latencyMs} ms</div>
            <div className="text-[9px] text-[#93C5FD]">NVIDIA / NEBIUS RTT</div>
          </div>

          <div className="p-2.5 bg-[#0F325E] border border-[#64B5F6]/60 rounded-xs space-y-1">
            <div className="text-[10px] text-[#93C5FD] uppercase flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-[#10B981]" />
              INFERENCE THROUGHPUT
            </div>
            <div className="text-xl font-bold text-white">{tokensPerSec} tok/s</div>
            <div className="text-[9px] text-[#93C5FD]">STREAMING TOKEN VELOCITY</div>
          </div>

          <div className="p-2.5 bg-[#0F325E] border border-[#64B5F6]/60 rounded-xs space-y-1">
            <div className="text-[10px] text-[#93C5FD] uppercase flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-[#38BDF8]" />
              BATTERY TELEMETRY
            </div>
            <div className="text-xl font-bold text-white">
              {batteryLevel !== undefined ? `${Math.round(batteryLevel * 100)}%` : "100%"}
            </div>
            <div className="text-[9px] text-[#93C5FD]">
              {isCharging ? "CHARGER ATTACHED" : "ON INTERNAL CELL"}
            </div>
          </div>
        </div>

        {/* Accelerometer & Gyroscope Vector Section */}
        <div className="p-3 bg-[#0F325E] border border-[#64B5F6]/60 rounded-xs space-y-2">
          <div className="text-[10px] text-[#93C5FD] uppercase tracking-wider flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-[#38BDF8]" />
            ORIENTATION VECTORS (DEVICEMOTION / GYRO)
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-[#0B2545] border border-[#64B5F6]/40">
              <div className="text-[9px] text-[#93C5FD]">ALPHA (Z)</div>
              <div className="font-bold text-white text-sm">
                {orientation?.alpha !== null && orientation?.alpha !== undefined
                  ? `${Math.round(orientation.alpha)}°`
                  : "0°"}
              </div>
            </div>

            <div className="p-2 bg-[#0B2545] border border-[#64B5F6]/40">
              <div className="text-[9px] text-[#93C5FD]">BETA (X)</div>
              <div className="font-bold text-white text-sm">
                {orientation?.beta !== null && orientation?.beta !== undefined
                  ? `${Math.round(orientation.beta)}°`
                  : "0°"}
              </div>
            </div>

            <div className="p-2 bg-[#0B2545] border border-[#64B5F6]/40">
              <div className="text-[9px] text-[#93C5FD]">GAMMA (Y)</div>
              <div className="font-bold text-white text-sm">
                {orientation?.gamma !== null && orientation?.gamma !== undefined
                  ? `${Math.round(orientation.gamma)}°`
                  : "0°"}
              </div>
            </div>
          </div>
        </div>

        {/* Background Execution Pipeline */}
        <div className="p-3 bg-[#0F325E] border border-[#64B5F6]/60 rounded-xs space-y-1.5 text-xs">
          <div className="text-[10px] text-[#93C5FD] uppercase flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-[#10B981]" />
            BACKGROUND PERSISTENCE SUBSYSTEMS
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between border-b border-[#64B5F6]/20 pb-0.5">
              <span>SERVICE WORKER (sw.js):</span>
              <span className="text-[#34D399] font-bold">{swStatus}</span>
            </div>
            <div className="flex justify-between border-b border-[#64B5F6]/20 pb-0.5">
              <span>AGENT WEB WORKER (agent-worker.js):</span>
              <span className="text-[#34D399] font-bold">ACTIVE [PRECISION 250MS LOOP]</span>
            </div>
            <div className="flex justify-between border-b border-[#64B5F6]/20 pb-0.5">
              <span>SILENT MEDIASESSION KEEP-ALIVE:</span>
              <span className="text-[#34D399] font-bold">ARMED [15HZ CARRIER]</span>
            </div>
            <div className="flex justify-between">
              <span>SCREEN WAKE LOCK:</span>
              <span className="text-[#38BDF8] font-bold">ENGAGED</span>
            </div>
          </div>
        </div>

        {/* Active Engine Spec */}
        <div className="p-3 bg-[#0F325E] border border-[#64B5F6]/60 rounded-xs space-y-1 text-xs">
          <div className="text-[10px] text-[#93C5FD] uppercase flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5 text-[#F59E0B]" />
            ACTIVE AI ENGINE & MODEL SPEC
          </div>
          <div className="text-white font-bold">{engine.toUpperCase()}</div>
          <div className="text-[10px] text-[#93C5FD] break-all">{model}</div>
        </div>
      </div>
    </div>
  );
};
