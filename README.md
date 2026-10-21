# JARVIS // TACTILE 01
### Autonomous Mobile-First Personal AI Assistant & Device Controller
**Built specifically for the NVIDIA x Nebius Hackathon**

[![Built for NVIDIA NIM](https://img.shields.io/badge/NVIDIA%20NIM-Llama--3.3--70B-76B900?style=for-the-badge&logo=nvidia)](https://build.nvidia.com)
[![Powered by Nebius AI Studio](https://img.shields.io/badge/Nebius%20AI%20Studio-Fast%20Inference-FF4F00?style=for-the-badge)](https://studio.nebius.ai)
[![Progressive Web App](https://img.shields.io/badge/PWA-Mobile%20First-141413?style=for-the-badge)](/)
[![Design System](https://img.shields.io/badge/Design-Teenage%20Engineering%20%2F%20Braun-F2EFE9?style=for-the-badge&color=F2EFE9&labelColor=141413)](/)

---

## ⚡ Overview

**JARVIS // TACTILE 01** is a production-grade, mobile-first Progressive Web App (PWA) AI Assistant engineered as a voice-and-text-first device controller. It brings the power of **NVIDIA NIM** (`meta/llama-3.3-70b-instruct` / `nvidia/llama-3.1-nemotron-70b-instruct`) and **Nebius AI Studio** (`meta-llama/Llama-3.3-70B-Instruct-fast`) directly into the mobile browser with a dual-inference load balancer and automatic failover.

---

## 📐 Strict Anti-"Vibecoded" & Zero-3D Design System

Unlike generic dark-mode AI templates flooded with purple gradients and floating 3D spheres, JARVIS is crafted with a bespoke industrial hardware aesthetic inspired by **Teenage Engineering**, **Dieter Rams' Braun**, and **Nothing OS**:

- **Strict Zero-3D Ban**: 100% 2D flat-vector, CSS/SVG mechanics, and typographic telemetry. Zero Three.js, Spline, or WebGL 3D meshes.
- **Industrial Palette**:
  - Warm Alabaster / Bone (`#F2EFE9`) & Stone Grey (`#E4DFD7`)
  - Deep Ink Matte Carbon (`#141413`)
  - International Signal Orange (`#FF4F00`)
  - Forest Moss (`#1E4D2B`) for active states & Amber Ochre (`#D97706`) for clarification loops.
- **Locked 60fps Performance**: Pure GPU-accelerated CSS composite transforms (`transform`, `opacity`) ensuring battery conservation on mobile chipsets.

---

## 🛠️ Key Architectural Innovations

### 1. Dual-Inference Router (`lib/ai-engine.ts`)
- Dynamically routes streaming requests between **Nebius AI Studio** and **NVIDIA NIM**.
- Auto load-balancing with sub-second failover.
- Real-time telemetry reporting: latency (ms), token throughput (tok/s), and active engine status.
- Hardware Settings Drawer to enter or switch API keys at runtime without redeploying.

### 2. Universal Task Execution Engine (Client-Server Hybrid)
- **Alarms & Timers**: Stores alarms in IndexedDB/localStorage and arms both a dedicated Web Worker (`public/agent-worker.js`) and Service Worker (`public/sw.js`). Fires high-priority OS notifications, haptic patterns (`navigator.vibrate([500, 200, 500])`), and a synthesized Web Audio siren.
- **WhatsApp Messages**: Formats and triggers native mobile deep links (`whatsapp://send?phone=...&text=...` with `https://wa.me/` fallback).
- **Instagram Direct Messages**: Automatically copies AI-drafted messages to the system clipboard and opens `instagram://user?username=...` or `https://ig.me/m/...`.
- **Emails & SMS**: Prepares `mailto:` and `sms:` deep links or server-side SMTP/Resend dispatch.
- **Web Grounding**: Real-time fact retrieval via `/api/execute` web search.
- **Calendar Invites**: Generates and downloads native `.ics` calendar invites on the phone.

### 3. Multi-Turn Slot-Filling & Clarification State Machine
- When an incomplete command is issued (e.g., *"Send a WhatsApp to Rahul"* without the message body, or *"Set an alarm"* without a time), JARVIS invokes `ask_host_clarification`.
- The UI transitions into the **Amber Ochre** clarification state, vocally speaks the clarification prompt via TTS, opens the microphone, and merges the host's answer directly into the pending task ticket.

### 4. Background Execution & Lock-Screen Persistence
- **MediaSession Carrier**: Uses a silent 15Hz sub-audible keep-alive Web Audio stream paired with `navigator.mediaSession` to keep the mobile browser process alive in the background. Puts interactive JARVIS controls onto the phone's lock screen.
- **Screen Wake Lock API**: Prevents OS screen dimming during active sessions.
- **Dedicated Web Worker**: Runs a high-precision 250ms tick loop unaffected by tab throttling.

### 5. Procedural Web Audio Engine (<2KB, Zero Audio Assets)
- Built entirely with Web Audio API nodes (`OscillatorNode`, `GainNode`).
- Generates mechanical relay clicks, jog dial ticks, radar blips, alarm sirens, and clarification chimes on the fly with zero external audio downloads.

### 6. Fun Interactive 2D Toys
- **2D Kinetic Jog Dial**: Precision rotary thumb wheel with procedural mechanical sound and haptic feedback. Scrubs task history, flips AI engines, and tunes voice speed.
- **2D Mechanical Visualizer**: Real-time 60fps oscilloscope bar matrix driven by the user's microphone frequency bins (`AnalyserNode`).
- **2D Diagnostic Touch Matrix**: Capacitive X-Y pad with coordinate tracking and frequency modulation.
- **2D Blueprint Schematic Mode**: Fullscreen high-contrast engineering schematic displaying real-time FPS, battery level, orientation gyro vectors, and background worker status.

---

## 🚀 Quickstart

### 1. Clone & Install
```bash
git clone https://github.com/vardhan290509/Jarvis.git
cd Jarvis
npm install
```

### 2. Configure Environment (Optional)
Copy the example environment configuration:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your API keys:
```env
NVIDIA_API_KEY=your_nvidia_api_key_here
NEBIUS_API_KEY=your_nebius_api_key_here
DEFAULT_AI_PROVIDER=auto
```
*(Note: You can also paste your API keys directly into the app at runtime using the top-right hardware settings drawer).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your mobile browser or emulator.

---

## 📱 Mobile Testing & Installation (PWA)

1. Find your machine's local IP address (`ipconfig` on Windows or `ifconfig` on macOS/Linux).
2. On your mobile phone (connected to the same Wi-Fi), navigate to `http://<YOUR_IP>:3000`.
3. Tap **Share** (iOS Safari) or the **Three Dots** (Android Chrome) and select **"Add to Home Screen"**.
4. Launch JARVIS from your home screen for full-screen `100dvh` standalone mode.

---

## 📂 Repository Structure

```
.
├── app/
│   ├── api/
│   │   ├── agent/route.ts      # SSE streaming agent endpoint with tool execution
│   │   └── execute/route.ts    # Server action dispatcher (web search, ICS, SMTP)
│   ├── globals.css             # Tailwind & tactile industrial theme styles
│   ├── layout.tsx              # PWA viewport & metadata configuration
│   └── page.tsx                # Main mobile-first JARVIS control interface
├── components/
│   ├── ActionTicket.tsx        # 2D sliding action ticket with parameter pills
│   ├── BlueprintSchematic.tsx  # High-contrast technical blueprint view
│   ├── CalibrationWizard.tsx   # Hardware diagnostic & permissions calibration
│   ├── ClarificationBanner.tsx # Slot-filling clarification state machine banner
│   ├── DiagnosticPad.tsx       # 2D capacitive X-Y dot-matrix touch test pad
│   ├── KineticJogDial.tsx      # Precision rotary jog dial with haptics
│   ├── MechanicalVisualizer.tsx# 2D oscilloscope frequency visualizer
│   ├── SettingsDrawer.tsx      # Runtime NVIDIA/Nebius API key manager
│   └── TactileHeader.tsx       # Top telemetry status bar
├── lib/
│   ├── ai-engine.ts            # Dual-inference router (NVIDIA NIM + Nebius AI)
│   ├── hardware.ts             # Web hardware APIs (Mic, WakeLock, Sensors)
│   ├── sound-effects.ts        # Zero-KB procedural Web Audio synthesizer
│   ├── tools.ts                # OpenAI-compatible JSON schema tool definitions
│   └── types.ts                # TypeScript interfaces & event payloads
├── public/
│   ├── agent-worker.js         # Dedicated Web Worker for background precision timers
│   ├── manifest.json           # PWA standalone manifest
│   ├── sw.js                   # Service Worker (Background Sync & Push Alerts)
│   ├── icon-192.svg            # Industrial 2D vector icon
│   └── icon-512.svg            # Industrial 2D vector icon
├── tailwind.config.ts          # Tactile industrial color palette & shadows
├── next.config.mjs             # Next.js & Service Worker security headers
└── package.json
```

---

## 🏆 Hackathon Tracks & Capabilities

- **NVIDIA NIM Integration**: Fully compatible with NVIDIA NIM endpoint specification (`https://integrate.api.nvidia.com/v1`) using Llama 3.3 70B & Nemotron models.
- **Nebius AI Studio Integration**: High-speed low-latency inference endpoint (`https://api.studio.nebius.ai/v1`) using `meta-llama/Llama-3.3-70B-Instruct-fast`.
- **Mobile First**: PWA with lock-screen media controls, wake lock, motion gestures, contacts, and universal phone app handoffs.

---

## 📜 License
MIT License. Built by Vardhan Gajula for the NVIDIA x Nebius Hackathon.
