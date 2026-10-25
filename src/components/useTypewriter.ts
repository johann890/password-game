import { useEffect, useRef, useState } from 'react';

interface Options {
  typeMs?: number;
  deleteMs?: number;
  /** How long a finished word sits on screen before it is rubbed out. */
  holdMs?: number;
  /** Beat between one word clearing and the next starting. Kept short: the
   *  title is the logo, so it should not sit empty for long. */
  pauseMs?: number;
}

/**
 * Types each word out, holds it, deletes it and moves to the next — the way
 * someone cycles through passwords they might have used.
 */
export function useTypewriter(
  words: readonly string[],
  active: boolean,
  { typeMs = 80, deleteMs = 38, holdMs = 1500, pauseMs = 140 }: Options = {},
): string {
  const [text, setText] = useState(words[0] ?? '');
  const cursor = useRef({ word: 0, length: (words[0] ?? '').length, deleting: false });

  useEffect(() => {
    if (!active || words.length === 0) {
      setText(words[0] ?? '');
      return;
    }

    let timer = 0;
    const step = () => {
      const c = cursor.current;
      let delay: number;

      if (c.deleting) {
        c.length -= 1;
        if (c.length <= 0) {
          c.length = 0;
          c.deleting = false;
          c.word = (c.word + 1) % words.length;
          delay = pauseMs;
        } else {
          delay = deleteMs;
        }
      } else if (c.length >= words[c.word].length) {
        c.deleting = true;
        delay = holdMs;
      } else {
        c.length += 1;
        delay = typeMs;
      }

      setText(words[c.word].slice(0, c.length));
      timer = window.setTimeout(step, delay);
    };

    timer = window.setTimeout(step, holdMs);
    return () => window.clearTimeout(timer);
  }, [words, active, typeMs, deleteMs, holdMs, pauseMs]);

  return text;
}

/** Honours the system "reduce motion" setting. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return reduced;
}
