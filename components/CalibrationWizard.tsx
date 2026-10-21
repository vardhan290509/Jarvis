"use client";

import React, { useState, useEffect } from "react";
import { soundFX } from "@/lib/sound-effects";
import { hardware, PermissionStatusMap } from "@/lib/hardware";
import { Mic, Bell, Shield, Users, MapPin, Zap, CheckCircle2, ArrowRight } from "lucide-react";

interface CalibrationWizardProps {
  onComplete: () => void;
}

export const CalibrationWizard: React.FC<CalibrationWizardProps> = ({ onComplete }) => {
  const [permissions, setPermissions] = useState<PermissionStatusMap | null>(null);
  const [calibrating, setCalibrating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    hardware.getInitialPermissions().then(setPermissions);
  }, []);

  const handleRunCalibration = async () => {
    setCalibrating(true);
    soundFX.playRelay(true);

    // 1. Microphone
    setCurrentStep(1);
    await hardware.requestMicrophone();

    // 2. Notifications
    setCurrentStep(2);
    await hardware.requestNotifications();

    // 3. Screen Wake Lock
    setCurrentStep(3);
    await hardware.acquireWakeLock();

    // 4. Background Keep-Alive Audio Carrier
    soundFX.startBackgroundKeepAlive();

    // Refresh status
    const updated = await hardware.getInitialPermissions();
    setPermissions(updated);
    setCalibrating(false);

    soundFX.playClick(1000);
    localStorage.setItem("jarvis_calibrated", "true");
    onComplete();
  };

  const items = [
    {
      title: "ACOUSTIC SENSORS & MIC",
      desc: "Continuous hands-free speech input & frequency visualizer",
      icon: <Mic className="w-4 h-4 text-industrial-orange" />,
      granted: permissions?.microphone === "granted",
    },
    {
      title: "PUSH ALERTS & BACKGROUND SYNC",
      desc: "Precision alarms, timers & lock-screen task receipts",
      icon: <Bell className="w-4 h-4 text-industrial-orange" />,
      granted: permissions?.notifications === "granted",
    },
    {
      title: "SCREEN WAKE LOCK & KEEP-ALIVE",
      desc: "Prevents browser suspension during autonomous tasks",
      icon: <Shield className="w-4 h-4 text-industrial-orange" />,
      granted: permissions?.wakeLock !== "unsupported",
    },
    {
      title: "DEVICE CONTACT RESOLUTION",
      desc: "Contact Picker API for WhatsApp, SMS & Email routing",
      icon: <Users className="w-4 h-4 text-industrial-orange" />,
      granted: true,
    },
    {
      title: "GEOLOCATION & MOTION GYRO",
      desc: "Context awareness, shake-to-clear & tilt dynamics",
      icon: <MapPin className="w-4 h-4 text-industrial-orange" />,
      granted: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-industrial-carbon/80 p-4 font-mono select-none">
      <div className="w-full max-w-sm bg-industrial-bone border-4 border-industrial-carbon p-4 rounded-sm shadow-tactile-lg space-y-4">
        {/* Header */}
        <div className="border-b-2 border-industrial-carbon pb-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-industrial-orange">
              INITIAL CALIBRATION PROTOCOL
            </span>
            <span className="text-[10px] font-bold text-industrial-carbon">SPEC-01</span>
          </div>
          <h2 className="text-sm font-bold text-industrial-carbon uppercase tracking-wider mt-0.5">
            JARVIS // SYSTEM DIAGNOSTIC
          </h2>
          <p className="text-[10px] text-industrial-carbon/70 mt-1">
            Authorizing local mobile Web APIs for autonomous device execution.
          </p>
        </div>

        {/* Permission List */}
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-2 bg-industrial-stone border border-industrial-carbon rounded-xs shadow-tactile-sm"
            >
              <div className="mt-0.5">{item.icon}</div>
              <div className="flex-1">
                <div className="text-[11px] font-bold text-industrial-carbon flex items-center justify-between">
                  <span>{item.title}</span>
                  {item.granted && (
                    <span className="text-[9px] text-industrial-moss font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      READY
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-industrial-carbon/70 leading-tight mt-0.5">
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-industrial-carbon/30">
          <button
            onClick={handleRunCalibration}
            disabled={calibrating}
            className="w-full bg-industrial-orange hover:bg-industrial-orange/90 text-industrial-bone font-mono font-bold text-xs py-3 px-4 border-2 border-industrial-carbon rounded-xs shadow-tactile active:translate-y-0.5 active:shadow-tactile-press flex items-center justify-center gap-2 transition-all"
          >
            <span>{calibrating ? "CALIBRATING HARDWARE..." : "AUTHORIZE & ENGAGE"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
