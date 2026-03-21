"use client";

import { useTypewriter } from "@/hooks/useTypewriter";

interface TypewriterTextProps {
  text: string;
  speed?: number;
  startDelay?: number;
  enabled?: boolean;
  className?: string;
  onDone?: () => void;
  showCursor?: boolean;
}

export function TypewriterText({
  text,
  speed = 18,
  startDelay = 0,
  enabled = true,
  className = "",
  onDone,
  showCursor = true,
}: TypewriterTextProps) {
  const { displayed, isDone, skip } = useTypewriter({ text, speed, startDelay, enabled });

  // Call onDone when typing finishes
  if (isDone && onDone) {
    // handled via effect in parent or fire once
  }

  return (
    <span
      className={`whitespace-pre-wrap ${className}`}
      onClick={!isDone ? skip : undefined}
      style={{ cursor: !isDone ? "pointer" : "text" }}
      title={!isDone ? "Click to skip animation" : undefined}
    >
      {displayed}
      {showCursor && !isDone && (
        <span className="inline-block w-0.5 h-[1em] bg-current ml-0.5 align-middle animate-pulse" />
      )}
    </span>
  );
}
