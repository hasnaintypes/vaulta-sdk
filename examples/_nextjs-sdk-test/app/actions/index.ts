"use server";
import { VaultaClient } from "@vaulta.dev/sdk";

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
      files.map(async (file: any) => {
        if (typeof file.arrayBuffer === "function") {
          const buffer = Buffer.from(await file.arrayBuffer());
          // preserve name/type/size for SDK
          (buffer as any).name = file.name;
          (buffer as any).type = file.type;
          (buffer as any).size = file.size;
          return buffer;
        }
        return file;
      })
    );

    const result = await client.uploadFiles(nodeFiles);
    return result;
  } catch (error: any) {
    console.error("Server Action upload error:", error);

    return {
      error: error?.message || "Upload failed",
    };
  }
}
