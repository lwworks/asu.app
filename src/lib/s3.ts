/**
 * S3 file uploads via presigned URLs from the backend.
 *
 * The Vercel serverless function at /api/presign generates presigned PUT URLs
 * so that S3 credentials never reach the browser.
 */

/**
 * Upload a file to S3 and return its public URL.
 */
export async function uploadFile(file: File, key: string): Promise<string> {
  const presignRes = await fetch("/api/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, contentType: file.type }),
  });

  if (!presignRes.ok) {
    throw new Error(`Failed to get presigned URL: ${presignRes.status} ${presignRes.statusText}`);
  }

  const { url, publicUrl } = (await presignRes.json()) as {
    url: string;
    publicUrl: string;
  };

  const uploadRes = await fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!uploadRes.ok) {
    throw new Error(`S3 upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
  }

  return publicUrl;
}

/**
 * Get a presigned download URL for a private S3 object.
 */
export async function getDownloadUrl(publicUrl: string): Promise<string> {
  const key = extractKeyFromPublicUrl(publicUrl);

  const res = await fetch("/api/presign-get", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });

  if (!res.ok) {
    throw new Error(`Failed to get download URL: ${res.status} ${res.statusText}`);
  }

  const { url } = (await res.json()) as { url: string };
  return url;
}

/**
 * Extract the S3 object key from a public URL.
 *
 * Handles both formats:
 * - Path-style:  https://endpoint/bucket/key
 * - Virtual-host: https://bucket.s3.region.amazonaws.com/key
 */
function extractKeyFromPublicUrl(publicUrl: string): string {
  const url = new URL(publicUrl);
  const pathParts = url.pathname.split("/").filter(Boolean);

  // Path-style (e.g. Hetzner): first segment is bucket name, rest is key
  // Virtual-host (AWS): entire path is the key
  if (url.hostname.includes("s3.") && url.hostname.includes(".amazonaws.com")) {
    return pathParts.join("/");
  }

  // Path-style: skip bucket name (first segment)
  return pathParts.slice(1).join("/");
}

/**
 * Build a unique S3 key for a note attachment.
 */
export function noteAttachmentKey(
  operationId: string,
  noteId: string,
  fileName: string
): string {
  const ext = fileName.includes(".") ? fileName.split(".").pop() : "";
  return `operations/${operationId}/notes/${noteId}${ext ? `.${ext}` : ""}`;
}
