import type { SupabaseClient } from "@supabase/supabase-js";
import { embedGpsExifIfPossible } from "@/lib/exif";

export type StorageProvider = "supabase" | "mock";
export type ProjectPhotoStage = "before" | "tear_off_prep" | "installation" | "after" | "detail_issue";

export type UploadedProjectImage = {
  provider: StorageProvider;
  bucket: string | null;
  path: string;
  public_url: string;
  file_size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
};

export function getProjectPhotosBucketName() {
  return process.env.PROJECT_PHOTOS_BUCKET?.trim() || "project-photos";
}

export function getProjectImageStorageProvider(): StorageProvider {
  const configured = (process.env.PROJECT_IMAGE_STORAGE_PROVIDER ?? "supabase").trim().toLowerCase();
  if (configured === "supabase" || configured === "mock") return configured;
  throw new Error(`Unsupported PROJECT_IMAGE_STORAGE_PROVIDER: ${configured}`);
}

export function buildProjectPhotoPath(projectId: string, fileName: string, stage?: ProjectPhotoStage) {
  const safeName = fileName.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
  const safeStage = stage === "tear_off_prep"
    ? "tear-off-prep"
    : stage === "detail_issue"
      ? "detail-issue"
      : stage ?? "before";
  return `${projectId}/${safeStage}/${safeName}`;
}

function readPngDimensions(buffer: Buffer) {
  if (buffer.length < 24) return null;
  if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function readGifDimensions(buffer: Buffer) {
  if (buffer.length < 10) return null;
  const signature = buffer.subarray(0, 6).toString("ascii");
  if (signature !== "GIF87a" && signature !== "GIF89a") return null;
  return {
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8)
  };
}

function readJpegDimensions(buffer: Buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const segmentLength = buffer.readUInt16BE(offset + 2);

    const isSof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isSof && offset + 8 < buffer.length) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7)
      };
    }

    if (segmentLength < 2) break;
    offset += 2 + segmentLength;
  }

  return null;
}

function readWebpDimensions(buffer: Buffer) {
  if (buffer.length < 30) return null;
  if (buffer.subarray(0, 4).toString("ascii") !== "RIFF") return null;
  if (buffer.subarray(8, 12).toString("ascii") !== "WEBP") return null;

  const chunkHeader = buffer.subarray(12, 16).toString("ascii");

  if (chunkHeader === "VP8 ") {
    if (buffer.length < 30) return null;
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff
    };
  }

  if (chunkHeader === "VP8L") {
    if (buffer.length < 25) return null;
    const b0 = buffer[21];
    const b1 = buffer[22];
    const b2 = buffer[23];
    const b3 = buffer[24];
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { width, height };
  }

  if (chunkHeader === "VP8X") {
    if (buffer.length < 30) return null;
    const width = 1 + buffer.readUIntLE(24, 3);
    const height = 1 + buffer.readUIntLE(27, 3);
    return { width, height };
  }

  return null;
}

export function extractImageDimensions(buffer: Buffer, mimeType: string) {
  const mime = mimeType.toLowerCase();

  if (mime === "image/png") return readPngDimensions(buffer);
  if (mime === "image/jpeg" || mime === "image/jpg") return readJpegDimensions(buffer);
  if (mime === "image/gif") return readGifDimensions(buffer);
  if (mime === "image/webp") return readWebpDimensions(buffer);

  return readPngDimensions(buffer)
    ?? readJpegDimensions(buffer)
    ?? readGifDimensions(buffer)
    ?? readWebpDimensions(buffer);
}

export async function uploadProjectImageToSupabase(input: {
  client: SupabaseClient;
  projectId: string;
  file: File;
  latPrivate: number | null;
  lngPrivate: number | null;
}) : Promise<UploadedProjectImage> {
  const bucket = getProjectPhotosBucketName();
  const mimeType = input.file.type || "application/octet-stream";
  const arrayBuffer = await input.file.arrayBuffer();
  const originalBuffer = Buffer.from(arrayBuffer);
  const uploadBuffer = embedGpsExifIfPossible(originalBuffer, input.latPrivate, input.lngPrivate);
  const dimensions = extractImageDimensions(uploadBuffer, mimeType);
  const path = buildProjectPhotoPath(input.projectId, input.file.name);

  const { error } = await input.client.storage.from(bucket).upload(path, uploadBuffer, {
    contentType: mimeType,
    upsert: false
  });

  if (error) {
    if (error.message.toLowerCase().includes("bucket not found")) {
      throw new Error(`Storage bucket \"${bucket}\" was not found. Create it in Supabase Storage or set PROJECT_PHOTOS_BUCKET.`);
    }
    throw new Error(`Upload failed (${bucket}/${path}): ${error.message}`);
  }

  const { data } = input.client.storage.from(bucket).getPublicUrl(path);

  return {
    provider: "supabase",
    bucket,
    path,
    public_url: data.publicUrl,
    file_size: uploadBuffer.byteLength,
    mime_type: mimeType,
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null
  };
}
