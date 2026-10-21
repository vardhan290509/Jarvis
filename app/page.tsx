"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { soundFX } from "@/lib/sound-effects";
import { hardware } from "@/lib/hardware";
import { AIProvider, ChatMessage, ClarificationRequest, DeviceTelemetry, TaskReceipt } from "@/lib/types";
import { HeroOscilloscope } from "@/components/HeroOscilloscope";
import { ActionTicket } from "@/components/ActionTicket";
import { ClarificationCard } from "@/components/ClarificationCard";
import { HardwareDrawer } from "@/components/HardwareDrawer";
import { ControlDeck } from "@/components/ControlDeck";
import { Battery, BatteryCharging, Radio, Sliders, Cpu } from "lucide-react";

export default function JarvisApp() {
  // AI & Engine state
  const [preferredProvider, setPreferredProvider] = useState<AIProvider>("auto");
  const [engineUsed, setEngineUsed] = useState<"nvidia" | "nebius" | "local-hybrid">("nebius");
  const [modelName, setModelName] = useState<string>("meta-llama/Llama-3.3-70B-Instruct-fast");
  const [latencyMs, setLatencyMs] = useState<number>(14);
  const [tokensPerSec, setTokensPerSec] = useState<number>(68);
  const [nvidiaApiKey, setNvidiaApiKey] = useState<string>("");
  const [nebiusApiKey, setNebiusApiKey] = useState<string>("");

  // Hardware & Audio state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Telemetry state
  const [telemetry, setTelemetry] = useState<DeviceTelemetry>({
    currentTime: "12:00:00",
  });

  // Conversation & Tasks
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
  const [activeTicket, setActiveTicket] = useState<TaskReceipt | null>(null);

  // Refs
  const audioStreamRef = useRef<MediaStream | null>(null);
  const stopSpeechRecRef = useRef<(() => void) | null>(null);
  const agentWorkerRef = useRef<Worker | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initial Setup & Web Hardware Bindings
  useEffect(() => {
    // Load stored keys
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

    // Shake to clear conversation gesture
    const cleanupMotion = hardware.setupMotionGestures(() => {
      soundFX.playRelay(false);
      showToast("GESTURE: SHAKE DETECTED → CONVERSATION FLUSHED");
      setMessages([
        {
          role: "assistant",
          content: "Context flushed via shake gesture. Ready for host command.",
        },
      ]);
      setClarification(null);
      setActiveTicket(null);
    });

    // Start background keep-alive carrier + mediaSession
    soundFX.startBackgroundKeepAlive();

    // Register Service Worker for background alarms
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("[SW] Registered:", reg.scope))
        .catch((err) => console.warn("[SW] Registration error:", err));

      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "ALARM_TRIGGERED") {
          soundFX.playAlarmSiren(3);
          showToast(`ALARM ALERT: ${event.data.alarm?.label || "Countdown Complete"}`);
        }
      });
    }

    // Register Web Worker for precision timing
    try {
      const worker = new Worker("/agent-worker.js");
      worker.postMessage({ type: "START_HEARTBEAT" });
      worker.onmessage = (e) => {
        if (e.data?.type === "TIMER_COMPLETE") {
          soundFX.playAlarmSiren(3);
          showToast(`TIMER COMPLETE: ${e.data.timer?.label || "Countdown Done"}`);
        }
      };
      agentWorkerRef.current = worker;
    } catch (e) {
      console.warn("Web worker init failed:", e);
    }

    return () => {
      clearInterval(telemetryInterval);
      cleanupMotion?.();
      agentWorkerRef.current?.terminate();
      soundFX.stopBackgroundKeepAlive();
    };
  }, []);

  // 2. Audio Stream & Frequency Analyser Init
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

        if (!res.ok) throw new Error(`Agent request failed: HTTP ${res.status}`);

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

                if (soundEnabled) {
                  setIsSpeaking(true);
                  hardware.speak(payload.question, () => {
                    setIsSpeaking(false);
                    toggleListening();
                  });
                }
              } else if (eventType === "task_receipt") {
                const newReceipt = payload as TaskReceipt;
                setReceipts((prev) => [newReceipt, ...prev]);
                setActiveTicket(newReceipt);
                soundFX.playRelay(true);

                if (newReceipt.clientAction?.type === "alarm_set") {
                  executeClientAction(newReceipt);
                }
              }
            }
          }
        }

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
            content: `TASK ERROR: ${err?.message || "Verify connection or API keys in chassis drawer."}`,
          },
        ]);
        soundFX.playClick(300);
      } finally {
        setIsProcessing(false);
      }
    },
    [inputText, isProcessing, messages, telemetry, preferredProvider, nvidiaApiKey, nebiusApiKey, soundEnabled, clarification]
  );

  // 4. Universal Task Execution Engine (Client-Side Action Dispatcher)
  const executeClientAction = (receipt: TaskReceipt) => {
    const action = receipt.clientAction;
    if (!action) return;

    soundFX.playRelay(true);

    switch (action.type) {
      case "alarm_set": {
        const { label, durationMs } = action.data || {};
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

        hardware.requestNotifications();
        showToast(`ALARM ARMED: ${label} (${Math.round(durationMs / 1000)}s)`);

        setReceipts((prev) =>
          prev.map((r) => (r.id === receipt.id ? { ...r, status: "completed" } : r))
        );
        if (activeTicket?.id === receipt.id) {
          setActiveTicket((prev) => (prev ? { ...prev, status: "completed" } : null));
        }
        break;
      }

      case "uri_launch": {
        if (action.uri) {
          showToast(`LAUNCHING NATIVE CLIENT: ${action.uri.split(":")[0].toUpperCase()}`);
          window.location.href = action.uri;
          setReceipts((prev) =>
            prev.map((r) => (r.id === receipt.id ? { ...r, status: "completed" } : r))
          );
          if (activeTicket?.id === receipt.id) {
            setActiveTicket((prev) => (prev ? { ...prev, status: "completed" } : null));
          }
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
          if (activeTicket?.id === receipt.id) {
            setActiveTicket((prev) => (prev ? { ...prev, status: "completed" } : null));
          }
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
    const pendingTool = clarification.targetTool || clarification.toolName;
    const slot = clarification.missingField;

    setClarification(null);
    showToast(`SLOT FILLED: ${slot.toUpperCase()} = "${answer}"`);

    const followup = `Regarding ${pendingTool}: for ${slot}, use "${answer}". Execute now.`;
    handleSendCommand(followup);
  };

  // 6. Parameter Pill Update in Action Ticket
  const handleUpdateParam = (receiptId: string, paramKey: string, newValue: string) => {
    setReceipts((prev) =>
      prev.map((r) => {
        if (r.id === receiptId) {
          const updatedParams = { ...r.parameters, [paramKey]: newValue };
          return {
            ...r,
            parameters: updatedParams,
            summary: `Updated ${paramKey} to ${newValue}`,
          };
        }
        return r;
      })
    );
    if (activeTicket?.id === receiptId) {
      setActiveTicket((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          parameters: { ...prev.parameters, [paramKey]: newValue },
        };
      });
    }
    showToast(`PARAMETER MODIFIED: [${paramKey.toUpperCase()}]`);
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-industrial-bone border-x-2 border-industrial-carbon shadow-2xl relative overflow-hidden select-none">
      {/* Hardware Settings & Sensors Drawer Modal */}
      <HardwareDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
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
        receipts={receipts}
        onClearHistory={() => {
          setMessages([
            {
              role: "assistant",
              content: "Memory buffer flushed. System ready.",
            },
          ]);
          setReceipts([]);
          setActiveTicket(null);
          showToast("CONVERSATION & RECEIPTS CLEARED");
        }}
      />

      {/* Top Slim Hardware Status Bar */}
      <header className="w-full bg-industrial-stone border-b-2 border-industrial-carbon px-3 py-1.5 flex items-center justify-between text-xs font-mono text-industrial-carbon">
        {/* Model & LED Status */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              clarification
                ? "bg-industrial-amber animate-ping"
                : isListening
                ? "bg-industrial-orange animate-pulse"
                : isProcessing
                ? "bg-industrial-moss animate-pulse"
                : "bg-industrial-carbon"
            }`}
          />
          <span className="font-bold tracking-tight uppercase text-[11px]">
            {engineUsed === "nebius" ? "NEBIUS AI" : engineUsed === "nvidia" ? "NVIDIA NIM" : "TACTILE 01"}
          </span>
          <span className="text-[9px] text-industrial-carbon/60 hidden xs:inline truncate max-w-[120px]">
            {modelName.split("/").pop()}
          </span>
        </div>

        {/* Telemetry Metrics */}
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-industrial-orange" />
            <span>{latencyMs}ms</span>
          </div>

          {telemetry.batteryLevel !== undefined && (
            <div className="flex items-center gap-1">
              {telemetry.isCharging ? (
                <BatteryCharging className="w-3 h-3 text-industrial-moss" />
              ) : (
                <Battery className="w-3 h-3 text-industrial-carbon" />
              )}
              <span>{Math.round(telemetry.batteryLevel * 100)}%</span>
            </div>
          )}

          {/* Drawer Trigger Icon */}
          <button
            onClick={() => {
              soundFX.playClick(600);
              setShowDrawer(true);
            }}
            className="p-1 hover:bg-industrial-bone border border-industrial-carbon rounded-xs shadow-tactile-sm"
            title="Open Hardware Chassis Drawer"
          >
            <Sliders className="w-3 h-3 text-industrial-carbon" />
          </button>
        </div>
      </header>

      {/* Main Workspace Canvas */}
      <main className="flex-1 flex flex-col p-2.5 gap-2 overflow-y-auto">
        {/* Hero 2D Mechanical Oscilloscope Visualizer */}
        <HeroOscilloscope
          isListening={isListening}
          isSpeaking={isSpeaking}
          isProcessing={isProcessing}
          isClarifying={Boolean(clarification)}
          analyserNode={analyserNode}
          engineName={preferredProvider}
          latencyMs={latencyMs}
        />

        {/* Multi-Turn Clarification State Machine Card */}
        {clarification && (
          <ClarificationCard
            clarification={clarification}
            onAnswer={handleAnswerClarification}
            onCancel={() => setClarification(null)}
            isListening={isListening}
          />
        )}

        {/* Sliding 2D Action Ticket */}
        {activeTicket && !clarification && (
          <ActionTicket
            receipt={activeTicket}
            onExecute={executeClientAction}
            onDismiss={() => setActiveTicket(null)}
            onUpdateParam={handleUpdateParam}
          />
        )}

        {/* Transaction Telemetry Feed */}
        <div className="flex-1 bg-industrial-stone border-2 border-industrial-carbon rounded-sm p-2 overflow-y-auto space-y-2 font-mono text-xs shadow-inner">
          <div className="flex items-center justify-between text-[8px] text-industrial-carbon/60 uppercase border-b border-industrial-carbon/20 pb-0.5">
            <span>JARVIS SYSTEM RECEIPT LOG</span>
            <span>SPEC: 100DVH MOBILE</span>
          </div>

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded-xs border text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-industrial-bone text-industrial-carbon border-industrial-carbon ml-3 shadow-tactile-sm"
                  : "bg-industrial-carbon text-industrial-bone border-industrial-carbon mr-3 shadow-tactile-dark"
              }`}
            >
              <div className="text-[8px] uppercase tracking-wider opacity-60 mb-0.5 font-bold">
                {msg.role === "user" ? "HOST COMMAND" : "JARVIS CORE"}
              </div>
              <div>{msg.content}</div>
            </div>
          ))}

          {isProcessing && (
            <div className="p-2 bg-industrial-stone border border-industrial-carbon text-industrial-carbon text-[10px] animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-industrial-orange animate-ping" />
              <span>ROUTING INFERENCE VIA {preferredProvider.toUpperCase()}...</span>
            </div>
          )}
        </div>
      </main>

      {/* Floating Tactical Notification Toast */}
      {toastMessage && (
        <div className="absolute top-10 inset-x-3 z-40 bg-industrial-carbon text-industrial-bone font-mono font-bold text-xs p-2 border-2 border-industrial-orange rounded-xs shadow-tactile-lg animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-industrial-orange animate-pulse" />
            <span className="truncate">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Bottom Tactile Control Deck */}
      <ControlDeck
        inputText={inputText}
        setInputText={setInputText}
        isListening={isListening}
        onToggleListening={toggleListening}
        isProcessing={isProcessing}
        onSend={handleSendCommand}
        onOpenDrawer={() => setShowDrawer(true)}
      />
    </div>
  );
}
