"use client";

import React, { useState } from "react";
import { soundFX } from "@/lib/sound-effects";
import { ClarificationRequest } from "@/lib/types";
import { HelpCircle, Mic, ArrowRight, CornerDownLeft } from "lucide-react";

interface ClarificationBannerProps {
  clarification: ClarificationRequest | null;
  onAnswerClarification: (answer: string) => void;
  onCancel: () => void;
  isListening: boolean;
}

export const ClarificationBanner: React.FC<ClarificationBannerProps> = ({
  clarification,
  onAnswerClarification,
  onCancel,
  isListening,
}) => {
  const [customAnswer, setCustomAnswer] = useState("");

  if (!clarification) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!customAnswer.trim()) return;
    soundFX.playClick(850);
    onAnswerClarification(customAnswer.trim());
    setCustomAnswer("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    soundFX.playClick(900);
    onAnswerClarification(suggestion);
  };

  return (
    <div className="w-full bg-industrial-bone border-2 border-industrial-amber rounded-sm p-3 shadow-tactile-lg animate-in slide-in-from-top-2 duration-200 select-none">
      {/* Header Badge */}
      <div className="flex items-center justify-between pb-2 border-b border-industrial-amber/40">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-industrial-amber animate-ping" />
          <span className="font-mono font-bold text-xs uppercase tracking-wider text-industrial-carbon flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-industrial-amber" />
            AWAITING HOST CLARIFICATION
          </span>
        </div>

        <button
          onClick={() => {
            soundFX.playClick(400);
            onCancel();
          }}
          className="text-xs font-mono font-bold text-industrial-carbon/60 hover:text-industrial-carbon px-1"
        >
          DISMISS
        </button>
      </div>

      {/* Spoken Question */}
      <div className="py-2.5 font-mono">
        <p className="text-sm font-bold text-industrial-carbon leading-snug">
          "{clarification.question}"
        </p>
        <span className="text-[10px] text-industrial-carbon/70 uppercase mt-1 inline-block">
          Missing Parameter: <span className="font-bold underline text-industrial-amber">{clarification.missingField}</span>
        </span>
      </div>

      {/* Suggestion Chips */}
      {clarification.suggestions && clarification.suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 py-1.5">
          {clarification.suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-2.5 py-1 bg-industrial-stone hover:bg-industrial-bone border border-industrial-carbon rounded-xs font-mono text-xs font-medium text-industrial-carbon shadow-tactile-sm active:translate-y-0.5 active:shadow-tactile-press transition-all flex items-center gap-1"
            >
              <span>{suggestion}</span>
              <ArrowRight className="w-2.5 h-2.5 text-industrial-carbon/50" />
            </button>
          ))}
        </div>
      )}

      {/* Answer Input Field */}
      <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-1.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={customAnswer}
            onChange={(e) => setCustomAnswer(e.target.value)}
            placeholder="Type your answer or speak into mic..."
            className="w-full bg-industrial-bone border border-industrial-carbon px-2.5 py-1.5 text-xs font-mono text-industrial-carbon placeholder:text-industrial-carbon/40 rounded-xs focus:outline-none focus:ring-1 focus:ring-industrial-amber"
          />
          {isListening && (
            <div className="absolute right-2 top-2 flex items-center gap-1 text-[9px] font-mono text-industrial-orange animate-pulse">
              <Mic className="w-3 h-3" />
              <span>LISTENING</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="px-3 py-1.5 bg-industrial-amber text-industrial-bone font-mono font-bold text-xs border border-industrial-carbon rounded-xs shadow-tactile active:translate-y-0.5 active:shadow-tactile-press flex items-center gap-1"
        >
          <span>SEND</span>
          <CornerDownLeft className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
};
