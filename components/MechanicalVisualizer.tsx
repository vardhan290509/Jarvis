"use client";

import React, { useEffect, useRef } from "react";

interface MechanicalVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  statusText: string;
  analyserNode: AnalyserNode | null;
}

export const MechanicalVisualizer: React.FC<MechanicalVisualizerProps> = ({
  isListening,
  isSpeaking,
  statusText,
  analyserNode,
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

      // Clear with Warm Alabaster
      ctx.fillStyle = "#F2EFE9";
      ctx.fillRect(0, 0, width, height);

      // Draw subtle 2D technical grid lines
      ctx.strokeStyle = "#E4DFD7";
      ctx.lineWidth = 1;
      for (let y = 8; y < height; y += 12) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw center baseline
      ctx.strokeStyle = "#C8C2B7";
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (analyserNode && (isListening || isSpeaking)) {
        bufferLength = analyserNode.frequencyBinCount;
        if (dataArray.length !== bufferLength) {
          dataArray = new Uint8Array(bufferLength);
        }
        analyserNode.getByteFrequencyData(dataArray);
      } else {
        // Subtle rhythmic mechanical idle pulse
        const t = Date.now() * 0.003;
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = isSpeaking
            ? Math.floor(Math.sin(t * 2 + i * 0.4) * 50 + 70)
            : Math.floor(Math.sin(t + i * 0.2) * 12 + 15);
        }
      }

      // Draw 2D precision stepped bar matrix
      const barCount = 28;
      const barWidth = Math.floor((width - (barCount - 1) * 3) / barCount);
      const stepSize = Math.floor(bufferLength / barCount) || 1;

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * stepSize] || 0;
        const normalized = val / 255;
        const barHeight = Math.max(3, normalized * (height - 14));

        const x = i * (barWidth + 3);
        const y = (height - barHeight) / 2;

        // Choose bar color
        if (isSpeaking) {
          ctx.fillStyle = i % 4 === 0 ? "#FF4F00" : "#141413";
        } else if (isListening) {
          ctx.fillStyle = normalized > 0.4 ? "#FF4F00" : "#141413";
        } else {
          ctx.fillStyle = "#A8A29E";
        }

        // Draw segmented industrial stepped rectangles
        const segmentHeight = 4;
        const segments = Math.floor(barHeight / segmentHeight);
        for (let s = 0; s < segments; s++) {
          const segY = y + s * segmentHeight;
          ctx.fillRect(x, segY, barWidth, segmentHeight - 1);
        }
      }

      // Draw dB bounds markers
      ctx.fillStyle = "#141413";
      ctx.font = "8px monospace";
      ctx.fillText("+0dB", 4, 10);
      ctx.fillText("-24dB", 4, height - 4);
      ctx.fillText(isListening ? "[MIC ON]" : isSpeaking ? "[TTS OUT]" : "[STANDBY]", width - 58, 10);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isListening, isSpeaking, analyserNode]);

  return (
    <div className="w-full bg-industrial-bone border-2 border-industrial-carbon rounded-sm p-2 shadow-tactile">
      {/* Visualizer Canvas */}
      <div className="relative w-full h-24 overflow-hidden border border-industrial-carbon bg-industrial-bone">
        <canvas
          ref={canvasRef}
          width={360}
          height={96}
          className="w-full h-full block"
        />

        {/* Status Badge Overlay */}
        <div className="absolute bottom-1 left-2 flex items-center gap-1.5 bg-industrial-stone/90 border border-industrial-carbon px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isListening
                ? "bg-industrial-orange animate-ping"
                : isSpeaking
                ? "bg-industrial-moss"
                : "bg-industrial-carbon"
            }`}
          />
          <span>{statusText}</span>
        </div>
      </div>

      {/* Kinetic Typography Ticker */}
      <div className="mt-1.5 px-1 flex items-center justify-between text-[9px] font-mono text-industrial-carbon/80 border-t border-industrial-border pt-1">
        <span className="uppercase tracking-widest font-bold">JARVIS // AUDIO ENGINE</span>
        <span className="font-semibold">{isListening ? "AUDIO INGEST: ACTIVE" : isSpeaking ? "SYNTH VOX: ACTIVE" : "CARRIER: READY"}</span>
      </div>
    </div>
  );
};
