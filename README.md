# @vaulta.dev/sdk

[![NPM version](https://img.shields.io/npm/v/@vaulta.dev/sdk.svg)](https://npmjs.org/package/@vaulta.dev/sdk)
![Bundle Size](https://img.shields.io/bundlephobia/minzip/@vaulta.dev/sdk)

TypeScript library for uploading files to the Vaulta API. Works in Node.js, Next.js, and browsers.

## Installation

```bash
npm install @vaulta.dev/sdk
# or
pnpm add @vaulta.dev/sdk
```

## Quick Start

```typescript
import { VaultaClient } from "@vaulta.dev/sdk";

const client = new VaultaClient({
  apiKey: "your-api-key",
});

// Upload files
const result = await client.uploadFiles(files);
console.log(result.files);
```

## Usage Examples

### Node.js - File Paths

```typescript
// Upload from file path
await client.uploadFiles("/path/to/file.jpg");

// Multiple files
await client.uploadFiles(["/path/to/file1.jpg", "/path/to/file2.pdf"]);
```

### Node.js - Buffers

```typescript
import fs from "fs";

const buffer = fs.readFileSync("image.jpg");
// Add metadata to buffer
buffer.name = "image.jpg";
buffer.type = "image/jpeg";

await client.uploadFiles(buffer);
```

### Browser/Next.js - File Objects

```typescript
// From file input
const fileInput = document.querySelector('input[type="file"]');
await client.uploadFiles(fileInput.files[0]);

// Multiple files
await client.uploadFiles(Array.from(fileInput.files));
```

### Next.js Server Actions

```typescript
// app/upload/page.tsx
import { VaultaClient } from "@vaulta.dev/sdk";

async function uploadAction(formData: FormData) {
  "use server";

  const client = new VaultaClient({
    apiKey: process.env.VAULTA_API_KEY!,
    isBrowser: true,
  });

  const file = formData.get("file") as File;
  const result = await client.uploadFiles(file);

  return result;
}
```

## Supported File Types

- **Node.js**: File paths (strings), Buffers
- **Browser**: File objects, Blob objects
- **Next.js**: File objects, Blob objects (server actions/API routes)

## Error Handling

```typescript
import { ValidationError, UploadError } from "@vaulta.dev/sdk/errors";

try {
  await client.uploadFiles(files);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log("Invalid file type:", error.message);
  } else if (error instanceof UploadError) {
    console.log("Upload failed:", error.message);
  }
}
```

## TypeScript Support

Full TypeScript support with type definitions:

```typescript
import type { UploadFileResponse } from "@vaulta.dev/sdk/types";

const result: UploadFileResponse = await client.uploadFiles(files);
```

## Requirements

- **Node.js**: 18+
- **TypeScript**: 4.5+ (optional)
- **Browsers**: Modern browsers with fetch support
- **Next.js**: 13+ (App Router recommended)

## License

Apache-2.0