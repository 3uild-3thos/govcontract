import { useState, useEffect } from "react";

export function useIsBelowMd() {
  const [isBelowMd, setIsBelowMd] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false; // default for SSR
  });

  useEffect(() => {
    const checkSize = () => {
      const current = window.innerWidth < 768;
      setIsBelowMd((prev) => {
        if (prev !== current) return current;
        return prev; // avoid unnecessary state update
      });
    };

    checkSize(); // initial check

    window.addEventListener("resize", checkSize);

    return () => window.removeEventListener("resize", checkSize);
  }, []);

  return isBelowMd;
}
