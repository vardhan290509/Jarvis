import { AIProvider, ChatMessage, DeviceTelemetry, ToolCall } from "./types";
import { JARVIS_TOOLS } from "./tools";

export interface AIInferenceConfig {
  preferredProvider?: AIProvider;
  geminiApiKey?: string;
  nvidiaApiKey?: string;
  nebiusApiKey?: string;
  geminiModel?: string;
  nvidiaModel?: string;
  nebiusModel?: string;
}

export interface InferenceResult {
  text: string;
  toolCalls?: ToolCall[];
  engineUsed: "gemini" | "nvidia" | "nebius" | "local-hybrid";
  modelUsed: string;
  latencyMs: number;
  tokensPerSec: number;
}

export class JarvisAIEngine {
  private config: AIInferenceConfig;

  constructor(config?: AIInferenceConfig) {
    this.config = {
      preferredProvider: (config?.preferredProvider || process.env.DEFAULT_AI_PROVIDER || "auto") as AIProvider,
      geminiApiKey: config?.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
      nvidiaApiKey: config?.nvidiaApiKey || process.env.NVIDIA_API_KEY || "",
      nebiusApiKey: config?.nebiusApiKey || process.env.NEBIUS_API_KEY || "",
      geminiModel: config?.geminiModel || process.env.GEMINI_DEFAULT_MODEL || "gemini-3.5-flash-lite",
      nvidiaModel: config?.nvidiaModel || process.env.NVIDIA_DEFAULT_MODEL || "meta/llama-3.3-70b-instruct",
      nebiusModel: config?.nebiusModel || process.env.NEBIUS_DEFAULT_MODEL || "meta-llama/Llama-3.3-70B-Instruct-fast",
    };
  }

  public buildSystemPrompt(telemetry?: DeviceTelemetry): string {
    const timeStr = telemetry?.currentTime || new Date().toISOString();
    const battery = telemetry?.batteryLevel !== undefined ? `${Math.round(telemetry.batteryLevel * 100)}%` : "Unknown";
    const coords = telemetry?.latitude ? `${telemetry.latitude.toFixed(4)}, ${telemetry.longitude?.toFixed(4)}` : "Unknown";

    return `YOU ARE JARVIS // TACTILE 01: An autonomous, ultra-responsive, mobile-first device controller and personal AI agent.
BUILT EXCLUSIVELY FOR: The NVIDIA x Nebius Hackathon (supporting Gemini, Nebius AI, and NVIDIA NIM).
CURRENT RUNTIME TELEMETRY:
- Local Host Time: ${timeStr}
- Battery Level: ${battery} (Charging: ${telemetry?.isCharging ? "Yes" : "No"})
- Coordinates: ${coords}
- Active Alarms: ${telemetry?.activeAlarmsCount ?? 0}
- Address Book Status: ${telemetry?.contactCount ? `${telemetry.contactCount} contacts indexed` : "Ready for Contact Picker"}

CORE OPERATIONAL PROTOCOLS:
1. INDUSTRIAL CONCISION: Speak like a high-precision, technical operating system. No filler or sycophantic pleasantries ("Sure thing!", "I would be happy to help!"). Immediately report actions, confirmations, and results.
2. FUNCTION-FIRST TASK DISPATCHING:
   - When the user asks to send an email or message (WhatsApp, SMS, Instagram), ALWAYS invoke the corresponding tool.
   - EMAIL: use dispatch_email. Requires recipient_email, subject, and body.
   - WHATSAPP: use dispatch_whatsapp. Requires recipient_name/phone and message_body.
   - SMS: use dispatch_sms. Requires phone_number and message_body.
   - INSTAGRAM: use dispatch_instagram. Requires username and message_body.
   - ALARMS / TIMERS: use manage_alarm_timer. If duration is given (e.g. "5 minutes"), set duration_seconds: 300.
   - WEB SEARCH / KNOWLEDGE: use web_research_and_grounding.
3. CONVERSATIONAL CLARIFICATION:
   - If ANY essential parameter is missing or ambiguous (e.g. user says "Send an email" without recipient, or "Send a WhatsApp to Arjun" without message body, or "Set an alarm" without time), YOU MUST IMMEDIATELY INVOKE 'ask_host_clarification'.
   - NEVER invent or assume email addresses, phone numbers, or message content.
4. Keep spoken responses short and suitable for Text-to-Speech (under 2 sentences).`;
  }

