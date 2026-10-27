import { useState } from "react";
import type { FormEvent } from "react";

import { useCreateExpense } from "@/features/finance/hooks";
import { useHomeContext } from "@/features/homes/context";
import { errorMessage } from "@/shared/api/http";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { Checkbox, TextField } from "@/shared/ui/Field";
import { EmptyState, ErrorNotice, Loading, PageHeader } from "@/shared/ui/Feedback";
import { useToast } from "@/shared/ui/Toast";

import { useAddItem, useRemoveItem, useShoppingItems, useShoppingList } from "./hooks";

function PurchaseDialog({
  open,
  itemIds,
  onClose,
  onDone,
}: {
  open: boolean;
  itemIds: number[];
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const createExpense = useCreateExpense();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Ponle un nombre a la compra, por ejemplo «Supermercado».");
      return;
    }
    createExpense.mutate(
      { name: name.trim(), itemIds },
      {
        onSuccess: () => {
          toast.success("Compra registrada. Ya puedes repartir el gasto.");
          setName("");
          setError(null);
          onDone();
        },
        onError: (caught) => setError(errorMessage(caught)),
      },
    );
  }

  return (
    <Dialog open={open} onClose={onClose} title="Registrar la compra">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <p>
          Vas a marcar {itemIds.length} {itemIds.length === 1 ? "elemento" : "elementos"} como
          comprados.
        </p>
        {error && <ErrorNotice message={error} />}
        <TextField
          label="Nombre del gasto"
          required
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={createExpense.isPending}>
            Registrar compra
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function ShoppingPage() {
  useDocumentTitle("Lista de la compra");
  const { homeId } = useHomeContext();
  const toast = useToast();
  const list = useShoppingList(homeId);
  const listId = list.data?.id;
  const pending = useShoppingItems(listId, false);
  const purchased = useShoppingItems(listId, true);
  const addItem = useAddItem(listId ?? 0, homeId);
  const removeItem = useRemoveItem(listId ?? 0, homeId);
  const [newItem, setNewItem] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [purchasing, setPurchasing] = useState(false);

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const name = newItem.trim();
    if (!name) return;
    addItem.mutate(name, {
      onSuccess: () => setNewItem(""),
      onError: (caught) => toast.error(errorMessage(caught)),
    });
  }

  function toggle(id: number, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, id] : current.filter((value) => value !== id),
    );
  }

  return (
    <>
      <PageHeader
        title="Lista de la compra"
        description="Apunta lo que falta y marca lo que ya has comprado."
        actions={
          <Button disabled={selected.length === 0} onClick={() => setPurchasing(true)}>
            Registrar compra{selected.length > 0 ? ` (${selected.length})` : ""}
          </Button>
        }
      />

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <TextField
            label="Añadir elemento"
            maxLength={100}
            value={newItem}
            onChange={(event) => setNewItem(event.target.value)}
          />
        </div>
        <Button type="submit" loading={addItem.isPending} disabled={listId === undefined}>
          Añadir
        </Button>
      </form>

      {(list.isPending || pending.isPending) && <Loading />}
      {pending.error && <ErrorNotice message={errorMessage(pending.error)} />}
      {pending.data && pending.data.length === 0 && (
        <EmptyState title="La lista está vacía">Añade lo que necesitéis para la casa.</EmptyState>
      )}

      <ul className="flex flex-col gap-2">
        {(pending.data ?? []).map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface px-4"
          >
            <Checkbox
              label={item.name}
              checked={selected.includes(item.id)}
              onChange={(event) => toggle(item.id, event.target.checked)}
            />
            <Button
              variant="ghost"
              aria-label={`Quitar ${item.name} de la lista`}
              onClick={() =>
                removeItem.mutate(item.id, {
                  onSuccess: () => setSelected((current) => current.filter((id) => id !== item.id)),
                  onError: (caught) => toast.error(errorMessage(caught)),
                })
              }
            >
              Quitar
            </Button>
          </li>
        ))}
      </ul>

      {purchased.data && purchased.data.length > 0 && (
        <details className="rounded-card border border-line bg-surface p-4">
          <summary className="min-h-11 cursor-pointer py-2 font-semibold">
            Comprado ({purchased.data.length})
          </summary>
          <ul className="mt-2 flex flex-col gap-1 text-muted">
            {purchased.data.map((item) => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        </details>
      )}

      <PurchaseDialog
        open={purchasing}
        itemIds={selected}
        onClose={() => setPurchasing(false)}
        onDone={() => {
          setSelected([]);
          setPurchasing(false);
        }}
      />
    </>
  );
}
