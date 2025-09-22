import { UnauthorizedError } from "./errors";
import {
  UploadInput,
  VaultaClientOptions,
  UploadResponseType,
} from "./types";
import { uploadFiles } from "./uploadFile";

const DEFAULT_API_URL = "http://localhost:8000/api/v1";

export class VaultaClient {
  private apiKey: string;
  private isBrowser: boolean;

  constructor(options: VaultaClientOptions) {
    if (!options.apiKey) throw new UnauthorizedError("API Key is required");
    this.apiKey = options.apiKey;
    this.isBrowser = options.isBrowser || false;
  }

  async uploadFiles(
    files: UploadInput | UploadInput[]
  ): Promise<UploadResponseType> {
    return uploadFiles(files, {
      apiKey: this.apiKey,
      apiUrl: DEFAULT_API_URL,
      isBrowser: this.isBrowser,
    });
  }
}
