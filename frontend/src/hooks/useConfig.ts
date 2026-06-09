import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

export function useConfig() {
  return useQuery({ queryKey: ["config"], queryFn: () => api.getConfig() });
}
