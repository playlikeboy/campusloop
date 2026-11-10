"use client";

import { type RefObject, useEffect, useState } from "react";
import { usePeopleSearch } from "./use-people-search";

const TRAILING_MENTION = /@([a-zA-Z0-9_]*)$/;

/** Suggests people while the word before the caret starts with "@". */
export function useMentionSuggestions(text: string, textareaRef: RefObject<HTMLTextAreaElement | null>) {
  // null = no "@word" at the caret.
  const [query, setQuery] = useState<string | null>(null);

  useEffect(() => {
    const cursor = textareaRef.current?.selectionStart ?? text.length;
    const match = text.slice(0, cursor).match(TRAILING_MENTION);
    setQuery(match ? match[1] : null);
  }, [text, textareaRef]);

  const { results } = usePeopleSearch(query ?? "", { enabled: query !== null, allowEmpty: true, limit: 5 });

  /** Returns the text with the partial "@que" replaced by "@username ". */
  const insert = (current: string, username: string) => {
    const at = textareaRef.current?.selectionStart ?? current.length;
    const before = current.slice(0, at).replace(TRAILING_MENTION, `@${username} `);
    textareaRef.current?.focus();
    return before + current.slice(at);
  };

  return { suggestions: query !== null ? results : [], insert };
}
