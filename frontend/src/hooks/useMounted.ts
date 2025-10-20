import { useState, useEffect } from "react";

/**
 * Hook to track when a component has mounted on the client
 * Useful for avoiding hydration mismatches with theme detection
 * @returns boolean indicating if the component has mounted
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
