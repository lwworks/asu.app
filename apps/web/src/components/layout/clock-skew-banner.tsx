import { CLOCK_SKEW_WARNING_MS } from "@/lib/clock-offset";
import { AlertTriangleIcon } from "lucide-react";

const formatSkew = (offsetMs: number): string => {
  const totalMinutes = Math.max(1, Math.round(Math.abs(offsetMs) / 60_000));
  if (totalMinutes === 1) return "1 Minute";
  if (totalMinutes < 60) return `${totalMinutes} Minuten`;
  const hours = Math.round(totalMinutes / 60);
  if (hours === 1) return "1 Stunde";
  return `${hours} Stunden`;
};

export const ClockSkewBanner = ({ offsetMs }: { offsetMs: number }) => {
  if (Math.abs(offsetMs) <= CLOCK_SKEW_WARNING_MS) return null;

  return (
    <div
      role="status"
      className="bg-destructive/15 text-destructive border-b border-destructive/30 px-8 py-2 text-sm flex items-center gap-2"
    >
      <AlertTriangleIcon className="size-4 shrink-0" />
      <span>
        Die Uhr dieses Geräts weicht um {formatSkew(offsetMs)} ab — Zeitstempel
        werden automatisch korrigiert. Bitte Systemzeit und Zeitzone prüfen.
      </span>
    </div>
  );
};
