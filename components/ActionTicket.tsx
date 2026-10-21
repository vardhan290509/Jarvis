"use client";

import React, { useState } from "react";
import { soundFX } from "@/lib/sound-effects";
import { TaskReceipt } from "@/lib/types";
import { CheckCircle2, AlertCircle, ArrowUpRight, Copy, Clock, MessageSquare, Send, Sparkles } from "lucide-react";

interface ActionTicketProps {
  receipt: TaskReceipt;
  onExecuteAction: (receipt: TaskReceipt) => void;
  onDismiss: (id: string) => void;
}

export const ActionTicket: React.FC<ActionTicketProps> = ({
  receipt,
  onExecuteAction,
  onDismiss,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    soundFX.playClick(900);
    setTimeout(() => setCopied(false), 2000);
  };

  const getToolIcon = (tool: string) => {
    switch (tool) {
      case "manage_alarm_timer":
        return <Clock className="w-4 h-4 text-industrial-orange" />;
      case "dispatch_whatsapp":
      case "dispatch_sms":
      case "dispatch_instagram":
        return <MessageSquare className="w-4 h-4 text-industrial-orange" />;
      case "dispatch_email":
        return <Send className="w-4 h-4 text-industrial-orange" />;
      default:
        return <Sparkles className="w-4 h-4 text-industrial-orange" />;
    }
  };

  return (
    <div className="w-full bg-industrial-bone border-2 border-industrial-carbon rounded-sm shadow-tactile-lg overflow-hidden animate-in slide-in-from-bottom-3 duration-200">
      {/* Sawtooth / Receipt Header */}
      <div className="bg-industrial-stone border-b-2 border-industrial-carbon px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getToolIcon(receipt.tool)}
          <span className="font-mono font-bold text-xs uppercase tracking-wider text-industrial-carbon">
            ACTION TICKET #{receipt.id.slice(-5).toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded-xs border ${
              receipt.status === "completed"
                ? "bg-industrial-moss text-industrial-bone border-industrial-moss"
                : receipt.status === "executing"
                ? "bg-industrial-orange text-industrial-bone border-industrial-orange animate-pulse"
                : "bg-industrial-stone text-industrial-carbon border-industrial-carbon"
            }`}
          >
            {receipt.status}
          </span>
          <button
            onClick={() => {
              soundFX.playClick(400);
              onDismiss(receipt.id);
            }}
            className="text-xs font-mono font-bold text-industrial-carbon hover:text-industrial-orange px-1"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Ticket Body */}
      <div className="p-3 space-y-2.5 font-mono">
        <div className="text-xs font-bold text-industrial-carbon leading-snug">
          {receipt.summary}
        </div>

        {/* Parameter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {Object.entries(receipt.parameters).map(([key, val]) => {
            if (val === null || val === undefined || typeof val === "object") return null;
            return (
              <div
                key={key}
                className="px-2 py-0.5 bg-industrial-stone border border-industrial-carbon/40 rounded-xs text-[10px] text-industrial-carbon flex items-center gap-1 shadow-tactile-sm"
              >
                <span className="text-industrial-carbon/60 uppercase">{key}:</span>
                <span className="font-bold truncate max-w-[150px]">{String(val)}</span>
              </div>
            );
          })}
        </div>

        {/* Execution Metadata */}
        <div className="flex items-center justify-between text-[9px] text-industrial-carbon/60 border-t border-dashed border-industrial-carbon/30 pt-2">
          <span>ENGINE: {receipt.engineUsed.toUpperCase()}</span>
          <span>LATENCY: {receipt.executionMs || 15}ms</span>
          <span>{new Date(receipt.timestamp).toLocaleTimeString()}</span>
        </div>

        {/* Action Button Strip */}
        <div className="flex items-center gap-2 pt-1">
          {receipt.clientAction && (
            <button
              onClick={() => {
                soundFX.playRelay(true);
                onExecuteAction(receipt);
              }}
              className="flex-1 bg-industrial-orange hover:bg-industrial-orange/90 text-industrial-bone font-mono font-bold text-xs py-2 px-3 border border-industrial-carbon rounded-xs shadow-tactile active:translate-y-0.5 active:shadow-tactile-press flex items-center justify-center gap-2 transition-all"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>LAUNCH ON DEVICE</span>
            </button>
          )}

          {receipt.clientAction?.data?.copyText && (
            <button
              onClick={() => handleCopy(receipt.clientAction?.data?.copyText)}
              className="bg-industrial-bone hover:bg-industrial-stone text-industrial-carbon font-mono font-bold text-xs py-2 px-3 border border-industrial-carbon rounded-xs shadow-tactile active:translate-y-0.5 active:shadow-tactile-press flex items-center gap-1.5 transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? "COPIED" : "COPY"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
