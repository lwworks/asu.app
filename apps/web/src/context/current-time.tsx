import { createContext, useContext, useEffect, useState } from "react";
import {
  CLOCK_OFFSET_REFRESH_MS,
  getCachedOffset,
  measureClockOffset,
  now,
} from "@/lib/clock-offset";
import { ClockSkewBanner } from "@/components/layout/clock-skew-banner";

export const CurrentTimeContext = createContext<{
  currentTime: Date;
  setCurrentTime: (currentTime: Date) => void;
  clockOffset: number;
}>(null!);

export const CurrentTimeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [clockOffset, setClockOffset] = useState(getCachedOffset);
  const [currentTime, setCurrentTime] = useState(() => now(clockOffset));

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const measured = await measureClockOffset();
      if (!cancelled && measured !== null) setClockOffset(measured);
    };

    refresh();
    const interval = setInterval(refresh, CLOCK_OFFSET_REFRESH_MS);
    const onOnline = () => {
      void refresh();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    setCurrentTime(now(clockOffset));
    const interval = setInterval(() => {
      setCurrentTime(now(clockOffset));
    }, 1000);
    return () => clearInterval(interval);
  }, [clockOffset]);

  return (
    <CurrentTimeContext.Provider
      value={{ currentTime, setCurrentTime, clockOffset }}
    >
      <ClockSkewBanner offsetMs={clockOffset} />
      {children}
    </CurrentTimeContext.Provider>
  );
};

export const useCurrentTime = () => {
  return useContext(CurrentTimeContext);
};
