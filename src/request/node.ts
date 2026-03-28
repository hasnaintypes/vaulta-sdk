import NodeFormData from "form-data";
import http, { IncomingMessage } from "http";
import https from "https";
import { UploadRequestOptions } from "../types";

const REQUEST_TIMEOUT_MS = 60_000; // 60 seconds

export async function request(
  url: string,
  options: UploadRequestOptions
): Promise<Response> {
  const formData = options.body as NodeFormData;

  const parsedUrl = new URL(url);

  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: options.method, //POST
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
      headers: {
        ...options.headers,
        ...(formData.getHeaders ? formData.getHeaders() : {}),
      },
      timeout: REQUEST_TIMEOUT_MS,
    };

    const isHttps = url.startsWith("https");
    const requestModule = isHttps ? https : http;

    const req = requestModule.request(
      requestOptions,
      (res: IncomingMessage) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          const response = {
            ok: res.statusCode
              ? res.statusCode >= 200 && res.statusCode < 300
              : false,
            status: res.statusCode || 500,
            statusText: res.statusMessage || "",
            json: async () => JSON.parse(data),
          } as Response;

          resolve(response);
        });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });

    req.on("error", (err) => {
      reject(new Error(`Request failed: ${err.message}`));
    });

    if (formData && typeof formData.pipe === "function") {
      formData.on("end", () => {});

      req.on("finish", () => {});

      formData.pipe(req);
    } else {
      req.end();
    }

    formData.on("error", () => {
      req.destroy();
      reject(new Error("Failed to prepare upload data"));
    });
  });
}
