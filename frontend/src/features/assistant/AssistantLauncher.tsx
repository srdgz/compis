import { Bot, RotateCcw, Send, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

import { errorMessage } from "@/shared/api/http";
import { cx } from "@/shared/lib/format";
import { Button } from "@/shared/ui/Button";
import { ErrorNotice } from "@/shared/ui/Feedback";
import { LoadingDots } from "@/shared/ui/LoadingDots";

import { MAX_MESSAGE_LENGTH } from "./api";
import type { ChatEntry } from "./api";
import { useAssistantChat } from "./useAssistantChat";

const SUGGESTIONS = [
  "¿Cuánto debo?",
  "¿Quién me debe?",
  "¿Qué tareas tengo?",
  "¿Qué hay en la lista de la compra?",
];

function Message({ entry }: { entry: ChatEntry }) {
  const mine = entry.role === "user";
  return (
    <li className={cx("flex flex-col gap-1", mine ? "items-end" : "items-start")}>
      <p
        className={cx(
          "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3",
          mine ? "rounded-br-md bg-brand text-on-brand" : "rounded-bl-md bg-mint text-ink",
        )}
      >
        <span className="sr-only">{mine ? "Tú: " : "Compi: "}</span>
        {entry.content}
      </p>
      {entry.source === "fallback" && <p className="px-2 text-xs text-muted">Resumen automático</p>}
    </li>
  );
}

function trackVisualViewport(dialog: HTMLDialogElement) {
  const viewport = window.visualViewport;
  if (!viewport) return () => undefined;
  const update = () => {
    dialog.style.setProperty("--vv-height", `${viewport.height}px`);
    dialog.style.setProperty("--vv-top", `${viewport.offsetTop}px`);
  };
  update();
  viewport.addEventListener("resize", update);
  viewport.addEventListener("scroll", update);
  return () => {
    viewport.removeEventListener("resize", update);
    viewport.removeEventListener("scroll", update);
    dialog.style.removeProperty("--vv-height");
    dialog.style.removeProperty("--vv-top");
  };
}

export function AssistantLauncher() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const chat = useAssistantChat();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();
  const inputId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
    const fine = window.matchMedia?.("(pointer: fine)").matches ?? true;
    (fine ? inputRef.current : titleRef.current)?.focus();
    return trackVisualViewport(dialog);
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const closeOnBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) setOpen(false);
    };
    dialog.addEventListener("click", closeOnBackdrop);
    return () => dialog.removeEventListener("click", closeOnBackdrop);
  }, []);

  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    const last = chat.entries[chat.entries.length - 1];
    const latest = log.querySelector("ol > li:last-child");
    if (last?.role === "assistant" && latest && !chat.pending && !chat.error) {
      latest.scrollIntoView?.({ block: "start" });
    } else {
      log.scrollTop = log.scrollHeight;
    }
  }, [chat.entries, chat.pending, chat.error]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!draft.trim() || chat.pending) return;
    chat.send(draft);
    setDraft("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  const empty = chat.entries.length === 0;

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-30 inline-flex h-14 min-w-14 items-center justify-center gap-2 rounded-full border-2 border-brand bg-brand px-4 font-semibold text-on-brand shadow-pop hover:opacity-90 lg:bottom-6 lg:right-6"
      >
        <Bot aria-hidden="true" size={26} />
        <span className="sr-only lg:not-sr-only">Compi</span>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        className="assistant-drawer flex-col overflow-hidden bg-surface p-0 text-ink shadow-pop open:flex"
      >
        <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-3">
          <h2 id={titleId} ref={titleRef} tabIndex={-1} className="text-xl outline-none">
            Compi
          </h2>
          <div className="flex items-center gap-1">
            {!empty && (
              <Button
                variant="ghost"
                iconOnly
                aria-label="Nueva conversación"
                title="Nueva conversación"
                onClick={chat.reset}
              >
                <RotateCcw aria-hidden="true" size={20} />
              </Button>
            )}
            <Button
              variant="ghost"
              iconOnly
              aria-label="Cerrar Compi"
              onClick={() => setOpen(false)}
            >
              <X aria-hidden="true" size={22} />
            </Button>
          </div>
        </div>

        <div
          ref={logRef}
          role="log"
          aria-live="polite"
          aria-label="Conversación"
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-5 py-4"
        >
          {empty && (
            <div className="flex flex-col gap-4">
              <p>
                Soy Compi. Pregúntame qué tienes pendiente en casa. Solo leo tus datos, no cambio
                nada.
              </p>
              <ul className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <li key={suggestion}>
                    <Button
                      variant="secondary"
                      className="min-h-11 text-left"
                      onClick={() => chat.send(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!empty && (
            <ol className="flex flex-col gap-3">
              {chat.entries.map((entry) => (
                <Message key={entry.id} entry={entry} />
              ))}
            </ol>
          )}
          {chat.pending && (
            <p
              role="status"
              className="inline-flex w-fit items-center gap-2 rounded-2xl rounded-bl-md bg-mint px-4 py-3 text-ink"
            >
              Pensando
              <LoadingDots />
            </p>
          )}
          {chat.error && (
            <div className="flex flex-col items-start gap-3">
              <ErrorNotice message={errorMessage(chat.error)} />
              <Button variant="secondary" onClick={chat.retry}>
                Reintentar
              </Button>
            </div>
          )}
        </div>

        <form
          onSubmit={submit}
          className="flex flex-col gap-2 border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
        >
          <label
            htmlFor={inputId}
            className="text-sm font-semibold [@media(max-height:500px)]:sr-only"
          >
            Tu pregunta
          </label>
          <div className="flex items-end gap-2">
            <textarea
              id={inputId}
              ref={inputRef}
              value={draft}
              rows={2}
              maxLength={MAX_MESSAGE_LENGTH}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              className="min-h-12 flex-1 resize-none rounded-2xl border-2 border-control bg-surface px-4 py-2 text-base text-ink"
            />
            <Button
              type="submit"
              iconOnly
              aria-label="Enviar"
              loading={chat.pending}
              disabled={!draft.trim()}
            >
              <Send aria-hidden="true" size={20} />
            </Button>
          </div>
          <p className="text-xs text-muted [@media(max-height:500px)]:hidden">
            Las respuestas se generan automáticamente con los datos de tu casa. Comprueba los
            importes importantes en Gastos.
            {chat.remaining !== null && ` Te quedan ${chat.remaining} preguntas hoy.`}
          </p>
        </form>
      </dialog>
    </>
  );
}
