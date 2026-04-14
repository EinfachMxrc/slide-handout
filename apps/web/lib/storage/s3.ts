/**
 * Helper, der die Convex-Action `storage.presignPut` aufruft und dann den
 * Upload selbst durchführt. Verwendet ausschließlich vom Client (Editor).
 */
import { ConvexReactClient } from "convex/react";
import { api } from "@convex/_generated/api";

export interface UploadResult {
  key: string;
  publicUrl: string | null;
}

export async function uploadToS3(
  convex: ConvexReactClient,
  file: File,
  keyPrefix: string,
): Promise<UploadResult> {
  const presigned = await convex.action(api.storage.presignPut, {
    contentType: file.type,
    size: file.size,
    keyPrefix,
  });

  const res = await fetch(presigned.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`S3 upload failed (${res.status})`);
  }
  return { key: presigned.key, publicUrl: presigned.publicUrl };
}
