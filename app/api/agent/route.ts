import { NextRequest } from "next/server";
import { JarvisAIEngine } from "@/lib/ai-engine";
import { AIProvider, ChatMessage, DeviceTelemetry, TaskReceipt, ToolCall } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = body.messages || [];
    const telemetry: DeviceTelemetry | undefined = body.telemetry;
    const provider: AIProvider = (req.headers.get("x-preferred-provider") as AIProvider) || body.provider || "auto";

    // Custom runtime keys passed from frontend Hardware Drawer if available
    const customGeminiKey = req.headers.get("x-gemini-key") || body.geminiApiKey;
    const customNvidiaKey = req.headers.get("x-nvidia-key") || body.nvidiaApiKey;
    const customNebiusKey = req.headers.get("x-nebius-key") || body.nebiusApiKey;

    const engine = new JarvisAIEngine({
      preferredProvider: provider,
      geminiApiKey: customGeminiKey,
      nvidiaApiKey: customNvidiaKey,
      nebiusApiKey: customNebiusKey,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          const result = await engine.executeInference(messages, telemetry);

          // 1. Emit telemetry
          sendEvent("telemetry", {
            engineUsed: result.engineUsed,
            modelUsed: result.modelUsed,
            latencyMs: result.latencyMs,
            tokensPerSec: result.tokensPerSec,
          });

          // 2. Emit speech
          if (result.text) {
            sendEvent("assistant_speech", { text: result.text });
          }

          // 3. Process tool calls
          if (result.toolCalls && result.toolCalls.length > 0) {
            for (const call of result.toolCalls) {
              const toolName = call.function.name;
              let parsedArgs: Record<string, any> = {};
              try {
                parsedArgs = JSON.parse(call.function.arguments);
              } catch (e) {
                parsedArgs = { raw: call.function.arguments };
              }

              sendEvent("tool_execution", {
                toolName,
                arguments: parsedArgs,
                toolCallId: call.id,
              });

              // Check if clarification is needed
              if (toolName === "ask_host_clarification") {
                sendEvent("clarification_required", {
                  id: call.id,
                  question: parsedArgs.question,
                  missingField: parsedArgs.missing_field,
                  targetTool: parsedArgs.target_tool,
                  partialArguments: parsedArgs.partial_arguments || {},
                  suggestions: parsedArgs.suggestions || [],
                });
              } else {
                // Generate instant action receipt
                const receipt: TaskReceipt = {
                  id: `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                  tool: toolName,
                  status: "executing",
                  summary: generateReceiptSummary(toolName, parsedArgs),
                  parameters: parsedArgs,
                  timestamp: Date.now(),
                  executionMs: result.latencyMs,
                  engineUsed: result.engineUsed,
                  modelUsed: result.modelUsed,
                  clientAction: buildClientAction(toolName, parsedArgs),
                };

                sendEvent("task_receipt", receipt);
              }
            }
          }

          sendEvent("done", { status: "complete" });
        } catch (inferenceErr: any) {
          sendEvent("error", { message: inferenceErr?.message || "Inference error occurred" });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Bad request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function generateReceiptSummary(tool: string, args: Record<string, any>): string {
  switch (tool) {
    case "manage_alarm_timer":
      if (args.action === "create_timer") {
        const mins = args.duration_seconds ? Math.round(args.duration_seconds / 60) : 1;
        return `Arm countdown timer for ${mins} minute(s) [${args.label || "Timer"}]`;
      }
      return `Schedule absolute alarm for ${args.time_str || "specified time"}`;

    case "dispatch_whatsapp":
      return `Dispatch WhatsApp payload to ${args.recipient_name} (${args.phone_number || "Direct"}): "${args.message_body}"`;

    case "dispatch_instagram":
      return `Copy DM text & trigger Instagram handoff to @${args.username}: "${args.message_body}"`;

    case "dispatch_email":
      return `Draft email to ${args.recipient_email}: "${args.subject}"`;

    case "dispatch_sms":
      return `Draft SMS to ${args.phone_number}: "${args.message_body}"`;

    case "web_research_and_grounding":
      return `Execute live search query: "${args.query}"`;

    case "system_and_custom_action":
      return `Execute system ${args.action}: ${args.payload}`;

    default:
      return `Execute ${tool}`;
  }
}

function buildClientAction(tool: string, args: Record<string, any>): TaskReceipt["clientAction"] {
  switch (tool) {
    case "manage_alarm_timer":
      return {
        type: "alarm_set",
        data: {
          label: args.label || "JARVIS Alert",
          durationMs: (args.duration_seconds || 60) * 1000,
          timeStr: args.time_str,
          action: args.action,
        },
      };

    case "dispatch_whatsapp": {
      const cleanPhone = (args.phone_number || "").replace(/[^0-9]/g, "");
      const encodedMsg = encodeURIComponent(args.message_body || "");
      const uri = cleanPhone
        ? `whatsapp://send?phone=${cleanPhone}&text=${encodedMsg}`
        : `https://wa.me/?text=${encodedMsg}`;
      return {
        type: "uri_launch",
        uri,
        data: { fallbackUri: `https://wa.me/${cleanPhone}?text=${encodedMsg}`, text: args.message_body },
      };
    }

    case "dispatch_instagram": {
      const handle = (args.username || "").replace("@", "");
      return {
        type: "clipboard_copy",
        uri: `instagram://user?username=${handle}`,
        data: {
          copyText: args.message_body,
          webUri: `https://www.instagram.com/${handle}/`,
          dmUri: `https://ig.me/m/${handle}`,
        },
      };
    }

    case "dispatch_email": {
      const email = encodeURIComponent(args.recipient_email || "");
      const subject = encodeURIComponent(args.subject || "");
      const body = encodeURIComponent(args.body || "");
      return {
        type: "uri_launch",
        uri: `mailto:${email}?subject=${subject}&body=${body}`,
      };
    }

    case "dispatch_sms": {
      const phone = encodeURIComponent(args.phone_number || "");
      const body = encodeURIComponent(args.message_body || "");
      return {
        type: "uri_launch",
        uri: `sms:${phone}?body=${body}`,
      };
    }

    case "system_and_custom_action": {
      if (args.action === "clipboard_copy") {
        return {
          type: "clipboard_copy",
          data: { copyText: args.payload },
        };
      }
      if (args.action === "calendar_ics") {
        return {
          type: "calendar_download",
          data: {
            title: args.title || "JARVIS Scheduled Event",
            description: args.payload,
            startTime: args.metadata?.startTime || new Date(Date.now() + 3600000).toISOString(),
            endTime: args.metadata?.endTime || new Date(Date.now() + 7200000).toISOString(),
          },
        };
      }
      return undefined;
    }

    default:
      return undefined;
  }
}
