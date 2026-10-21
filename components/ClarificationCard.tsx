"use client";

import React, { useState } from "react";
import { soundFX } from "@/lib/sound-effects";
import { ClarificationRequest } from "@/lib/types";
import { HelpCircle, Mic, ArrowRight, CornerDownLeft } from "lucide-react";

interface ClarificationCardProps {
  clarification: ClarificationRequest;
  onAnswer: (answer: string) => void;
  onCancel: () => void;
  isListening: boolean;
}

export const ClarificationCard: React.FC<ClarificationCardProps> = ({
  clarification,
  onAnswer,
  onCancel,
  isListening,
}) => {
  const [customInput, setCustomInput] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!customInput.trim()) return;
    soundFX.playClick(850);
    onAnswer(customInput.trim());
    setCustomInput("");
  };

  return (
    <div className="w-full bg-industrial-bone border-2 border-industrial-amber rounded-sm p-2.5 shadow-tactile-lg animate-in slide-in-from-top-2 duration-150 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-industrial-amber/40">
        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-industrial-carbon">
          <span className="w-2 h-2 rounded-full bg-industrial-amber animate-ping" />
          <HelpCircle className="w-3.5 h-3.5 text-industrial-amber" />
          <span>AWAITING HOST CLARIFICATION</span>
        </div>

        <button
          onClick={() => {
            soundFX.playClick(400);
            onCancel();
          }}
          className="text-[10px] font-mono font-bold text-industrial-carbon/60 hover:text-industrial-carbon px-1"
        >
          DISMISS
        </button>
      </div>

      {/* Spoken Question */}
      <div className="py-2 font-mono">
        <div className="text-xs font-bold text-industrial-carbon leading-snug">
          "{clarification.question}"
        </div>
        <div className="text-[9px] text-industrial-carbon/70 uppercase mt-0.5">
          MISSING PARAMETER: <span className="font-bold underline text-industrial-amber">{clarification.missingField}</span>
        </div>
      </div>

      {/* Suggestion Chips */}
      {clarification.suggestions && clarification.suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1 pb-2">
          {clarification.suggestions.map((sug, i) => (
            <button
              key={i}
              onClick={() => {
                soundFX.playClick(900);
                onAnswer(sug);
              }}
              className="px-2 py-0.5 bg-industrial-stone hover:bg-industrial-bone border border-industrial-carbon rounded-xs font-mono text-[10px] font-medium text-industrial-carbon shadow-tactile-sm active:translate-y-0.5 flex items-center gap-1 transition-all"
            >
              <span>{sug}</span>
              <ArrowRight className="w-2 h-2 text-industrial-carbon/50" />
            </button>
          ))}
        </div>
      )}

      {/* Answer Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Type answer or speak into mic..."
            className="w-full bg-industrial-stone border border-industrial-carbon px-2 py-1.5 font-mono text-xs text-industrial-carbon rounded-xs focus:outline-none focus:ring-1 focus:ring-industrial-amber"
          />
          {isListening && (
            <div className="absolute right-2 top-2 flex items-center gap-1 text-[8px] font-mono text-industrial-orange animate-pulse">
              <Mic className="w-2.5 h-2.5" />
              <span>VOX</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!customInput.trim()}
          className="px-3 py-1.5 bg-industrial-amber text-industrial-bone font-mono font-bold text-xs border border-industrial-carbon rounded-xs shadow-tactile active:translate-y-0.5 flex items-center gap-1 disabled:opacity-50"
        >
          <span>FILL</span>
          <CornerDownLeft className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
};
