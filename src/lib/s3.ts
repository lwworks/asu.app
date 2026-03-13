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
