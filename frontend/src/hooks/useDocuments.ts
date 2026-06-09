import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: api.getDocuments,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, title }: { file: File; title?: string }) =>
      api.uploadDocument(file, title),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      const interval = setInterval(async () => {
        const doc = await api.getDocument(data.id);
        if (doc.status === "ready" || doc.status === "error") {
          clearInterval(interval);
          queryClient.invalidateQueries({ queryKey: ["documents"] });
        }
      }, 1500);
    },
  });
}

export function useDocumentChunks(id: string | undefined) {
  return useQuery({
    queryKey: ["documents", id, "chunks"],
    queryFn: () => api.getDocumentChunks(id!),
    enabled: !!id,
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useDocumentSummary(id: string | undefined) {
  return useQuery({
    queryKey: ["documents", id, "summary"],
    queryFn: () => api.getDocumentSummary(id!),
    enabled: !!id,
    retry: false,
  });
}

export function useGenerateDocumentSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.generateDocumentSummary(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["documents", id, "summary"] });
    },
  });
}
