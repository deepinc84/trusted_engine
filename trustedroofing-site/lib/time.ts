function parseTime(timestamp: string | number | Date) {
  const timeMs = new Date(timestamp).getTime();
  return Number.isFinite(timeMs) ? timeMs : Date.now();
}

export function formatRelativeTime(timestamp: string | number | Date, nowMs = Date.now()) {
  const timeMs = parseTime(timestamp);
  const diffMs = Math.max(0, nowMs - timeMs);
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"} ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function formatRelativeTimeCompact(timestamp: string | number | Date, nowMs = Date.now()) {
  const timeMs = parseTime(timestamp);
  const diffMs = Math.max(0, nowMs - timeMs);
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 10) return "now";
  if (seconds < 60) return `${seconds} sec ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
