import { useState } from "react";

/**
 * Hook to copy text to clipboard
 * @param duration Duration in milliseconds to show the copied state
 * @returns Object with copied state and copy function
 */
export const useCopyToClipboard = (duration = 1000) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, duration);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  return { copied, copyToClipboard };
};
