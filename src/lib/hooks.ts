import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, ToastAndroid, Platform } from "react-native";
import { useApi } from "./auth";

export function confirm(title: string, message?: string, destructive = false): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: "Confirm", style: destructive ? "destructive" : "default", onPress: () => resolve(true) },
    ]);
  });
}

export function toast(message: string) {
  if (Platform.OS === "android") ToastAndroid.show(message, ToastAndroid.SHORT);
  else Alert.alert(message);
}

/**
 * Wraps a Dokploy mutation: optional confirm dialog, success toast,
 * error alert, and query invalidation on success.
 */
export function useAction(opts?: { invalidate?: unknown[][] }) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      procedure: string;
      input?: Record<string, unknown>;
      confirm?: string;
      destructive?: boolean;
      success?: string;
    }) => {
      if (v.confirm && !(await confirm(v.confirm, undefined, v.destructive))) return { skipped: true };
      await api.mutate(v.procedure, v.input);
      return { skipped: false, success: v.success };
    },
    onSuccess: (r) => {
      if (r.skipped) return;
      if (r.success) toast(r.success);
      for (const key of opts?.invalidate ?? []) qc.invalidateQueries({ queryKey: key });
    },
    onError: (e) => Alert.alert("Request failed", (e as Error).message),
  });
}
