import { VaultaClient } from "@vaulta.dev/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new VaultaClient({
  apiKey: process.env.VAULTA_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    // Get form data from request
    const formData = await request.formData();
    const files = formData.getAll("files");

    // Validate files
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Convert web File objects to Buffer for Node.js SDK
    const nodeFiles = await Promise.all(
      files.map(async (file: any) => {
        if (typeof file.arrayBuffer === "function") {
          const buffer = Buffer.from(await file.arrayBuffer());
          (buffer as any).name = file.name;
          (buffer as any).type = file.type;
          (buffer as any).size = file.size;
          return buffer;
        }
        return file;
      })
    );

    const result = await client.uploadFiles(nodeFiles);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Upload API error:", error);

    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
