import { extname } from "node:path";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 is S3-compatible. Configured via env; when unset,
// isR2Configured() returns false so ingestion / serving degrade gracefully
// (the same pattern lib/ratelimit.ts uses). Env is read lazily so the ingest
// script (which loads .env at runtime) sees it regardless of import order.
const readConfig = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  return {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET,
    endpoint:
      process.env.R2_ENDPOINT ??
      (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined),
  };
};

export const isR2Configured = (): boolean => {
  const c = readConfig();
  return Boolean(c.endpoint && c.accessKeyId && c.secretAccessKey && c.bucket);
};

let client: S3Client | null = null;
const getClient = (): { s3: S3Client; bucket: string } => {
  const c = readConfig();
  if (!c.endpoint || !c.accessKeyId || !c.secretAccessKey || !c.bucket) {
    throw new Error("R2 is not configured");
  }
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: c.endpoint,
      credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey },
      // R2 rejects the AWS SDK's default CRC32 integrity checksums — only send
      // them when a command actually requires it.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return { s3: client, bucket: c.bucket };
};

const CONTENT_TYPES: Record<string, string> = {
  ".hwp": "application/x-hwp",
  ".hwpx": "application/hwp+zip",
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
};

export const contentTypeFor = (filename: string): string =>
  CONTENT_TYPES[extname(filename).toLowerCase()] ?? "application/octet-stream";

// raw/{documentCode}/v{versionNo}{ext} — deterministic key per version, so a
// re-ingest of the same version overwrites rather than duplicating.
export const buildRawObjectKey = (
  documentCode: string,
  versionNo: number,
  filename: string
): string => `raw/${documentCode}/v${versionNo}${extname(filename).toLowerCase()}`;

export type UploadedObject = {
  key: string;
  bucket: string;
  etag: string | null;
  sizeBytes: number;
  contentType: string;
};

export const uploadRawObject = async (opts: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<UploadedObject> => {
  const { s3, bucket } = getClient();
  const res = await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: opts.key,
      Body: opts.body,
      ContentType: opts.contentType,
    })
  );
  return {
    key: opts.key,
    bucket,
    etag: res.ETag ? res.ETag.replace(/"/g, "") : null,
    sizeBytes: opts.body.byteLength,
    contentType: opts.contentType,
  };
};

// Short-lived presigned GET URL, so the browser can download the original
// straight from R2 without proxying bytes through the app.
export const getSignedDownloadUrl = async (
  key: string,
  opts?: { expiresIn?: number; filename?: string }
): Promise<string> => {
  const { s3, bucket } = getClient();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ...(opts?.filename
      ? { ResponseContentDisposition: `attachment; filename="${opts.filename}"` }
      : {}),
  });
  return getSignedUrl(s3, command, { expiresIn: opts?.expiresIn ?? 300 });
};

export const deleteObject = async (key: string): Promise<void> => {
  const { s3, bucket } = getClient();
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
};
