import { getDownloadUrl } from "@/lib/s3";
import { cn } from "@/lib/cn";
import { useEffect, useState } from "react";

const urlCache = new Map<string, { url: string; expiresAt: number }>();
const URL_TTL_MS = 240_000; // Presigns last 300s; refresh a bit earlier.

async function resolveLogoUrl(publicUrl: string): Promise<string> {
  const cached = urlCache.get(publicUrl);
  if (cached && cached.expiresAt > Date.now()) return cached.url;
  const url = await getDownloadUrl(publicUrl);
  urlCache.set(publicUrl, { url, expiresAt: Date.now() + URL_TTL_MS });
  return url;
}

export function invalidateLogoCache(publicUrl: string) {
  urlCache.delete(publicUrl);
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const sizeStyles = {
  sm: "size-5 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-16 text-lg",
};

export const OrgLogo = ({
  name,
  logoUrl,
  size = "md",
  className,
}: {
  name: string;
  logoUrl: string | null;
  size?: keyof typeof sizeStyles;
  className?: string;
}) => {
  const [resolved, setResolved] = useState<string | null>(() => {
    if (!logoUrl) return null;
    const cached = urlCache.get(logoUrl);
    return cached && cached.expiresAt > Date.now() ? cached.url : null;
  });

  useEffect(() => {
    if (!logoUrl) {
      setResolved(null);
      return;
    }
    let cancelled = false;
    resolveLogoUrl(logoUrl)
      .then((url) => {
        if (!cancelled) setResolved(url);
      })
      .catch(() => {
        if (!cancelled) setResolved(null);
      });
    return () => {
      cancelled = true;
    };
  }, [logoUrl]);

  const base = cn(
    "rounded shrink-0 flex items-center justify-center overflow-hidden bg-muted text-muted-foreground font-medium uppercase",
    sizeStyles[size],
    className
  );

  if (logoUrl && resolved) {
    return (
      <span className={base}>
        <img
          src={resolved}
          alt={name}
          className="w-full h-full object-cover"
        />
      </span>
    );
  }

  return <span className={base}>{initials(name)}</span>;
};
