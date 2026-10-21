"use client";

import React from "react";
import { soundFX } from "@/lib/sound-effects";
import { Mic, MicOff, Send, Sliders, Radio } from "lucide-react";

interface ControlDeckProps {
  inputText: string;
  setInputText: (text: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
  isProcessing: boolean;
  onSend: (text?: string) => void;
  onOpenDrawer: () => void;
}

export const ControlDeck: React.FC<ControlDeckProps> = ({
  inputText,
  setInputText,
  isListening,
  onToggleListening,
  isProcessing,
  onSend,
  onOpenDrawer,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    onSend();
  };

  const samplePrompts = [
    "Set 5m timer",
    "Send WhatsApp to Rahul",
    "Message @nebius_ai on IG",
    "Draft email to mentor",
    "Search NVIDIA NIM specs",
  ];

  return (
    <footer className="w-full bg-industrial-stone border-t-2 border-industrial-carbon p-2.5 space-y-2 select-none">
      {/* Quick Prompt Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              soundFX.playClick(750);
              onSend(prompt);
            }}
            className="px-2 py-0.5 bg-industrial-bone hover:bg-industrial-stone border border-industrial-carbon rounded-xs font-mono text-[9px] font-bold text-industrial-carbon whitespace-nowrap shadow-tactile-sm active:translate-y-0.5"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Large Mechanical Push-To-Talk Button */}
        <button
          type="button"
          onClick={onToggleListening}
          className={`p-2.5 border-2 border-industrial-carbon rounded-xs font-mono font-bold transition-all flex items-center justify-center ${
            isListening
              ? "bg-industrial-orange text-industrial-bone shadow-tactile-press translate-y-0.5 animate-pulse"
              : "bg-industrial-bone text-industrial-carbon shadow-tactile hover:bg-industrial-stone active:translate-y-0.5 active:shadow-tactile-press"
          }`}
          title={isListening ? "Mute Voice Capture" : "Engage Hands-Free Voice Controller"}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Text Input Terminal */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? "Listening to voice input..." : "Command JARVIS (e.g. Set 5m timer)..."}
            className="w-full bg-industrial-bone border-2 border-industrial-carbon px-2.5 py-2 font-mono text-xs text-industrial-carbon placeholder:text-industrial-carbon/40 rounded-xs focus:outline-none focus:ring-1 focus:ring-industrial-orange shadow-inner"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className={`p-2.5 border-2 border-industrial-carbon rounded-xs font-mono font-bold transition-all ${
            inputText.trim() && !isProcessing
              ? "bg-industrial-carbon text-industrial-bone shadow-tactile active:translate-y-0.5 active:shadow-tactile-press"
              : "bg-industrial-stone text-industrial-carbon/30 border-industrial-carbon/40 shadow-none cursor-not-allowed"
          }`}
          title="Dispatch Command"
        >
          <Send className="w-4 h-4" />
        </button>

        {/* Drawer Trigger Button */}
        <button
          type="button"
          onClick={() => {
            soundFX.playClick(600);
            onOpenDrawer();
          }}
          className="p-2.5 bg-industrial-bone hover:bg-industrial-stone border-2 border-industrial-carbon rounded-xs shadow-tactile active:translate-y-0.5"
          title="Hardware Config & Sensors Drawer"
        >
          <Sliders className="w-4 h-4 text-industrial-carbon" />
        </button>
      </form>
    </footer>
  );
};
