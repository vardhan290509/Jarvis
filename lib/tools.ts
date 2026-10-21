import { ToolDefinition } from "./types";

export const JARVIS_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "ask_host_clarification",
      description: "Triggered whenever a required parameter is missing, vague, or ambiguous from the user command (e.g., recipient missing for a message, message body omitted, time missing for an alarm, or Instagram handle unclear). NEVER guess critical fields.",
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "Direct, concise, spoken question to ask the user to fill the missing slot.",
          },
          missing_field: {
            type: "string",
            description: "The name of the missing or ambiguous parameter (e.g., 'message_body', 'alarm_time', 'recipient_phone', 'instagram_handle').",
          },
          target_tool: {
            type: "string",
            description: "The tool intended to be executed once this slot is clarified.",
          },
          partial_arguments: {
            type: "object",
            description: "Key-value pairs of already known parameters.",
          },
          suggestions: {
            type: "array",
            items: { type: "string" },
            description: "Optional quick-tap suggestion chips for the user.",
          },
        },
        required: ["question", "missing_field", "target_tool"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_alarm_timer",
      description: "Create, cancel, snooze, or list alarms and countdown timers on the device.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["create_timer", "create_alarm", "cancel", "list", "snooze"],
            description: "The alarm/timer action to perform.",
          },
          label: {
            type: "string",
            description: "A human-readable label for the timer/alarm (e.g., 'Boil Eggs', 'Morning Standup', 'Meeting in 10m').",
          },
          duration_seconds: {
            type: "number",
            description: "Duration in seconds for a relative countdown timer (e.g., 600 for 10 minutes).",
          },
          time_str: {
            type: "string",
            description: "Target time formatted as HH:MM or ISO timestamp for an absolute alarm.",
          },
          alarm_id: {
            type: "string",
            description: "ID of the alarm when cancelling or snoozing.",
          },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "dispatch_whatsapp",
      description: "Prepare and dispatch a WhatsApp message to a contact or phone number. Requires both a valid phone/contact and message content.",
      parameters: {
        type: "object",
        properties: {
          recipient_name: {
            type: "string",
            description: "Name of the recipient as identified by the user.",
          },
          phone_number: {
            type: "string",
            description: "International E.164 or local phone number (e.g. +14155552671 or 9876543210).",
          },
          message_body: {
            type: "string",
            description: "The exact text message content to send.",
          },
        },
        required: ["recipient_name", "message_body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "dispatch_instagram",
      description: "Prepare an Instagram direct message (DM) or profile visit. Resolves handle and pre-copies message body to the device clipboard so the user can paste and send directly.",
      parameters: {
        type: "object",
        properties: {
          username: {
            type: "string",
            description: "Instagram @handle without the @ symbol.",
          },
          message_body: {
            type: "string",
            description: "Text message to send via Instagram DM.",
          },
          action_type: {
            type: "string",
            enum: ["dm", "profile"],
            description: "Whether to deep-link straight to the DM conversation or profile.",
          },
        },
        required: ["username", "message_body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "dispatch_email",
      description: "Draft and send an email via backend dispatcher or native mailto: deep link.",
      parameters: {
        type: "object",
        properties: {
          recipient_email: {
            type: "string",
            description: "Email address of the recipient.",
          },
          recipient_name: {
            type: "string",
            description: "Name of recipient if known.",
          },
          subject: {
            type: "string",
            description: "Email subject line.",
          },
          body: {
            type: "string",
            description: "Full body text of the email.",
          },
          send_method: {
            type: "string",
            enum: ["native_client", "server_smtp"],
            description: "Preferred delivery method.",
          },
        },
        required: ["recipient_email", "subject", "body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "dispatch_sms",
      description: "Draft and dispatch a native SMS text message via sms: URI or webhook.",
      parameters: {
        type: "object",
        properties: {
          phone_number: {
            type: "string",
            description: "Destination phone number.",
          },
          recipient_name: {
            type: "string",
            description: "Recipient display name.",
          },
          message_body: {
            type: "string",
            description: "SMS message text.",
          },
        },
        required: ["phone_number", "message_body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_research_and_grounding",
      description: "Perform real-time web lookups, fact synthesis, or retrieval of live information (weather, news, technical facts, stocks).",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Focused search query to ground the response.",
          },
          domain: {
            type: "string",
            description: "Optional domain filter (e.g., 'news', 'weather', 'finance', 'general').",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "system_and_custom_action",
      description: "Execute device utilities: mathematical evaluation, note-taking, calendar .ics invite generation, clipboard copying, or custom webhook dispatch.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["calculate", "calendar_ics", "save_note", "clipboard_copy", "custom_webhook"],
            description: "System action type.",
          },
          title: {
            type: "string",
            description: "Title or short description.",
          },
          payload: {
            type: "string",
            description: "Expression to calculate, note text, or iCalendar details.",
          },
          metadata: {
            type: "object",
            description: "Additional structured payload data (e.g. startTime, endTime for calendar).",
          },
        },
        required: ["action", "payload"],
      },
    },
  },
];
