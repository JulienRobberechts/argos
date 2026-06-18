export interface StorageConsistencyResult {
  orphanFiles: string[];
  missingFiles: string[];
  totalDocuments: number;
  totalStorageFiles: number;
}

export interface ICheckStorageConsistency {
  execute(): Promise<StorageConsistencyResult>;
}
