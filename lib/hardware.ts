// Hardware API Bindings, Sensors & Web Permissions for JARVIS //

import { DeviceTelemetry } from "./types";

export interface PermissionStatusMap {
  microphone: "prompt" | "granted" | "denied";
  speech: "supported" | "unsupported";
  notifications: "default" | "granted" | "denied";
  wakeLock: "active" | "inactive" | "unsupported";
  contacts: "supported" | "unsupported";
  geolocation: "prompt" | "granted" | "denied";
  battery: "supported" | "unsupported";
  motion: "supported" | "unsupported" | "granted";
}

export class JarvisHardware {
  private wakeLockSentinel: any = null;
  private speechRecognition: any = null;
  private isListeningContinuous: boolean = false;
  private lastShakeTime: number = 0;

  public async getInitialPermissions(): Promise<PermissionStatusMap> {
    const status: PermissionStatusMap = {
      microphone: "prompt",
      speech: typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) ? "supported" : "unsupported",
      notifications: typeof window !== "undefined" && "Notification" in window ? Notification.permission : "denied",
      wakeLock: typeof window !== "undefined" && "wakeLock" in navigator ? "inactive" : "unsupported",
      contacts: typeof window !== "undefined" && "contacts" in navigator && "ContactsManager" in window ? "supported" : "unsupported",
      geolocation: "prompt",
      battery: typeof window !== "undefined" && "getBattery" in navigator ? "supported" : "unsupported",
      motion: typeof window !== "undefined" && "DeviceMotionEvent" in window ? "supported" : "unsupported",
    };

    if (typeof navigator !== "undefined" && navigator.permissions) {
      try {
        const mic = await navigator.permissions.query({ name: "microphone" as any });
        status.microphone = mic.state;
      } catch (e) {}

      try {
        const geo = await navigator.permissions.query({ name: "geolocation" as any });
        status.geolocation = geo.state;
      } catch (e) {}
    }

    return status;
  }

  // Request Microphone
  public async requestMicrophone(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Keep track or immediately release test stream
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (e) {
      console.warn("Microphone access denied or error:", e);
      return false;
    }
  }

  // Request Notifications
  public async requestNotifications(): Promise<boolean> {
    if (!("Notification" in window)) return false;
    try {
      const res = await Notification.requestPermission();
      return res === "granted";
    } catch (e) {
      return false;
    }
  }

  // Acquire Screen Wake Lock
  public async acquireWakeLock(): Promise<boolean> {
    if (!("wakeLock" in navigator)) return false;
    try {
      this.wakeLockSentinel = await (navigator as any).wakeLock.request("screen");
      this.wakeLockSentinel.addEventListener("release", () => {
        this.wakeLockSentinel = null;
      });
      return true;
    } catch (e) {
      console.warn("WakeLock request failed:", e);
      return false;
    }
  }

  public releaseWakeLock() {
    if (this.wakeLockSentinel) {
      this.wakeLockSentinel.release().catch(() => {});
      this.wakeLockSentinel = null;
    }
  }

  // Contact Picker API
  public async pickContacts(): Promise<{ name: string; tel: string; email?: string }[]> {
    if ("contacts" in navigator && "ContactsManager" in window) {
      try {
        const props = ["name", "tel", "email"];
        const opts = { multiple: false };
        const contacts = await (navigator as any).contacts.select(props, opts);
        if (contacts && contacts.length > 0) {
          return contacts.map((c: any) => ({
            name: c.name?.[0] || "Unknown",
            tel: c.tel?.[0] || "",
            email: c.email?.[0] || "",
          }));
        }
      } catch (e) {
        console.warn("Contact picker cancelled or unsupported:", e);
      }
    }

    // Default fast tactile fallback address book simulation for testing & non-supported browsers
    return [
      { name: "Arjun Verma", tel: "+919876543210", email: "arjun.verma@hackathon.dev" },
      { name: "Priya Sharma", tel: "+919812345678", email: "priya.sharma@domain.com" },
      { name: "Rahul Mehta", tel: "+14155552671", email: "rahul@startup.io" },
    ];
  }

  // Read Live Device Telemetry
  public async getTelemetry(): Promise<DeviceTelemetry> {
    const telemetry: DeviceTelemetry = {
      currentTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };

    // Battery
    if (typeof navigator !== "undefined" && "getBattery" in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        telemetry.batteryLevel = battery.level;
        telemetry.isCharging = battery.charging;
      } catch (e) {}
    }

    // Geolocation
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        telemetry.latitude = pos.coords.latitude;
        telemetry.longitude = pos.coords.longitude;
        telemetry.accuracy = pos.coords.accuracy;
      } catch (e) {}
    }

    return telemetry;
  }

  // Setup Shake & Device Motion Detection
  public setupMotionGestures(onShake: () => void, onTilt?: (tilt: { alpha: number; beta: number; gamma: number }) => void) {
    if (typeof window === "undefined") return;

    // Shake threshold
    const THRESHOLD = 18;
    let lastX = 0, lastY = 0, lastZ = 0, lastTime = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const current = event.accelerationIncludingGravity;
      if (!current || current.x === null) return;

      const now = Date.now();
      if (now - lastTime > 100) {
        const diffTime = now - lastTime;
        lastTime = now;

        const speed = Math.abs((current.x || 0) + (current.y || 0) + (current.z || 0) - lastX - lastY - lastZ) / diffTime * 10000;
        if (speed > THRESHOLD * 50) {
          if (now - this.lastShakeTime > 1200) {
            this.lastShakeTime = now;
            onShake();
          }
        }

        lastX = current.x || 0;
        lastY = current.y || 0;
        lastZ = current.z || 0;
      }
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (onTilt && e.beta !== null && e.gamma !== null) {
        onTilt({
          alpha: e.alpha || 0,
          beta: e.beta || 0,
          gamma: e.gamma || 0,
        });
      }
    };

    window.addEventListener("devicemotion", handleMotion, { passive: true });
    window.addEventListener("deviceorientation", handleOrientation, { passive: true });

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }

  // Text-To-Speech Output
  public speak(text: string, onEnd?: () => void) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      
      // Select best clean voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha")));
      if (preferred) utterance.voice = preferred;

      utterance.onend = () => onEnd?.();
      utterance.onerror = () => onEnd?.();
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      onEnd?.();
    }
  }

  // Continuous Speech Recognition
  public startSpeechRecognition(
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (err: any) => void
  ): () => void {
    if (typeof window === "undefined") return () => {};

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError?.("Web Speech API not supported in this browser");
      return () => {};
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let interimText = "";
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }
        if (finalText) {
          onResult(finalText, true);
        } else if (interimText) {
          onResult(interimText, false);
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error !== "no-speech") {
          onError?.(e.error);
        }
      };

      recognition.start();
      this.speechRecognition = recognition;

      return () => {
        try {
          recognition.stop();
        } catch (e) {}
      };
    } catch (err) {
      onError?.(err);
      return () => {};
    }
  }
}

export const hardware = new JarvisHardware();
