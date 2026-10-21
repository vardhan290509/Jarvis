"use client";

import React, { useState } from "react";
import { soundFX } from "@/lib/sound-effects";
import { TaskReceipt } from "@/lib/types";
import { ArrowUpRight, Copy, Check, X, Clock, MessageSquare, Send, Globe, Calculator } from "lucide-react";

interface ActionTicketProps {
  receipt: TaskReceipt;
  onExecute: (receipt: TaskReceipt) => void;
  onDismiss: (id: string) => void;
  onUpdateParam: (receiptId: string, paramKey: string, newValue: string) => void;
}

export const ActionTicket: React.FC<ActionTicketProps> = ({
  receipt,
  onExecute,
  onDismiss,
  onUpdateParam,
}) => {
  const [copied, setCopied] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    soundFX.playClick(900);
    setTimeout(() => setCopied(false), 2000);
  };

  const startEdit = (key: string, currentVal: any) => {
    setEditingKey(key);
    setEditValue(String(currentVal || ""));
    soundFX.playClick(600);
  };

  const saveEdit = (key: string) => {
    onUpdateParam(receipt.id, key, editValue);
    setEditingKey(null);
    soundFX.playRelay(true);
  };

  const getIcon = (tool: string) => {
    switch (tool) {
      case "manage_alarm_timer":
        return <Clock className="w-3.5 h-3.5 text-industrial-orange" />;
      case "dispatch_whatsapp":
      case "dispatch_sms":
      case "dispatch_instagram":
        return <MessageSquare className="w-3.5 h-3.5 text-industrial-orange" />;
      case "dispatch_email":
        return <Send className="w-3.5 h-3.5 text-industrial-orange" />;
      case "web_research_and_grounding":
        return <Globe className="w-3.5 h-3.5 text-industrial-orange" />;
      default:
        return <Calculator className="w-3.5 h-3.5 text-industrial-orange" />;
    }
  };

  return (
    <div className="w-full bg-industrial-bone border-2 border-industrial-carbon rounded-sm shadow-tactile-lg overflow-hidden animate-in slide-in-from-bottom-2 duration-150 select-none">
      {/* Sawtooth / Perforated Receipt Header */}
      <div className="bg-industrial-stone border-b-2 border-industrial-carbon px-2.5 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-industrial-carbon">
          {getIcon(receipt.tool)}
          <span>ACTION TICKET #{receipt.id.slice(-4).toUpperCase()}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`px-1.5 py-0.2 text-[8px] font-mono font-bold uppercase rounded-xs border ${
              receipt.status === "completed"
                ? "bg-industrial-moss text-industrial-bone border-industrial-moss"
                : receipt.status === "executing"
                ? "bg-industrial-orange text-industrial-bone border-industrial-orange animate-pulse"
                : "bg-industrial-bone text-industrial-carbon border-industrial-carbon"
            }`}
          >
            {receipt.status}
          </span>

          <button
            onClick={() => {
              soundFX.playClick(400);
              onDismiss(receipt.id);
            }}
            className="text-[11px] font-mono font-bold text-industrial-carbon/60 hover:text-industrial-carbon px-1"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Ticket Body Content */}
      <div className="p-2.5 space-y-2 font-mono">
        <div className="text-[11px] font-bold text-industrial-carbon leading-snug">
          {receipt.summary}
        </div>

        {/* Interactive Parameter Pills (Tap to Edit) */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {Object.entries(receipt.parameters).map(([key, val]) => {
            if (val === null || val === undefined || typeof val === "object") return null;
            const isEditing = editingKey === key;

            return (
              <div key={key}>
                {isEditing ? (
                  <div className="flex items-center gap-1 bg-industrial-stone border border-industrial-carbon px-1.5 py-0.5 rounded-xs">
                    <span className="text-[9px] uppercase text-industrial-carbon/70">{key}:</span>
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-24 bg-industrial-bone border border-industrial-carbon text-[9px] px-1 font-bold text-industrial-carbon focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => saveEdit(key)}
                      className="text-[9px] text-industrial-moss font-bold px-0.5"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditingKey(null)}
                      className="text-[9px] text-industrial-carbon/60 px-0.5"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(key, val)}
                    className="px-2 py-0.5 bg-industrial-stone hover:bg-industrial-bone border border-industrial-carbon rounded-xs text-[9px] text-industrial-carbon flex items-center gap-1 shadow-tactile-sm active:translate-y-0.5"
                    title="Tap to modify parameter"
                  >
                    <span className="text-industrial-carbon/60 uppercase">{key}:</span>
                    <span className="font-bold underline decoration-dotted truncate max-w-[140px]">{String(val)}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Execution Receipts Telemetry */}
        <div className="flex items-center justify-between text-[8px] text-industrial-carbon/60 border-t border-dashed border-industrial-carbon/30 pt-1.5">
          <span>ROUTED: {receipt.engineUsed.toUpperCase()}</span>
          <span>LATENCY: {receipt.executionMs || 12}MS</span>
          <span>{new Date(receipt.timestamp).toLocaleTimeString()}</span>
        </div>

        {/* Action Dispatch Buttons */}
        <div className="flex items-center gap-2 pt-0.5">
          {receipt.clientAction && (
            <button
              onClick={() => {
                soundFX.playRelay(true);
                onExecute(receipt);
              }}
              className="flex-1 bg-industrial-orange hover:bg-industrial-orange/90 text-industrial-bone font-mono font-bold text-xs py-2 px-3 border border-industrial-carbon rounded-xs shadow-tactile active:translate-y-0.5 active:shadow-tactile-press flex items-center justify-center gap-1.5 transition-all"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>DISPATCH TO PHONE</span>
            </button>
          )}

          {receipt.clientAction?.data?.copyText && (
            <button
              onClick={() => handleCopy(receipt.clientAction?.data?.copyText)}
              className="bg-industrial-bone hover:bg-industrial-stone text-industrial-carbon font-mono font-bold text-xs py-2 px-2.5 border border-industrial-carbon rounded-xs shadow-tactile active:translate-y-0.5 active:shadow-tactile-press flex items-center gap-1 transition-all"
            >
              {copied ? <Check className="w-3 h-3 text-industrial-moss" /> : <Copy className="w-3 h-3" />}
              <span className="text-[10px]">{copied ? "COPIED" : "CLIPBOARD"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
