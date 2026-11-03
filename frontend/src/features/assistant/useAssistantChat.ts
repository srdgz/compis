import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { assistantApi } from "./api";
import type { ChatEntry } from "./api";

export function useAssistantChat() {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const nextId = useRef(1);

  const mutation = useMutation({
    mutationFn: (history: ChatEntry[]) => assistantApi.send(history),
    onSuccess: (data) => {
      setRemaining(data.remaining_today);
      setEntries((current) => [
        ...current,
        { id: nextId.current++, role: "assistant", content: data.reply, source: data.source },
      ]);
    },
  });

  const send = (text: string) => {
    const content = text.trim();
    if (!content || mutation.isPending) return;
    const next: ChatEntry[] = [...entries, { id: nextId.current++, role: "user", content }];
    setEntries(next);
    mutation.mutate(next);
  };

  const retry = () => {
    if (!mutation.isPending && entries.length > 0) mutation.mutate(entries);
  };

  const reset = () => {
    mutation.reset();
    setEntries([]);
    setRemaining(null);
  };

  return {
    entries,
    remaining,
    pending: mutation.isPending,
    error: mutation.error,
    send,
    retry,
    reset,
  };
}
