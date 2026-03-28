import path from "path";
import NodeFormData from "form-data";
import { ALLOWED_MIME_TYPES, AllowedMimeType } from "../constants";
import {
  InvalidFileError,
  NetworkError,
  UnauthorizedError,
  UploadError,
  UploadNestError,
  ValidationError,
} from "../errors";
import { BufferWithMetadata, UploadInput, VaultaClientOptions } from "../types";
import { browserRequest, nodeRequest } from "../request";

const MAX_RETRIES = 2;
const RETRY_STATUS_CODES = [502, 503, 504];

interface UploadOptions extends VaultaClientOptions {
  apiUrl: string;
}

type BrowserFormData = FormData;

function validateFileType(mimeType: string) {
  if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)) {
    throw new InvalidFileError(
      `File type '${mimeType}' is not allowed.
      Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}
      `
    );
  }
}

export async function uploadFiles(
  files: UploadInput | UploadInput[],
  options: UploadOptions
) {
  const shouldUseBrowser = options.isBrowser;

  let formData: BrowserFormData | NodeFormData;

  if (shouldUseBrowser) {
    formData = new FormData();
  } else {
    formData = new NodeFormData();
  }

  const fileArray = Array.isArray(files) ? files : [files];

  for (const file of fileArray) {
    if (typeof file === "string" && !shouldUseBrowser) {
      validateFileType(file);

      const resolved = path.resolve(file);
      if (resolved !== path.normalize(file) && !path.isAbsolute(file)) {
        throw new InvalidFileError(
          "File path must be an absolute path or a simple relative path without traversal"
        );
      }

      const { createReadStream } = await import("fs");
      const stream = createReadStream(resolved);
      (formData as NodeFormData).append("files", stream);
    } else if (
      Buffer.isBuffer(file) &&
      !shouldUseBrowser &&
      formData instanceof NodeFormData
    ) {
      const fileMetadata = file as BufferWithMetadata;
      if (fileMetadata.type) {
        validateFileType(fileMetadata.type);
      }

      formData.append("files", file, {
        filename: fileMetadata.name || "file.bin",
        contentType: fileMetadata.type || "application/octet-stream",
        knownLength: fileMetadata.size,
      });
    } else if (
      (typeof File !== "undefined" && file instanceof File) ||
      (typeof Blob !== "undefined" && file instanceof Blob)
    ) {
      if (file instanceof File) {
        validateFileType(file.type);
      }
      if (!shouldUseBrowser && formData instanceof NodeFormData) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        formData.append("files", buffer, {
          filename: file instanceof File ? file.name : "file.bin",
          contentType: file.type || "application/octet-stream",
          knownLength: buffer.length,
        });
      } else if (
        typeof FormData !== "undefined" &&
        formData instanceof FormData
      ) {
        (formData as FormData).append("files", file);
      } else {
        throw new InvalidFileError(
          "Unsupported file type for upload in Node.js environment. Please provide a Buffer, stream, or valid File/Blob."
        );
      }
    } else {
      if (shouldUseBrowser && typeof file === "string") {
        throw new InvalidFileError(
          "File paths are not supported when isBrowser is enabled. Use File objects instead."
        );
      } else if (shouldUseBrowser && file instanceof Buffer) {
        throw new InvalidFileError(
          "Buffers are not supported when isBrowser is enabled"
        );
      }
    }
  }

  const requestFn = shouldUseBrowser ? browserRequest : nodeRequest;
  const requestUrl = `${options.apiUrl}/files/upload`;
  const requestOpts = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: formData,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await requestFn(requestUrl, requestOpts);

      if (!response.ok) {
        if (
          attempt < MAX_RETRIES &&
          RETRY_STATUS_CODES.includes(response.status)
        ) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }

        switch (response.status) {
          case 400:
            throw new ValidationError("Invalid request format");
          case 401:
            throw new UnauthorizedError("Unauthorized Access");
          case 413:
            throw new UploadError("File size too large");
          case 503:
            throw new NetworkError("Service temporarily unavailable");
          default:
            throw new UploadError(
              `Upload failed: ${response.status} ${response.statusText}`
            );
        }
      }

      try {
        const data = await response.json();
        if (!data || typeof data !== "object" || !Array.isArray(data.data)) {
          throw new UploadError("Unexpected response format from server");
        }
        return data;
      } catch (parseError) {
        if (parseError instanceof UploadNestError) throw parseError;
        throw new UploadError("Invalid response from server");
      }
    } catch (error) {
      if (error instanceof UploadNestError) {
        throw error;
      }
      lastError = error instanceof Error ? error : new Error("Unknown error");
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  throw new UploadError(lastError?.message || "Unknown error occurred");
}
