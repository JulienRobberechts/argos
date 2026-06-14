import { S3Client } from "@aws-sdk/client-s3";
import config from "../../config";
import { FileStoragePort } from "../../domain/ports/FileStoragePort";
import { LocalFileStorage } from "./LocalFileStorage";
import { R2FileStorage } from "./R2FileStorage";

export function createFileStorage(): FileStoragePort {
  const backend = config.storage.backend;

  if (backend === "local") {
    return new LocalFileStorage(config.api.uploadDir);
  }

  if (backend === "r2") {
    const { accountId, accessKeyId, secretAccessKey, bucketName } =
      config.storage.r2;
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
    return new R2FileStorage(client, bucketName);
  }

  throw new Error(`Unsupported STORAGE_BACKEND: "${backend}"`);
}
