"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * S3 PRESIGNING — single Convex action that hands a short-lived PUT URL to the
 * client. Actual upload is direct from browser → S3, bypassing both Convex and
 * Next.js. The returned `key` is what the client persists via `blocks.update`.
 *
 * Convex Actions run in Node-runtime; `"use node"` enables the AWS SDK.
 */

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "application/pdf",
]);

const MAX_BYTES = 25 * 1024 * 1024; // 25 MiB

function makeClient(): S3Client {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? "auto";
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("S3 credentials not configured");
  }
  return new S3Client({
    region,
    endpoint,
    forcePathStyle: !!endpoint, // MinIO/R2 use path-style
    credentials: { accessKeyId, secretAccessKey },
  });
}

export const presignPut = action({
  args: {
    contentType: v.string(),
    size: v.number(),
    keyPrefix: v.string(), // e.g. "handouts/<id>/blocks"
  },
  handler: async (_ctx, { contentType, size, keyPrefix }) => {
    if (!ALLOWED_MIME.has(contentType)) {
      throw new Error(`Disallowed content type: ${contentType}`);
    }
    if (size <= 0 || size > MAX_BYTES) {
      throw new Error(`File size out of range: ${size}`);
    }
    const bucket = process.env.S3_BUCKET;
    if (!bucket) throw new Error("S3_BUCKET not configured");

    const ext = contentType.split("/")[1] ?? "bin";
    const safePrefix = keyPrefix.replace(/[^a-zA-Z0-9/_-]/g, "");
    const key = `${safePrefix}/${crypto.randomUUID()}.${ext}`;

    const client = makeClient();
    const url = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: size,
      }),
      { expiresIn: 300 }, // 5 min
    );

    const publicBase = process.env.S3_PUBLIC_BASE_URL ?? "";
    return {
      uploadUrl: url,
      key,
      publicUrl: publicBase ? `${publicBase}/${key}` : null,
    };
  },
});
