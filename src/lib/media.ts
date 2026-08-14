import { MAX_UPLOAD_FILE_SIZE_BYTES } from "@/lib/storage";

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  aac: "audio/aac",
  m4a: "audio/mp4",
};

function getFileExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase() || "";
}

export function inferMediaMimeType(file: File) {
  return file.type || MIME_BY_EXTENSION[getFileExtension(file)] || "application/octet-stream";
}

export function isSupportedMediaFile(file: File) {
  const type = inferMediaMimeType(file);
  const extension = getFileExtension(file);
  const supportedByMime =
    type.startsWith("image/") || type.startsWith("video/") || type.startsWith("audio/");
  const supportedByExtension = Boolean(MIME_BY_EXTENSION[extension]);
  return supportedByMime || supportedByExtension;
}

export function getSafeUploadName(file: File) {
  const extension = getFileExtension(file);
  const baseName = file.name || `musa-upload.${extension || "bin"}`;
  const safeName = baseName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return safeName.includes(".") ? safeName : `${safeName}.${extension || "bin"}`;
}

export function buildUploadPath(userId: string, file: File) {
  const timestamp = Date.now();
  const random = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
  return `${userId}/${timestamp}_${random}_${getSafeUploadName(file)}`;
}

export async function normalizeFileForUpload(file: File) {
  const contentType = inferMediaMimeType(file);
  const buffer = await file.arrayBuffer();
  const blob = new Blob([buffer], { type: contentType });

  if (typeof File !== "undefined") {
    return new File([blob], getSafeUploadName(file), {
      type: contentType,
      lastModified: Date.now(),
    });
  }

  return blob;
}

export function isOversizedFile(file: File) {
  return file.size > MAX_UPLOAD_FILE_SIZE_BYTES;
}