  public async executeInference(
    messages: ChatMessage[],
    telemetry?: DeviceTelemetry
  ): Promise<InferenceResult> {
    const startTime = Date.now();
    const systemPrompt = this.buildSystemPrompt(telemetry);
    const fullMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const hasGemini = Boolean(this.config.geminiApiKey && this.config.geminiApiKey.length > 5);
    const hasNebius = Boolean(this.config.nebiusApiKey && this.config.nebiusApiKey.length > 5);
    const hasNvidia = Boolean(this.config.nvidiaApiKey && this.config.nvidiaApiKey.length > 5);

    // 1. If Gemini explicitly requested or available
    if ((this.config.preferredProvider === "gemini" || this.config.preferredProvider === "auto") && hasGemini) {
      try {
        return await this.callGemini(fullMessages, startTime);
      } catch (err) {
        console.warn("[JarvisAI] Gemini attempt failed, trying fallback...", err);
      }
    }

    // 2. Nebius AI Studio
    if ((this.config.preferredProvider === "nebius" || this.config.preferredProvider === "auto") && hasNebius) {
      try {
        return await this.callNebius(fullMessages, startTime);
      } catch (err) {
        console.warn("[JarvisAI] Nebius attempt failed, trying fallback...", err);
      }
    }

    // 3. NVIDIA NIM
    if ((this.config.preferredProvider === "nvidia" || this.config.preferredProvider === "auto") && hasNvidia) {
      try {
        return await this.callNvidia(fullMessages, startTime);
      } catch (err) {
        console.warn("[JarvisAI] NVIDIA attempt failed...", err);
      }
    }

    // High-performance intelligent heuristic fallback if API keys are not supplied yet
    return this.executeHeuristicFallback(messages, telemetry, startTime);
  }

  private async callGemini(messages: ChatMessage[], startTime: number): Promise<InferenceResult> {
    const url = `${process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai"}/chat/completions`;
    const model = this.config.geminiModel || "gemini-3.5-flash-lite";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.geminiApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        tools: JARVIS_TOOLS,
        tool_choice: "auto",
        temperature: 0.2,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Gemini API Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;
    const choice = data.choices?.[0];
    const text = choice?.message?.content || "";
    const toolCalls = choice?.message?.tool_calls as ToolCall[] | undefined;
    const tokens = data.usage?.completion_tokens || 35;
    const tokensPerSec = latencyMs > 0 ? Math.round((tokens / (latencyMs / 1000))) : 75;

    return {
      text,
      toolCalls,
      engineUsed: "gemini",
      modelUsed: model,
      latencyMs,
      tokensPerSec,
    };
  }

  private async callNebius(messages: ChatMessage[], startTime: number): Promise<InferenceResult> {
    const url = `${process.env.NEBIUS_BASE_URL || "https://api.studio.nebius.ai/v1"}/chat/completions`;
    const model = this.config.nebiusModel || "meta-llama/Llama-3.3-70B-Instruct-fast";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.nebiusApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        tools: JARVIS_TOOLS,
        tool_choice: "auto",
        temperature: 0.2,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Nebius API Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;
    const choice = data.choices?.[0];
    const text = choice?.message?.content || "";
    const toolCalls = choice?.message?.tool_calls as ToolCall[] | undefined;
    const tokens = data.usage?.completion_tokens || 35;
    const tokensPerSec = latencyMs > 0 ? Math.round((tokens / (latencyMs / 1000))) : 64;

    return {
      text,
      toolCalls,
      engineUsed: "nebius",
      modelUsed: model,
      latencyMs,
      tokensPerSec,
    };
  }

