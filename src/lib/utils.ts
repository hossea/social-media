import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Function to merge class names using clsx and tailwind-merge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to convert a file object to a URL
export const convertFileToUrl = (file: File) => URL.createObjectURL(file);

// Function to format a date string to "MMM DD, YYYY at HH:MM AM/PM"
export function formatDateString(dateString: string) {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short", // Changed from "long" to "short" for consistency with the required format
    day: "numeric",
  };

  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString("en-US", options);

  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${formattedDate} at ${time}`;
}

// Function to format a date string based on how recent it is
export const multiFormatDateString = (timestamp: string = ""): string => {
  const timestampNum = new Date(timestamp).getTime();
  const date: Date = new Date(timestampNum);
  const now: Date = new Date();

  const diff: number = now.getTime() - date.getTime();
  const diffInSeconds: number = diff / 1000;
  const diffInMinutes: number = diffInSeconds / 60;
  const diffInHours: number = diffInMinutes / 60;
  const diffInDays: number = diffInHours / 24;

  // Updated the switch cases to handle different time ranges
  switch (true) {
    case Math.floor(diffInDays) >= 30:
      return formatDateString(timestamp);
    case Math.floor(diffInDays) === 1:
      return `${Math.floor(diffInDays)} day ago`;
    case Math.floor(diffInDays) > 1 && diffInDays < 30:
      return `${Math.floor(diffInDays)} days ago`;
    case Math.floor(diffInHours) >= 1:
      return `${Math.floor(diffInHours)} hours ago`;
    case Math.floor(diffInMinutes) >= 1:
      return `${Math.floor(diffInMinutes)} minutes ago`;
    default:
      return "Just now";
  }
};

// Function to check if a user ID is in a list of liked user IDs
export const checkIsLiked = (likeList: string[], userId: string) => {
  return likeList.includes(userId);
};
