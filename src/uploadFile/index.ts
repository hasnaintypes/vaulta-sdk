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
import { UploadInput, VaultaClientOptions } from "../types";
import { browserRequest, nodeRequest } from "../request";

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

      const { createReadStream } = await import("fs");
      const stream = createReadStream(file);
      (formData as NodeFormData).append("files", stream);
    } else if (
      Buffer.isBuffer(file) &&
      !shouldUseBrowser &&
      formData instanceof NodeFormData
    ) {
      const fileMetadata = file as any;
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
        console.log(file.name); // Safe: File has 'name'
      } else {
        // file is a Blob, which does not have 'name'
        console.log("No file name available");
      }
      if (!shouldUseBrowser && formData instanceof NodeFormData) {
        // Node.js: convert File/Blob to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log(
          "Appending file to formData. Type:",
          Object.prototype.toString.call(file),
          "Keys:",
          Object.keys(file)
        );
        formData.append("files", buffer, {
          filename: file instanceof File ? file.name : "file.bin",
          contentType: file.type || "application/octet-stream",
          knownLength: buffer.length,
        });
      } else if (
        typeof FormData !== "undefined" &&
        formData instanceof FormData
      ) {
        // Browser: use as is
        console.log(
          "Appending file to browser FormData. Type:",
          Object.prototype.toString.call(file),
          "Keys:",
          Object.keys(file)
        );
        (formData as FormData).append("files", file);
      } else {
        // Unknown type in Node.js, throw error
        console.error(
          "Unsupported file type for upload in Node.js environment.",
          {
            type: Object.prototype.toString.call(file),
            keys: Object.keys(file),
            value: file,
          }
        );
        throw new InvalidFileError(
          `Unsupported file type for upload in Node.js environment. Got: ${Object.prototype.toString.call(
            file
          )}. Keys: ${Object.keys(
            file
          )}. Please provide a Buffer, stream, or valid File/Blob.`
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
      //throw new InvalidFileError("Invalid File")
    }
  }

  try {
    const response = await (shouldUseBrowser ? browserRequest : nodeRequest)(
      `${options.apiUrl}/files/upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new ValidationError("Invalid request format");
        case 401:
          throw new UnauthorizedError("Unathorized Access");
        case 413:
          throw new UploadError("File size too large");
        case 503:
          throw new NetworkError("Service temporarily unavailable");
        default:
          throw new UploadError(
            `Upload failed: ${response.status}
            ${response.statusText}`
          );
      }
    }

    return response.json();
  } catch (error) {
    if (error instanceof UploadNestError) {
      throw error;
    }
    throw new UploadError(
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
}
