"use client";

import { useState } from "react";
import { NewKeyForm } from "@/components/keys/NewKeyForm";
import { KeyFormModal } from "@/components/keys/KeyFormModal";

export function AddKeyButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-black/[.08] px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-white/[.15] dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        Add key
      </button>
      <KeyFormModal
        open={open}
        onClose={() => setOpen(false)}
        titleId="add-key-title"
      >
        <NewKeyForm onSubmit={() => setOpen(false)} />
      </KeyFormModal>
    </>
  );
}
