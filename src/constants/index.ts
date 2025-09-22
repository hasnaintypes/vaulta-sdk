export const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",

  // Documents
  "application/pdf",
  "application/msword", 
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 

  // Text files
  "text/plain",
  "text/csv",

  // Archives
  "application/zip",
  "application/x-zip-compressed",
  "application/x-tar",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  // Audio
  "audio/wav",
  "audio/webm",

  // Video
  "video/mp4",
  "video/webm",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
