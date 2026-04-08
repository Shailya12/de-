"use client";

import { useState, useEffect, useRef } from "react";

interface UseTypewriterOptions {
  text: string;
  speed?: number; // ms per character
  startDelay?: number;
  enabled?: boolean;
}

export function useTypewriter({
  text,
  speed = 18,
  startDelay = 0,
  enabled = true,
}: UseTypewriterOptions) {
  const [displayed, setDisplayed] = useState(enabled ? "" : text);
  const [isDone, setIsDone] = useState(!enabled);
  const indexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setDisplayed(text);
      setIsDone(true);
      return;
    }

    setDisplayed("");
    setIsDone(false);
    indexRef.current = 0;

    const delayTimeout = setTimeout(() => {
      const type = () => {
        if (indexRef.current < text.length) {
          indexRef.current += 1;
          setDisplayed(text.slice(0, indexRef.current));
          timeoutRef.current = setTimeout(type, speed);
        } else {
          setIsDone(true);
        }
      };
      type();
    }, startDelay);

    return () => {
      clearTimeout(delayTimeout);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed, startDelay, enabled]);

  const skip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDisplayed(text);
    setIsDone(true);
    indexRef.current = text.length;
  };

  return { displayed, isDone, skip };
}
