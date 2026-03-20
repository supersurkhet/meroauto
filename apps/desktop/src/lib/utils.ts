import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `रू ${amount.toLocaleString("en-NP")}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    matched: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    accepted: "bg-green-500/10 text-green-600 dark:text-green-400",
    in_progress: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    completed: "bg-green-500/10 text-green-600 dark:text-green-400",
    cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
    expired: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
    driver_arriving: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    driver_arrived: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    failed: "bg-red-500/10 text-red-600 dark:text-red-400",
    refunded: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  };
  return colors[status] ?? "bg-gray-500/10 text-gray-600";
}
