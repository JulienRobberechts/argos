import config from "../../config";
import { FileStoragePort } from "../../domain/ports/FileStoragePort";
import { LocalFileStorage } from "./LocalFileStorage";

export function createFileStorage(): FileStoragePort {
  const backend = process.env.STORAGE_BACKEND ?? "local";
  if (backend === "local") {
    return new LocalFileStorage(config.api.uploadDir);
  }
  throw new Error(
    `Unsupported STORAGE_BACKEND: "${backend}". Only "local" is currently supported.`,
  );
}
