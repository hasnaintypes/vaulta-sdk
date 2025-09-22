"use client";
import { useState } from "react";
import { uploadAction } from "./actions";

export default function UploadTest() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Server Action upload
  const uploadWithServerAction = async () => {
    if (!files) return;
    setResponse(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      [...files].forEach((file) => formData.append("files", file));

      const result = await uploadAction(formData);
      setResponse(result);
    } catch (error: any) {
      console.error("Server Action error:", error);
      setResponse({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // API Route upload
  const uploadWithAPI = async () => {
    if (!files) return;
    setResponse(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      [...files].forEach((file) => formData.append("files", file));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const result = await res.json();
      setResponse(result);
    } catch (error: any) {
      console.error("API Route error:", error);
      setResponse({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-center mb-6">Vaulta Test</h1>

      <input
        type="file"
        multiple
        onChange={(e) => setFiles(e.target.files)}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-100 file:text-blue-700"
      />

      {files && (
        <div className="flex gap-2 mt-4 flex-wrap">
          {Array.from(files)
            .filter((file) => file.type.startsWith("image/"))
            .map((file) => (
              <div
                key={file.name}
                className="!w-30 h-30 rounded overflow-hidden border shadow-sm"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-full"
                />
              </div>
            ))}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={uploadWithServerAction}
          disabled={!files || isLoading}
          className={`flex-1 py-2 rounded text-white ${
            !files || isLoading
              ? "bg-gray-400"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isLoading ? "Uploading..." : "Server Action"}
        </button>

        <button
          onClick={uploadWithAPI}
          disabled={!files || isLoading}
          className={`flex-1 py-2 rounded text-white ${
            !files || isLoading
              ? "bg-gray-400"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isLoading ? "Uploading..." : "API Route"}
        </button>
      </div>

      {response && (
        <div className="bg-gray-50 p-4 rounded border">
          <strong className="block mb-2">Response:</strong>
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
