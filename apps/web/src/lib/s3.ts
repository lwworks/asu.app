/**
 * File uploads via the auth worker (Cloudflare R2, EU).
 *
 * The worker at /api/files stores objects in R2. Credentials never reach
 * the browser; the session cookie authenticates the request.
 */

const AUTH_URL = import.meta.env.VITE_AUTH_URL;

/**
 * Upload a file to R2 and return its object key.
 */
export async function uploadFile(file: File, key: string): Promise<string> {
  const res = await fetch(
    `${AUTH_URL}/api/files?key=${encodeURIComponent(key)}`,
    {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    }
  );

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Upload failed: ${res.status}`);
  }

  const { key: storedKey } = (await res.json()) as { key: string };
  return storedKey;
}

/**
 * Fetch a stored file and return a blob URL for display or download.
 */
export async function getDownloadUrl(stored: string): Promise<string> {
  const key = extractKey(stored);

  const res = await fetch(
    `${AUTH_URL}/api/files?key=${encodeURIComponent(key)}`,
    { credentials: "include" }
  );

  if (!res.ok) {
    throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/**
 * Extract the object key from a stored value.
 *
 * New uploads store the key directly. Older values may be path-style S3 URLs
 * (Hetzner) or virtual-host AWS URLs.
 */
function extractKey(stored: string): string {
  if (!/^https?:\/\//.test(stored)) {
    return stored.replace(/^\//, "");
  }

  const url = new URL(stored);
  const pathParts = url.pathname.split("/").filter(Boolean);

  if (pathParts[0] === "api" && pathParts[1] === "files") {
    return pathParts.slice(2).join("/");
  }

  // Virtual-host (AWS): entire path is the key
  if (url.hostname.includes("s3.") && url.hostname.includes(".amazonaws.com")) {
    return pathParts.join("/");
  }

  // Path-style (e.g. Hetzner): first segment is bucket name, rest is key
  return pathParts.slice(1).join("/");
}

/**
 * Build a unique R2 key for a note attachment.
 */
export function noteAttachmentKey(
  operationId: string,
  noteId: string,
  fileName: string
): string {
  const ext = fileName.includes(".") ? fileName.split(".").pop() : "";
  return `operations/${operationId}/notes/${noteId}${ext ? `.${ext}` : ""}`;
}

export function orgLogoKey(orgId: string, fileName: string): string {
  const ext = fileName.includes(".") ? fileName.split(".").pop() : "";
  return `organizations/${orgId}/logo-${Date.now()}${ext ? `.${ext}` : ""}`;
}
