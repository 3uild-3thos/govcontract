export const getDaysLeft = (futureDate: Date) => {
  const now = new Date();
  const diffMs = futureDate.getTime() - now.getTime(); // convert both to milliseconds
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)); // ms to days

  return diffDays;
};

export const getHoursLeft = (futureDate: Date) => {
  const now = new Date();
  const diffMs = futureDate.getTime() - now.getTime(); // milliseconds difference
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60)); // convert to hours

  return diffHours;
};

export function calculateVotingEndsIn(endTime: string | null): string | null {
  if (!endTime) return null;

  const now = new Date();
  const end = new Date(endTime);

  // Check if the date is valid
  if (isNaN(end.getTime())) return null;

  // Calculate difference in milliseconds
  const diff = end.getTime() - now.getTime();

  // If voting has ended
  if (diff <= 0) return "Ended";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  // const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  // Format the output based on the largest unit
  if (days > 30) {
    const months = Math.floor(days / 30);
    return `${months}mo ${days % 30}d`;
  }

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  // Always show minutes, even if 0
  return `${minutes}m`;
}

export function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;

  const date = new Date(dateStr);

  if (isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(",", "");
}

/**
 * Calculate how long ago a timestamp was
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted string like "3 days ago", "today", etc.
 */
export function calculateTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days === 0) {
    if (hours === 0) {
      if (minutes === 0) return "just now";
      if (minutes === 1) return "1 minute ago";
      return `${minutes} minutes ago`;
    }
    if (hours === 1) return "1 hour ago";
    return `${hours} hours ago`;
  }
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;

  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  if (months < 12) return `${months} months ago`;

  const years = Math.floor(days / 365);
  if (years === 1) return "1 year ago";
  return `${years} years ago`;
}