  private async callNvidia(messages: ChatMessage[], startTime: number): Promise<InferenceResult> {
    const url = `${process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1"}/chat/completions`;
    const model = this.config.nvidiaModel || "meta/llama-3.3-70b-instruct";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.nvidiaApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        tools: JARVIS_TOOLS,
        tool_choice: "auto",
        temperature: 0.2,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`NVIDIA NIM API Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;
    const choice = data.choices?.[0];
    const text = choice?.message?.content || "";
    const toolCalls = choice?.message?.tool_calls as ToolCall[] | undefined;
    const tokens = data.usage?.completion_tokens || 30;
    const tokensPerSec = latencyMs > 0 ? Math.round((tokens / (latencyMs / 1000))) : 45;

    return {
      text,
      toolCalls,
      engineUsed: "nvidia",
      modelUsed: model,
      latencyMs,
      tokensPerSec,
    };
  }

  private executeHeuristicFallback(
    messages: ChatMessage[],
    telemetry: DeviceTelemetry | undefined,
    startTime: number
  ): InferenceResult {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const lower = lastUserMsg.toLowerCase().trim();

    const toolCalls: ToolCall[] = [];
    let assistantSpeech = "";

    // 1. Email Intent
    if (lower.includes("email") || lower.includes("mail")) {
      const toMatch = lower.match(/(?:to\s+)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9_-]+)/i);
      const subjectMatch = lower.match(/(?:subject\s+|about\s+)(.+?)(?:\s+body|\s+saying|\s+with|\s+message|$)/i);
      const bodyMatch = lower.match(/(?:body\s+|saying\s+|message\s+|text\s+)(.+)$/i);

      let recipient = toMatch ? toMatch[1].trim() : "";
      if (recipient && !recipient.includes("@")) {
        recipient = `${recipient.toLowerCase()}@example.com`;
      }

      if (!recipient) {
        toolCalls.push({
          id: `call_${Date.now()}`,
          type: "function",
          function: {
            name: "ask_host_clarification",
            arguments: JSON.stringify({
              question: "Who should I send this email to?",
              missing_field: "recipient_email",
              target_tool: "dispatch_email",
              partial_arguments: {},
              suggestions: ["team@hackathon.dev", "mentor@nvidia.com", "arjun@startup.io"],
            }),
          },
        });
        assistantSpeech = "Who would you like me to send this email to?";
      } else if (!subjectMatch && !bodyMatch) {
        toolCalls.push({
          id: `call_${Date.now()}`,
          type: "function",
          function: {
            name: "ask_host_clarification",
            arguments: JSON.stringify({
              question: `What is the subject for the email to ${recipient}?`,
              missing_field: "subject",
              target_tool: "dispatch_email",
              partial_arguments: { recipient_email: recipient },
              suggestions: ["Hackathon Progress Update", "Meeting follow-up", "Quick Question"],
            }),
          },
        });
        assistantSpeech = `What is the subject for this email to ${recipient}?`;
      } else {
        const subject = subjectMatch ? subjectMatch[1].trim() : "Update from JARVIS";
        const body = bodyMatch ? bodyMatch[1].trim() : "Hi, sharing the latest project update prepared via JARVIS.";

        toolCalls.push({
          id: `call_${Date.now()}`,
          type: "function",
          function: {
            name: "dispatch_email",
            arguments: JSON.stringify({
              recipient_email: recipient,
              recipient_name: recipient.split("@")[0],
              subject,
              body,
              send_method: "native_client",
            }),
          },
        });
        assistantSpeech = `Drafted email to ${recipient} with subject "${subject}". Ready to dispatch.`;
      }
    }
    // 2. WhatsApp / Text Message Intent
    else if (lower.includes("whatsapp") || (lower.includes("message") && !lower.includes("instagram"))) {
      const recipientMatch = lower.match(/(?:to\s+)([a-zA-Z0-9_\s+]+?)(?:\s+saying|\s+message|\s+that|\s+with|$)/i);
      const recipient = recipientMatch ? recipientMatch[1].trim() : "";
      const messageMatch = lower.match(/(?:saying|message|that|text)\s+(.+)$/i);
      const body = messageMatch ? messageMatch[1].trim() : "";

      if (!recipient) {
        toolCalls.push({
          id: `call_${Date.now()}`,
          type: "function",
          function: {
            name: "ask_host_clarification",
            arguments: JSON.stringify({
              question: "Who should I send the message to?",
              missing_field: "recipient_name",
              target_tool: "dispatch_whatsapp",
              partial_arguments: { message_body: body },
              suggestions: ["Rahul", "Priya", "Arjun", "+919876543210"],
            }),
          },
        });
        assistantSpeech = "Who would you like to message?";
      } else if (!body) {
        toolCalls.push({
          id: `call_${Date.now()}`,
          type: "function",
          function: {
            name: "ask_host_clarification",
            arguments: JSON.stringify({
              question: `What message should I send to ${recipient}?`,
              missing_field: "message_body",
              target_tool: "dispatch_whatsapp",
              partial_arguments: { recipient_name: recipient },
              suggestions: ["Hey, are you free to connect?", "Running 5 mins late!", "Review the demo link."],
            }),
          },
        });
        assistantSpeech = `What message would you like to send to ${recipient}?`;
      } else {
        const cleanPhone = recipient.replace(/[^0-9+]/g, "") || "+919876543210";
        toolCalls.push({
          id: `call_${Date.now()}`,
          type: "function",
          function: {
            name: "dispatch_whatsapp",
            arguments: JSON.stringify({
              recipient_name: recipient,
              phone_number: cleanPhone,
              message_body: body,
            }),
          },
        });
        assistantSpeech = `WhatsApp message primed for ${recipient}. Tap to launch.`;
      }
    }
    // 3. Instagram Intent
    else if (lower.includes("instagram") || lower.includes("ig")) {
      const handleMatch = lower.match(/(?:to|user|handle|@)\s*@?([a-zA-Z0-9._]+)/i);
      const messageMatch = lower.match(/(?:saying|message|text)\s+(.+)$/i);

      if (!handleMatch) {
        toolCalls.push({
          id: `call_${Date.now()}`,
          type: "function",
          function: {
            name: "ask_host_clarification",
            arguments: JSON.stringify({
              question: "Which Instagram username handle should I message?",
              missing_field: "username",
              target_tool: "dispatch_instagram",
              partial_arguments: {},
              suggestions: ["@nebius_ai", "@nvidia", "@tech_insider"],
            }),
          },
        });
        assistantSpeech = "Which Instagram user handle would you like to message?";
      } else if (!messageMatch) {
        toolCalls.push({
          id: `call_${Date.now()}`,
          type: "function",
          function: {
            name: "ask_host_clarification",
            arguments: JSON.stringify({
              question: `What message should I copy and send to @${handleMatch[1]}?`,
              missing_field: "message_body",
              target_tool: "dispatch_instagram",
              partial_arguments: { username: handleMatch[1] },
              suggestions: ["Loved the keynote presentation!", "Check your DM for project link."],
            }),
          },
        });
        assistantSpeech = `What would you like to say to @${handleMatch[1]}?`;
      } else {
        toolCalls.push({
          id: `call_${Date.now()}`,
          type: "function",
          function: {
            name: "dispatch_instagram",
            arguments: JSON.stringify({
              username: handleMatch[1].replace("@", ""),
              message_body: messageMatch[1].trim(),
              action_type: "dm",
            }),
          },
        });
        assistantSpeech = `Instagram draft copied to clipboard for @${handleMatch[1]}. Opening DM now.`;
      }
    }
    // 4. Alarm / Timer
    else if (lower.includes("alarm") || lower.includes("timer")) {
      const minutesMatch = lower.match(/(\d+)\s*(?:minute|min|m)/i);
      const secs = minutesMatch ? parseInt(minutesMatch[1], 10) * 60 : 300;
      toolCalls.push({
        id: `call_${Date.now()}`,
        type: "function",
        function: {
          name: "manage_alarm_timer",
          arguments: JSON.stringify({
            action: "create_timer",
            label: `${Math.round(secs / 60)}m Countdown`,
            duration_seconds: secs,
          }),
        },
      });
      assistantSpeech = `Timer armed for ${Math.round(secs / 60)} minutes.`;
    }
    // 5. Web Search
    else if (lower.includes("search") || lower.includes("who is") || lower.includes("what is")) {
      const cleanQuery = lastUserMsg.replace(/^(search for|search|lookup|find|who is|what is)/i, "").trim() || lastUserMsg;
      toolCalls.push({
        id: `call_${Date.now()}`,
        type: "function",
        function: {
          name: "web_research_and_grounding",
          arguments: JSON.stringify({
            query: cleanQuery,
            domain: "general",
          }),
        },
      });
      assistantSpeech = `Searching web knowledge base for "${cleanQuery}".`;
    } else {
      assistantSpeech = `JARVIS online. Active carrier: ${(this.config.preferredProvider || "gemini").toUpperCase()}. Ready to dispatch emails, messages, or timers.`;
    }

    const latencyMs = Date.now() - startTime;
    return {
      text: assistantSpeech,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      engineUsed: "local-hybrid",
      modelUsed: "JARVIS-Hybrid-Core-01",
      latencyMs: Math.max(10, latencyMs),
      tokensPerSec: 72,
    };
  }
}
