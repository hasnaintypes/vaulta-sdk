"use server";
import { VaultaClient, BufferWithMetadata } from "@vaulta.dev/sdk";

const client = new VaultaClient({
  apiKey: process.env.VAULTA_API_KEY!,
});

export async function uploadAction(formData: FormData) {
  try {
    // Get files from form data
    const files = formData.getAll("files");
    // Validate files
    if (!files || files.length === 0) {
      return { error: "No files provided" };
    }

    // Convert web File objects to Buffer for Node.js SDK
    const nodeFiles = await Promise.all(
      files.map(async (file) => {
        if (file instanceof File) {
          const buffer = Buffer.from(await file.arrayBuffer()) as BufferWithMetadata;
          buffer.name = file.name;
          buffer.type = file.type;
          buffer.size = file.size;
          return buffer;
        }
        return file;
      })
    );

    const result = await client.uploadFiles(nodeFiles);
    return result;
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}
