import { useEffect, useState } from "react";

// Which chapter challenges you've completed, saved in this browser.
const KEY = "csv-progress";

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

// Deferred so it's safe to call while a component is rendering.
export function markDone(path: string) {
  setTimeout(() => {
    const done = new Set(read());
    if (done.has(path)) return;
    done.add(path);
    try {
      localStorage.setItem(KEY, JSON.stringify([...done]));
    } catch {}
    window.dispatchEvent(new Event("csv-progress"));
  }, 0);
}

export function useProgress() {
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => {
    const update = () => setDone(read());
    update();
    window.addEventListener("csv-progress", update);
    return () => window.removeEventListener("csv-progress", update);
  }, []);
  return done;
}
