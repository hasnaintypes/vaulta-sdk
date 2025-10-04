import express from "express";
import multer from "multer";
// import { UploadNestClient } from "@uploadnest/client";
import { VaultaClient } from '@vaulta.dev/sdk';
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 5000;

const client = new VaultaClient({
  apiKey: process.env.VAULTA_API_KEY,
  isMultipart: true, // Use Node.js FormData
  apiUrl: "http://localhost:8000/api/v1" // or whatever your local backend URL is
});

// Use memory storage for efficient handling
const upload = multer({ storage: multer.memoryStorage() });

app.post("/api/upload", upload.array("files"), async (req, res) => {
  console.log("Received files:", req.files?.length);

  if (!req.files?.length) {
    return res.status(400).json({ error: "No files provided" });
  }

  try {
    //const uploadables = req.files.map((file) => file.buffer);

    // // Convert files to proper Uploadable format
    // Map the files to the format expected by the SDK
    const uploadables = req.files.map((file) => {
      console.log("Processing file:", {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });

      // Create a Buffer with metadata
      const buffer = file.buffer;
      buffer.name = file.originalname;
      buffer.type = file.mimetype;
      buffer.size = file.size;
      return buffer;
    });
    // console.log(
    //   "Uploading files:",
    //   uploadables.map((f) => f.name)
    // );

    // Make the upload request
    const response = await client.uploadFiles(uploadables);
    console.log(response, "resonse");
    res.json(response);
  } catch (err) {
    console.error("Upload error details:", err);
    const errorResponse = {
      error: err.name || "Upload failed",
      message: err.message,
      status: err.status || 500,
    };
    // Include additional error details if available
    if (err.data) errorResponse.details = err.data;
    res.status(errorResponse.status).json(errorResponse);
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
