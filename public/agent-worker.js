// JARVIS Dedicated Web Worker for precision timing & background task queuing //

let timers = [];
let heartbeatInterval = null;

self.onmessage = function (e) {
  const data = e.data;
  if (!data) return;

  switch (data.type) {
    case "START_HEARTBEAT":
      if (!heartbeatInterval) {
        heartbeatInterval = setInterval(() => {
          self.postMessage({ type: "HEARTBEAT_TICK", timestamp: Date.now() });
        }, 1000);
      }
      break;

    case "ADD_TIMER":
      timers.push({
        id: data.id,
        label: data.label,
        durationMs: data.durationMs,
        endTime: Date.now() + data.durationMs,
        type: data.timerType || "countdown",
      });
      break;

    case "CANCEL_TIMER":
      timers = timers.filter((t) => t.id !== data.id);
      break;

    case "SYNC_TIMERS":
      timers = data.timers || [];
      break;
  }
};

// High-precision 250ms tick loop
setInterval(() => {
  const now = Date.now();
  const finished = [];

  timers.forEach((t) => {
    const remaining = Math.max(0, t.endTime - now);
    if (remaining <= 0) {
      finished.push(t);
    }
  });

  if (finished.length > 0) {
    finished.forEach((t) => {
      self.postMessage({ type: "TIMER_COMPLETE", timer: t });
    });
    timers = timers.filter((t) => t.endTime > now);
  } else if (timers.length > 0) {
    self.postMessage({
      type: "TIMER_PROGRESS",
      timers: timers.map((t) => ({
        id: t.id,
        label: t.label,
        remainingMs: Math.max(0, t.endTime - now),
        totalMs: t.durationMs,
      })),
    });
  }
}, 250);
