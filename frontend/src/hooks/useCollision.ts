import { createRef, useEffect, useRef, useState } from "react";

type CollisionResult = {
  isColliding: boolean;
  collidingIndices: number[];
  movingRefs: React.RefObject<HTMLDivElement | null>[];
  fixedRef: React.RefObject<HTMLDivElement | null>;
};

export function useLabelCollisions(count: number): CollisionResult {
  const movingRefs = useRef(
    Array.from({ length: count }, () => createRef<HTMLDivElement>())
  );
  const fixedRef = useRef<HTMLDivElement>(null);
  const [collidingIndices, setCollidingIndices] = useState<number[]>([]);

  useEffect(() => {
    const checkCollisions = () => {
      if (!fixedRef.current) return;

      const fixedRect = fixedRef.current.getBoundingClientRect();
      const collisions: number[] = [];

      movingRefs.current.forEach((ref, index) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();

        const isOverlapping = !(
          rect.right < fixedRect.left ||
          rect.left > fixedRect.right ||
          rect.bottom < fixedRect.top ||
          rect.top > fixedRect.bottom
        );

        if (isOverlapping) {
          collisions.push(index);
        }
      });

      setCollidingIndices(collisions);
    };

    checkCollisions();

    const handleUpdate = () => {
      requestAnimationFrame(checkCollisions);
    };

    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate);

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate);
    };
  }, []);

  return {
    isColliding: collidingIndices.length > 0,
    collidingIndices,
    movingRefs: movingRefs.current,
    fixedRef,
  };
}
