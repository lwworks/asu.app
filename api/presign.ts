import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { key, contentType } = req.body as {
    key: string;
    contentType: string;
  };

  if (!key || !contentType) {
    return res.status(400).json({ error: "Missing key or contentType" });
  }

  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const endpoint = process.env.S3_ENDPOINT;

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    return res
      .status(500)
      .json({ error: "S3 is not configured on the server" });
  }

  const client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
  });

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(client, command, { expiresIn: 300 });

  const publicUrl = endpoint
    ? `${endpoint}/${bucket}/${key}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  return res.status(200).json({ url, publicUrl });
}
