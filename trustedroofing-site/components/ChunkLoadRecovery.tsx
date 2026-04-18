"use client";

import { useEffect } from "react";

const RETRY_KEY = "trusted_chunk_retry_once";

function isChunkLoadFailure(reason: unknown) {
  const text = typeof reason === "string"
    ? reason
    : reason instanceof Error
      ? reason.message
      : typeof reason === "object" && reason !== null && "message" in reason
        ? String((reason as { message?: unknown }).message ?? "")
        : "";

  const lowered = text.toLowerCase();
  return (
    lowered.includes("chunkloaderror") ||
    lowered.includes("loading chunk") ||
    lowered.includes("failed to fetch dynamically imported module") ||
    lowered.includes("dynamically imported module")
  );
}

function reloadOnce() {
  if (typeof window === "undefined") return;
  const alreadyRetried = window.sessionStorage.getItem(RETRY_KEY) === "1";
  if (alreadyRetried) return;
  window.sessionStorage.setItem(RETRY_KEY, "1");
  window.location.reload();
}

export default function ChunkLoadRecovery() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (isChunkLoadFailure(event.error ?? event.message)) {
        reloadOnce();
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadFailure(event.reason)) {
        reloadOnce();
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    const path = window.location.pathname;
    if (!path.startsWith("/_next/")) {
      window.sessionStorage.removeItem(RETRY_KEY);
    }

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
