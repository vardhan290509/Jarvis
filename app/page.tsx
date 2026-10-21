"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { soundFX } from "@/lib/sound-effects";
import { hardware } from "@/lib/hardware";
import { AIProvider, ChatMessage, ClarificationRequest, DeviceTelemetry, TaskReceipt } from "@/lib/types";
import { TactileHeader } from "@/components/TactileHeader";
import { MechanicalVisualizer } from "@/components/MechanicalVisualizer";
import { KineticJogDial } from "@/components/KineticJogDial";
import { ActionTicket } from "@/components/ActionTicket";
import { ClarificationBanner } from "@/components/ClarificationBanner";
import { DiagnosticPad } from "@/components/DiagnosticPad";
import { BlueprintSchematic } from "@/components/BlueprintSchematic";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { CalibrationWizard } from "@/components/CalibrationWizard";
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from "lucide-react";

export default function JarvisApp() {
  // App & Calibration state
  const [isCalibrated, setIsCalibrated] = useState<boolean>(true);
  const [showBlueprint, setShowBlueprint] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // AI & Engine state
  const [preferredProvider, setPreferredProvider] = useState<AIProvider>("auto");
  const [engineUsed, setEngineUsed] = useState<"nvidia" | "nebius" | "local-hybrid">("nebius");
  const [modelName, setModelName] = useState<string>("meta-llama/Llama-3.3-70B-Instruct-fast");
  const [latencyMs, setLatencyMs] = useState<number>(18);
  const [tokensPerSec, setTokensPerSec] = useState<number>(64);
  const [nvidiaApiKey, setNvidiaApiKey] = useState<string>("");
  const [nebiusApiKey, setNebiusApiKey] = useState<string>("");

  // Audio & Speech state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [voiceRate, setVoiceRate] = useState<number>(1.0);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const stopSpeechRecRef = useRef<(() => void) | null>(null);

  // Telemetry & Hardware state
  const [telemetry, setTelemetry] = useState<DeviceTelemetry>({
    currentTime: "12:00:00",
  });
  const [orientation, setOrientation] = useState<{ alpha: number | null; beta: number | null; gamma: number | null }>({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });
  const [fps, setFps] = useState<number>(60);

  // Conversation & Tasks state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "JARVIS // TACTILE 01 operational. Mobile hardware bindings engaged. Ready for voice or manual command.",
    },
  ]);
  const [inputText, setInputText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [clarification, setClarification] = useState<ClarificationRequest | null>(null);
  const [receipts, setReceipts] = useState<TaskReceipt[]>([]);
  const [selectedReceiptIndex, setSelectedReceiptIndex] = useState<number>(0);

  // Jog Dial State
  const [jogMode, setJogMode] = useState<"history" | "engine" | "speed">("engine");

  // Web Worker Ref
  const agentWorkerRef = useRef<Worker | null>(null);

  // Show Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initial Setup & Hardware Bindings
  useEffect(() => {
    // Check calibration in browser
    const cal = localStorage.getItem("jarvis_calibrated");
    if (!cal) {
      setIsCalibrated(false);
    }

    // Load saved API keys from localStorage if present
    const savedNvidia = localStorage.getItem("jarvis_nvidia_key");
    const savedNebius = localStorage.getItem("jarvis_nebius_key");
    const savedProv = localStorage.getItem("jarvis_preferred_provider") as AIProvider;
    if (savedNvidia) setNvidiaApiKey(savedNvidia);
    if (savedNebius) setNebiusApiKey(savedNebius);
    if (savedProv) setPreferredProvider(savedProv);

    // Initial Telemetry read
    hardware.getTelemetry().then(setTelemetry);
    const telemetryInterval = setInterval(() => {
      hardware.getTelemetry().then((t) => setTelemetry((prev) => ({ ...prev, ...t })));
    }, 4000);

    // Setup Shake to clear & orientation gestures
    const cleanupMotion = hardware.setupMotionGestures(
      () => {
        soundFX.playRelay(false);
        showToast("GESTURE: SHAKE DETECTED → CLEARED RECENT CONVERSATION");
        setMessages([
          {
            role: "assistant",
            content: "Context cleared via shake gesture. Ready for next command.",
          },
        ]);
        setClarification(null);
      },
      (tilt) => {
        setOrientation(tilt);
      }
    );

    // FPS Counter
    let lastTime = performance.now();
    let frameCount = 0;
    let animId: number;
    const calcFps = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(calcFps);
    };
    animId = requestAnimationFrame(calcFps);

    // Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[SW] Registered with scope:", reg.scope);
        })
        .catch((err) => console.warn("[SW] Registration failed:", err));

      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "ALARM_TRIGGERED") {
          soundFX.playAlarmSiren(3);
          showToast(`ALARM FIRED: ${event.data.alarm?.label || "Countdown Complete"}`);
        }
      });
    }

    // Setup Web Worker for background precision timers
    try {
      const worker = new Worker("/agent-worker.js");
      worker.postMessage({ type: "START_HEARTBEAT" });
      worker.onmessage = (e) => {
        if (e.data?.type === "TIMER_COMPLETE") {
          soundFX.playAlarmSiren(3);
          showToast(`TIMER MATURED: ${e.data.timer?.label || "Countdown Done"}`);
        }
      };
      agentWorkerRef.current = worker;
    } catch (e) {
      console.warn("Web worker init failed:", e);
    }

    return () => {
      clearInterval(telemetryInterval);
      cleanupMotion?.();
      cancelAnimationFrame(animId);
      agentWorkerRef.current?.terminate();
    };
  }, []);

  // 2. Microphone & Audio Analyser Setup
  const initAudioAnalyser = async () => {
    if (analyserNode) return analyserNode;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") await ctx.resume();

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      setAnalyserNode(analyser);
      return analyser;
    } catch (e) {
      console.warn("Microphone analyser init failed:", e);
      return null;
    }
  };

  // Toggle Continuous Mic Listening
  const toggleListening = async () => {
    soundFX.playRelay(!isListening);

    if (isListening) {
      stopSpeechRecRef.current?.();
      stopSpeechRecRef.current = null;
      setIsListening(false);
      return;
    }

    await initAudioAnalyser();
    setIsListening(true);

    const stopRec = hardware.startSpeechRecognition(
      (transcript, isFinal) => {
        setInputText(transcript);
        if (isFinal && transcript.trim().length > 1) {
          handleSendCommand(transcript.trim());
          stopRec();
          setIsListening(false);
        }
      },
      (err) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      }
    );

    stopSpeechRecRef.current = stopRec;
  };

  // 3. Send Command & Agent Streaming Pipeline
  const handleSendCommand = useCallback(
    async (textToSend?: string) => {
      const query = (textToSend || inputText).trim();
      if (!query || isProcessing) return;

      setInputText("");
      setIsProcessing(true);
      soundFX.playClick(900);

      // Append user message
      const updatedMessages: ChatMessage[] = [
        ...messages,
        { role: "user", content: query },
      ];
      setMessages(updatedMessages);

      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-preferred-provider": preferredProvider,
            ...(nvidiaApiKey ? { "x-nvidia-key": nvidiaApiKey } : {}),
            ...(nebiusApiKey ? { "x-nebius-key": nebiusApiKey } : {}),
          },
          body: JSON.stringify({
            messages: updatedMessages,
            telemetry,
            provider: preferredProvider,
          }),
        });

        if (!res.ok) {
          throw new Error(`Agent request failed: HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No readable stream");

        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedSpeech = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const block of lines) {
            if (!block.trim()) continue;
            const eventMatch = block.match(/event:\s*(.+)/);
            const dataMatch = block.match(/data:\s*(.+)/);

            if (eventMatch && dataMatch) {
              const eventType = eventMatch[1].trim();
              let payload: any = {};
              try {
                payload = JSON.parse(dataMatch[1]);
              } catch (e) {
                payload = dataMatch[1];
              }

              if (eventType === "telemetry") {
                setEngineUsed(payload.engineUsed);
                setModelName(payload.modelUsed);
                setLatencyMs(payload.latencyMs);
                setTokensPerSec(payload.tokensPerSec);
              } else if (eventType === "assistant_speech") {
                accumulatedSpeech = payload.text;
                // Add or update assistant message
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant") {
                    return [...prev.slice(0, -1), { role: "assistant", content: payload.text }];
                  }
                  return [...prev, { role: "assistant", content: payload.text }];
                });
              } else if (eventType === "clarification_required") {
                setClarification(payload);
                soundFX.playClarificationChime();

                // Speak clarification question & open mic
                if (soundEnabled) {
                  setIsSpeaking(true);
                  hardware.speak(payload.question, () => {
                    setIsSpeaking(false);
                    // Auto-open mic for hands-free answer
                    toggleListening();
                  });
                }
              } else if (eventType === "task_receipt") {
                const newReceipt = payload as TaskReceipt;
                setReceipts((prev) => [newReceipt, ...prev]);
                setSelectedReceiptIndex(0);
                soundFX.playRelay(true);

                // Auto-execute device action if non-intrusive (e.g. alarm set)
                if (newReceipt.clientAction?.type === "alarm_set") {
                  executeClientAction(newReceipt);
                }
              }
            }
          }
        }

        // Speak final assistant response if not clarification
        if (accumulatedSpeech && !clarification && soundEnabled) {
          setIsSpeaking(true);
          hardware.speak(accumulatedSpeech, () => setIsSpeaking(false));
        }
      } catch (err: any) {
        console.error("Command error:", err);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `ERROR EXECUTING TASK: ${err?.message || "Check network/API configuration."}`,
          },
        ]);
        soundFX.playClick(300);
      } finally {
        setIsProcessing(false);
      }
    },
    [inputText, isProcessing, messages, telemetry, preferredProvider, nvidiaApiKey, nebiusApiKey, soundEnabled, clarification]
  );

  // 4. Client Action Dispatcher (Handoffs & Universal Execution)
  const executeClientAction = (receipt: TaskReceipt) => {
    const action = receipt.clientAction;
    if (!action) return;

    soundFX.playRelay(true);

    switch (action.type) {
      case "alarm_set": {
        const { label, durationMs, action: alarmAction } = action.data || {};
        const alarmId = `alarm_${Date.now()}`;

        // Register with Service Worker
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "REGISTER_ALARM",
            alarm: {
              id: alarmId,
              label,
              triggerTime: Date.now() + durationMs,
            },
          });
        }

        // Register with dedicated Web Worker
        agentWorkerRef.current?.postMessage({
          type: "ADD_TIMER",
          id: alarmId,
          label,
          durationMs,
        });

        // Trigger OS notification permission check
        hardware.requestNotifications();
        showToast(`TIMER ARMED: ${label} (${Math.round(durationMs / 1000)}s)`);

        // Mark completed
        setReceipts((prev) =>
          prev.map((r) => (r.id === receipt.id ? { ...r, status: "completed" } : r))
        );
        break;
      }

      case "uri_launch": {
        if (action.uri) {
          showToast(`LAUNCHING NATIVE CLIENT: ${action.uri.split(":")[0].toUpperCase()}`);
          window.location.href = action.uri;
          setReceipts((prev) =>
            prev.map((r) => (r.id === receipt.id ? { ...r, status: "completed" } : r))
          );
        }
        break;
      }

      case "clipboard_copy": {
        const copyText = action.data?.copyText || "";
        if (copyText) {
          navigator.clipboard.writeText(copyText).then(() => {
            showToast("COPIED DRAFT TO CLIPBOARD → OPENING TARGET APP");
            if (action.uri) {
              setTimeout(() => {
                window.location.href = action.uri!;
              }, 400);
            }
          });
          setReceipts((prev) =>
            prev.map((r) => (r.id === receipt.id ? { ...r, status: "completed" } : r))
          );
        }
        break;
      }

      case "calendar_download": {
        fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "generate_ics", payload: action.data }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.ics) {
              const blob = new Blob([data.ics], { type: "text/calendar;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = data.filename || "event.ics";
              a.click();
              URL.revokeObjectURL(url);
              showToast("CALENDAR INVITE (.ICS) GENERATED & DOWNLOADED");
            }
          });
        break;
      }
    }
  };

  // 5. Clarification Resolution Handler
  const handleAnswerClarification = (answer: string) => {
    if (!clarification) return;
    const pendingTool = clarification.targetTool;
    const slot = clarification.missingField;

    setClarification(null);
    showToast(`SLOT RESOLVED [${slot}]: "${answer}"`);

    // Merge answer into context
    const followupQuery = `Regarding ${pendingTool}: for ${slot}, use "${answer}". Execute now.`;
    handleSendCommand(followupQuery);
  };

  // 6. Jog Dial Rotation Handler
  const handleJogStep = (direction: 1 | -1) => {
    if (jogMode === "engine") {
      const providers: AIProvider[] = ["auto", "nebius", "nvidia"];
      const currentIdx = providers.indexOf(preferredProvider);
      const nextIdx = (currentIdx + direction + providers.length) % providers.length;
      const nextProv = providers[nextIdx];
      setPreferredProvider(nextProv);
      localStorage.setItem("jarvis_preferred_provider", nextProv);
    } else if (jogMode === "history") {
      if (receipts.length === 0) return;
      const nextIdx = Math.max(0, Math.min(receipts.length - 1, selectedReceiptIndex + direction));
      setSelectedReceiptIndex(nextIdx);
    } else if (jogMode === "speed") {
      const nextRate = Math.max(0.75, Math.min(1.5, Number((voiceRate + direction * 0.05).toFixed(2))));
      setVoiceRate(nextRate);
    }
  };

  const getJogValueLabel = () => {
    if (jogMode === "engine") {
      return preferredProvider === "auto"
        ? "AUTO LOAD-BALANCER"
        : preferredProvider === "nebius"
        ? "NEBIUS AI (Llama 3.3)"
        : "NVIDIA NIM (Llama 3.3)";
    }
    if (jogMode === "history") {
      if (receipts.length === 0) return "NO ACTIVE TICKETS";
      const current = receipts[selectedReceiptIndex];
      return `#${current?.id.slice(-5).toUpperCase()}: ${current?.tool}`;
    }
    return `VOX RATE: ${voiceRate.toFixed(2)}x`;
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-industrial-bone border-x-2 border-industrial-carbon shadow-2xl relative overflow-hidden">
      {/* Calibration Wizard Overlay if not calibrated */}
      {!isCalibrated && (
        <CalibrationWizard onComplete={() => setIsCalibrated(true)} />
      )}

      {/* Blueprint Schematic View Modal */}
      {showBlueprint && (
        <BlueprintSchematic
          onClose={() => setShowBlueprint(false)}
          fps={fps}
          latencyMs={latencyMs}
          tokensPerSec={tokensPerSec}
          engine={engineUsed}
          model={modelName}
          batteryLevel={telemetry.batteryLevel}
          isCharging={telemetry.isCharging}
          orientation={orientation}
        />
      )}

      {/* Hardware Settings Drawer Modal */}
      <SettingsDrawer
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        preferredProvider={preferredProvider}
        onSelectProvider={(p) => {
          setPreferredProvider(p);
          localStorage.setItem("jarvis_preferred_provider", p);
        }}
        nvidiaApiKey={nvidiaApiKey}
        onSaveNvidiaKey={(k) => {
          setNvidiaApiKey(k);
          localStorage.setItem("jarvis_nvidia_key", k);
        }}
        nebiusApiKey={nebiusApiKey}
        onSaveNebiusKey={(k) => {
          setNebiusApiKey(k);
          localStorage.setItem("jarvis_nebius_key", k);
        }}
        soundEnabled={soundEnabled}
        onToggleSound={setSoundEnabled}
        onClearHistory={() => {
          setMessages([
            {
              role: "assistant",
              content: "Memory buffer flushed. System ready.",
            },
          ]);
          setReceipts([]);
          showToast("CONVERSATION & RECEIPTS CLEARED");
        }}
      />

      {/* Tactile Hardware Header */}
      <TactileHeader
        engine={engineUsed}
        modelName={modelName}
        latencyMs={latencyMs}
        tokensPerSec={tokensPerSec}
        batteryLevel={telemetry.batteryLevel}
        isCharging={telemetry.isCharging}
        isBlueprintMode={showBlueprint}
        onToggleBlueprint={() => setShowBlueprint((prev) => !prev)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main Tactile Body Canvas */}
      <main className="flex-1 flex flex-col p-3 gap-2.5 overflow-y-auto select-none">
        {/* 2D Mechanical Oscilloscope Visualizer */}
        <MechanicalVisualizer
          isListening={isListening}
          isSpeaking={isSpeaking}
          statusText={
            isListening
              ? "MIC CAPTURE"
              : isSpeaking
              ? "VOX SYNTHESIS"
              : isProcessing
              ? "INFERENCE ENGINE"
              : "SYSTEM IDLE"
          }
          analyserNode={analyserNode}
        />

        {/* Clarification State Machine Banner */}
        {clarification && (
          <ClarificationBanner
            clarification={clarification}
            onAnswerClarification={handleAnswerClarification}
            onCancel={() => setClarification(null)}
            isListening={isListening}
          />
        )}

        {/* Active Action Ticket */}
        {receipts.length > 0 && receipts[selectedReceiptIndex] && !clarification && (
          <ActionTicket
            receipt={receipts[selectedReceiptIndex]}
            onExecuteAction={executeClientAction}
            onDismiss={(id) => setReceipts((prev) => prev.filter((r) => r.id !== id))}
          />
        )}

        {/* Chat / System Log Stream */}
        <div className="flex-1 bg-industrial-stone border-2 border-industrial-carbon rounded-sm p-2.5 overflow-y-auto space-y-2 font-mono text-xs shadow-inner">
          <div className="flex items-center justify-between text-[9px] text-industrial-carbon/60 uppercase border-b border-industrial-carbon/30 pb-1">
            <span>JARVIS TELEMETRY LOG</span>
            <span>PORT: MOBILE-WEB</span>
          </div>

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-xs border text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-industrial-bone text-industrial-carbon border-industrial-carbon ml-4 shadow-tactile-sm"
                  : "bg-industrial-carbon text-industrial-bone border-industrial-carbon mr-4 shadow-tactile-dark"
              }`}
            >
              <div className="text-[8px] uppercase tracking-wider opacity-60 mb-0.5">
                {msg.role === "user" ? "HOST COMMAND" : "JARVIS CORE"}
              </div>
              <div>{msg.content}</div>
            </div>
          ))}

          {isProcessing && (
            <div className="p-2 bg-industrial-stone border border-industrial-carbon text-industrial-carbon text-[11px] animate-pulse flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-industrial-orange animate-ping" />
              <span>ROUTING INFERENCE VIA {preferredProvider.toUpperCase()}...</span>
            </div>
          )}
        </div>

        {/* 2D Kinetic Fidget Jog Dial & Diagnostics */}
        <div className="grid grid-cols-1 gap-2">
          <KineticJogDial
            onRotateStep={handleJogStep}
            mode={jogMode}
            onChangeMode={setJogMode}
            currentValueLabel={getJogValueLabel()}
          />
          <DiagnosticPad />
        </div>
      </main>

      {/* Floating Tactical Confirmation Toast */}
      {toastMessage && (
        <div className="absolute top-12 inset-x-3 z-40 bg-industrial-carbon text-industrial-bone font-mono font-bold text-xs p-2.5 border-2 border-industrial-orange rounded-xs shadow-tactile-lg animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-industrial-orange animate-pulse" />
            <span className="truncate">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Tactile Hardware Input Footer */}
      <footer className="w-full bg-industrial-stone border-t-2 border-industrial-carbon p-3 select-none">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendCommand();
          }}
          className="flex items-center gap-2"
        >
          {/* Mechanical Continuous Mic Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-3 border-2 border-industrial-carbon rounded-xs font-mono font-bold transition-all ${
              isListening
                ? "bg-industrial-orange text-industrial-bone shadow-tactile-press translate-y-0.5 animate-pulse"
                : "bg-industrial-bone text-industrial-carbon shadow-tactile hover:bg-industrial-stone active:translate-y-0.5 active:shadow-tactile-press"
            }`}
            title={isListening ? "Mute Microphone" : "Engage Speech Recognition"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input Terminal */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? "Listening to voice input..." : "Type command (e.g. Set 5m timer)..."}
              className="w-full bg-industrial-bone border-2 border-industrial-carbon px-3 py-2.5 font-mono text-xs text-industrial-carbon placeholder:text-industrial-carbon/50 rounded-xs focus:outline-none focus:ring-1 focus:ring-industrial-orange shadow-inner"
            />
          </div>

          {/* Send Action Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className={`p-3 border-2 border-industrial-carbon rounded-xs font-mono font-bold transition-all ${
              inputText.trim() && !isProcessing
                ? "bg-industrial-carbon text-industrial-bone shadow-tactile active:translate-y-0.5 active:shadow-tactile-press"
                : "bg-industrial-stone text-industrial-carbon/40 shadow-none cursor-not-allowed"
            }`}
            title="Execute Command"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {/* Quick Command Suggestions Strip */}
        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            "Set 5m timer",
            "Send WhatsApp to Rahul",
            "Message @nebius_ai on IG",
            "Draft email to team",
            "Search NVIDIA NIM specs",
          ].map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                soundFX.playClick(750);
                handleSendCommand(prompt);
              }}
              className="px-2 py-0.5 bg-industrial-bone hover:bg-industrial-stone border border-industrial-carbon rounded-xs font-mono text-[9px] font-bold text-industrial-carbon whitespace-nowrap shadow-tactile-sm active:translate-y-0.5"
            >
              {prompt}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
