/**
 * Formats an ISO date string into a relative human-readable string like "created 2 minutes ago".
 */
export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return "";

  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (diffSec < 10) return "created just now";
  if (diffSec < 60) return `created ${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `created ${diffMin} ${diffMin === 1 ? "minute" : "minutes"} ago`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `created ${diffHour} ${diffHour === 1 ? "hour" : "hours"} ago`;

  const diffDay = Math.floor(diffHour / 24);
  return `created ${diffDay} ${diffDay === 1 ? "day" : "days"} ago`;
}
