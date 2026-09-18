const STORAGE_KEY = "asu:clock-offset";
const SAMPLE_COUNT = 3;
export const CLOCK_SKEW_WARNING_MS = 60_000;
export const CLOCK_OFFSET_REFRESH_MS = 15 * 60 * 1000;

type CachedOffset = {
  offset: number;
  measuredAt: number;
};

const readCache = (): CachedOffset | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedOffset;
    if (typeof parsed.offset !== "number" || !Number.isFinite(parsed.offset)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (offset: number) => {
  try {
    const cached: CachedOffset = { offset, measuredAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch {
    // localStorage may be unavailable (private mode); keep going with in-memory offset
  }
};

export const getCachedOffset = (): number => readCache()?.offset ?? 0;

export const now = (offset = getCachedOffset()): Date =>
  new Date(Date.now() + offset);

const timeUrl = () => {
  const base = import.meta.env.VITE_SYNC_URL;
  if (!base) return null;
  return `${String(base)
    .replace(/^wss:/i, "https:")
    .replace(/^ws:/i, "http:")
    .replace(/\/$/, "")}/time`;
};

const measureOnce = async (
  url: string
): Promise<{ offset: number; rtt: number } | null> => {
  const t0 = Date.now();
  try {
    const response = await fetch(url, { cache: "no-store" });
    const t1 = Date.now();
    if (!response.ok) return null;
    const data = (await response.json()) as { now?: number };
    if (typeof data.now !== "number" || !Number.isFinite(data.now)) return null;
    const rtt = t1 - t0;
    return { offset: data.now + rtt / 2 - t1, rtt };
  } catch {
    return null;
  }
};

export const measureClockOffset = async (): Promise<number | null> => {
  const url = timeUrl();
  if (!url) return null;

  const samples: { offset: number; rtt: number }[] = [];
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const sample = await measureOnce(url);
    if (sample) samples.push(sample);
  }
  if (samples.length === 0) return null;

  samples.sort((a, b) => a.rtt - b.rtt);
  const offset = samples[0].offset;
  writeCache(offset);
  return offset;
};
