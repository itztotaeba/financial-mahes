"use client";

/**
 * Global Transaction Modal — dirender di layout group sehingga tombol FAB
 * mobile ("mahes:new-transaction") selalu membuka modal, dan halaman lain
 * dapat memancingnya lewat CustomEvent "mahes:open-modal".
 */
import { useEffect, useState } from "react";
import { TransactionModal } from "./TransactionModal";
import type { Transaction } from "@/types";

declare global {
  interface Window {
    /** Halaman bisa memanggil: openTransactionModal(tx?) */
    openTransactionModal?: (tx?: Transaction | null) => void;
  }
}

export function GlobalTransactionModal() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as Transaction | null | undefined;
      setEditing(detail ?? null);
      setOpen(true);
    };
    window.openTransactionModal = (tx) =>
      window.dispatchEvent(new CustomEvent("mahes:open-modal", { detail: tx ?? null }));
    window.addEventListener("mahes:open-modal", handler);
    window.addEventListener("mahes:new-transaction", handler);
    return () => {
      window.removeEventListener("mahes:open-modal", handler);
      window.removeEventListener("mahes:new-transaction", handler);
      delete window.openTransactionModal;
    };
  }, []);

  return <TransactionModal open={open} editing={editing} onClose={() => setOpen(false)} />;
}
