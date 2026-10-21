"use client";

import React, { useEffect, useRef } from "react";

interface HeroOscilloscopeProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  isClarifying: boolean;
  analyserNode: AnalyserNode | null;
  statusLabel?: string;
  engineName: string;
  latencyMs: number;
}

export const HeroOscilloscope: React.FC<HeroOscilloscopeProps> = ({
  isListening,
  isSpeaking,
  isProcessing,
  isClarifying,
  analyserNode,
  statusLabel,
  engineName,
  latencyMs,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let bufferLength = 32;
    let dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;

      // Primary surface: Warm Alabaster
      ctx.fillStyle = "#F2EFE9";
      ctx.fillRect(0, 0, width, height);

      // Fine industrial millimeter grid lines
      ctx.strokeStyle = "#E4DFD7";
      ctx.lineWidth = 1;
      for (let y = 6; y < height; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      for (let x = 12; x < width; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Center reference baseline
      ctx.strokeStyle = "#C8C2B7";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Read audio data from mic or synthesize mechanical oscillation
      if (analyserNode && (isListening || isSpeaking)) {
        bufferLength = analyserNode.frequencyBinCount;
        if (dataArray.length !== bufferLength) {
          dataArray = new Uint8Array(bufferLength);
        }
        analyserNode.getByteFrequencyData(dataArray);
      } else {
        const time = Date.now() * 0.003;
        for (let i = 0; i < bufferLength; i++) {
          if (isProcessing) {
            dataArray[i] = Math.floor(Math.sin(time * 3 + i * 0.5) * 45 + 55);
          } else if (isClarifying) {
            dataArray[i] = Math.floor(Math.sin(time * 1.5 + i * 0.3) * 35 + 40);
          } else {
            dataArray[i] = Math.floor(Math.sin(time + i * 0.15) * 10 + 12);
          }
        }
      }

      // Render 2D Precision Stepped Bar Matrix
      const barCount = 30;
      const barWidth = Math.floor((width - (barCount - 1) * 3) / barCount);
      const step = Math.floor(bufferLength / barCount) || 1;

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * step] || 0;
        const normalized = val / 255;
        const barHeight = Math.max(3, normalized * (height - 18));
        const x = i * (barWidth + 3);
        const y = (height - barHeight) / 2;

        // Color coding by state
        if (isClarifying) {
          ctx.fillStyle = i % 3 === 0 ? "#D97706" : "#141413";
        } else if (isListening) {
          ctx.fillStyle = normalized > 0.45 ? "#FF4F00" : "#141413";
        } else if (isProcessing) {
          ctx.fillStyle = i % 4 === 0 ? "#FF4F00" : "#1E4D2B";
        } else if (isSpeaking) {
          ctx.fillStyle = "#FF4F00";
        } else {
          ctx.fillStyle = "#A8A29E";
        }

        // Stepped segmented bar drawing (tactile physical feel)
        const segmentH = 3;
        const segments = Math.floor(barHeight / segmentH);
        for (let s = 0; s < segments; s++) {
          const segY = y + s * segmentH;
          ctx.fillRect(x, segY, barWidth, segmentH - 1);
        }
      }

      // Decibel markings
      ctx.fillStyle = "#141413";
      ctx.font = "8px monospace";
      ctx.fillText("+0dB", 4, 10);
      ctx.fillText("-24dB", 4, height / 2 - 2);
      ctx.fillText("-48dB", 4, height - 4);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isListening, isSpeaking, isProcessing, isClarifying, analyserNode]);

  // Determine current active status
  const currentStatus = isClarifying
    ? "AWAITING CLARIFICATION"
    : isListening
    ? "MIC INGEST // ACTIVE"
    : isSpeaking
    ? "SYNTH VOX // OUTPUT"
    : isProcessing
    ? `INFERENCE // ${engineName.toUpperCase()}`
    : "STANDBY // CARRIER READY";

  const statusColor = isClarifying
    ? "bg-industrial-amber text-industrial-bone"
    : isListening
    ? "bg-industrial-orange text-industrial-bone animate-pulse"
    : isProcessing
    ? "bg-industrial-moss text-industrial-bone"
    : "bg-industrial-stone text-industrial-carbon";

  return (
    <div className="w-full bg-industrial-stone border-2 border-industrial-carbon rounded-sm p-2 shadow-tactile select-none">
      {/* Top Telemetry Header Strip */}
      <div className="flex items-center justify-between pb-1 text-[9px] font-mono font-bold uppercase text-industrial-carbon/80 border-b border-industrial-carbon/30">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isListening
                ? "bg-industrial-orange animate-ping"
                : isClarifying
                ? "bg-industrial-amber animate-pulse"
                : isProcessing
                ? "bg-industrial-moss animate-pulse"
                : "bg-industrial-carbon"
            }`}
          />
          <span>JARVIS // OSCILLOSCOPE 01</span>
        </div>

        <div className="flex items-center gap-2">
          <span>{latencyMs}MS RTT</span>
          <span>{engineName.toUpperCase()}</span>
        </div>
      </div>

      {/* Main 2D Oscilloscope Canvas Window */}
      <div className="relative mt-1.5 w-full h-20 bg-industrial-bone border border-industrial-carbon overflow-hidden">
        <canvas
          ref={canvasRef}
          width={380}
          height={80}
          className="w-full h-full block"
        />

        {/* Dynamic Status Badge */}
        <div className="absolute bottom-1 right-1.5">
          <span className={`px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase rounded-xs border border-industrial-carbon ${statusColor}`}>
            {statusLabel || currentStatus}
          </span>
        </div>
      </div>

      {/* Kinetic Tape Calibration Ticker */}
      <div className="mt-1 flex items-center justify-between text-[8px] font-mono text-industrial-carbon/70 pt-0.5">
        <span>60FPS ANALYSER</span>
        <span className="font-bold tracking-widest uppercase">
          {isListening ? "INPUT CARRIER ENGAGED" : "LOW-POWER KEEP-ALIVE 15HZ"}
        </span>
        <span>REC: AUTO</span>
      </div>
    </div>
  );
};
