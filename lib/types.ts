// Type definitions for JARVIS Tactile AI Assistant //

export type AIProvider = "auto" | "nvidia" | "nebius";

export interface DeviceTelemetry {
  batteryLevel?: number; // 0 to 1
  isCharging?: boolean;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  currentTime: string;
  userAgent?: string;
  activeAlarmsCount?: number;
  contactCount?: number;
  orientation?: {
    alpha: number | null;
    beta: number | null;
    gamma: number | null;
  };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required: string[];
    };
  };
}

export interface ClarificationRequest {
  id: string;
  question: string;
  missingField: string;
  toolName?: string;
  targetTool?: string;
  partialArguments: Record<string, any>;
  suggestions?: string[];
}

export interface TaskReceipt {
  id: string;
  tool: string;
  status: "pending" | "clarification" | "executing" | "completed" | "failed";
  summary: string;
  parameters: Record<string, any>;
  clientAction?: {
    type: "uri_launch" | "alarm_set" | "clipboard_copy" | "notification" | "calendar_download";
    uri?: string;
    data?: any;
  };
  timestamp: number;
  executionMs?: number;
  engineUsed: "nvidia" | "nebius" | "local-hybrid";
  modelUsed: string;
}

export interface AgentStreamEvent {
  event: "assistant_speech" | "clarification_required" | "tool_execution" | "task_receipt" | "telemetry" | "done" | "error";
  data: any;
}
