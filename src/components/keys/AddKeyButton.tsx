"use client";

import { useState } from "react";
import { NewKeyForm } from "@/components/keys/NewKeyForm";
import { KeyFormModal } from "@/components/keys/KeyFormModal";
import { GlareHover } from "@/components/react-bits/GlareHover";

import { Glyph } from "@/components/ui/Glyph";

export function AddKeyButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="button-primary button-add-key"
        onClick={() => setOpen(true)}
      >
        <Glyph name="plus" size={19} />
        Add key
        <GlareHover />
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
