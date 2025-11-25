"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import ReactDOM from "react-dom";

type DialogContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

type DialogProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
};

export function Dialog({ open: controlledOpen, defaultOpen = false, onOpenChange, children }: DialogProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolled;
  const setOpen = (v: boolean) => {
    if (!isControlled) setUncontrolled(v);
    onOpenChange?.(v);
  };
  const value = useMemo(() => ({ open, setOpen }), [open]);
  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({ asChild = false, children }: { asChild?: boolean; children: React.ReactElement }) {
  const ctx = useDialog();
  if (asChild) {
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent) => {
        children.props.onClick?.(e);
        ctx.setOpen(true);
      },
    });
  }
  return (
    <button type="button" onClick={() => ctx.setOpen(true)}>
      {children}
    </button>
  );
}

export function DialogContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ctx = useDialog();
  if (!ctx.open) return null;
  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => ctx.setOpen(false)} />
      <div
        className={`relative z-10 w-full max-w-md rounded-2xl bg-white p-4 shadow-xl ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
  if (typeof document === "undefined") return content;
  return ReactDOM.createPortal(content, document.body);
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 flex items-start justify-between gap-2">{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold text-slate-900">{children}</h3>;
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-600">{children}</p>;
}

function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("Dialog components must be used inside <Dialog>");
  return ctx;
}
