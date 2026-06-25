export function tampermonkeyLog(s: string): void {
  console.log(`[tampermonkey] ${s}`);
}

export function refreshPage() {
  tampermonkeyLog("reloading...");
  window.location.reload();
}

export function formatTime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor(seconds % (3600 * 24) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const timeStr = [
    hours,
    String(minutes).padStart(2, "0"),
    String(secs).padStart(2, "0")
  ].join(":");

  if (days === 0) {
    return timeStr;
  } else {
    return `${days} day${days > 1 ? "s" : ""} and ${timeStr}`;
  }
}

export function computeDuration(time: number, multiplier: number) {
  const duration = multiplier * (time - Date.now());
  return Math.floor(Math.max(0, duration) / 1000);
}