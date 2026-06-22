export const REFRESH_INTERVAL = 30;
export const VIEW_MODE_KEY = "view-mode";

export function refreshPage() {
  console.log("[tampermonkey] reloading...");
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

export function waitForInitialData(proc: (obj: object) => void) {
  const retry = () => {
    setTimeout(() => {
      console.log("[tampermonkey] retry after failure");
      const initialData = document.querySelector("#initialData");
      if (initialData === null) {
        console.log("[tampermonkey] can no longer find initialData after waiting");
        return;
      } else {
        wrapped(initialData);
      }
    }, 50);
  };
  const wrapped = (el: Element) => {
    let decoded: string;
    try {
      decoded = decodeURIComponent(el.textContent);
    } catch (e) {
      console.log("[tampermonkey] failed to decode URI, found", el.textContent);
      retry();
      return;
    }
    let parsed: object;
    try {
      parsed = JSON.parse(decoded);
    } catch (e) {
      console.log("[tampermonkey] failed to parse JSON, found", decoded);
      retry();
      return;
    }
    return proc(parsed);
  };

  return () => {
    console.log("[tampermonkey] start Leaderboard component");
    const initialData = document.querySelector("#initialData");
    if (initialData !== null) {
      console.log("[tampermonkey] found initialData right away");
      wrapped(initialData);
    } else {
      console.log("[tampermonkey] wait for initialData through MutationObserver");

      const obs = new MutationObserver((mutations) => {
        for (const { addedNodes } of mutations) {
          for (const node of addedNodes) {
            if (!(node instanceof Element)) continue;
            const initialData = node.matches("#initialData") ? node : node.querySelector("#initialData");
            if (initialData !== null) {
              obs.disconnect();
              console.log("[tampermonkey] found initialData through MutationObserver");
              wrapped(initialData);
              return;
            }
          }
        }
      });

      obs.observe(document.body, { childList: true, subtree: true });
    }
  }
}