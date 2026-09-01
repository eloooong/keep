"use client";

import { useState } from "react";
import { NewKeyForm } from "@/components/keys/NewKeyForm";
import { KeyFormModal } from "@/components/keys/KeyFormModal";
import { IconButton } from "@/components/ui/IconButton";
import { Plus } from "lucide-react";

export function AddKeyButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton
        icon={<Plus size={16} />}
        ariaLabel="Add key"
        onClick={() => setOpen(true)}
      />
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
