import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

export type DropdownOpenProps = {
  /** Controlled open state. */
  open?: boolean;
  /** Open on first render (used by the stories to show the Figma "Active" / open states). */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Open/close logic shared by every dropdown in this folder and the other dropdown folders:
 * a button with `aria-haspopup` + `aria-expanded`, closing on outside press, Escape (returns
 * focus to the button) and Tab. `focusOnOpen` is true only when the person opened the popup,
 * so stories rendered open don't steal focus.
 */
export function useDropdown({ open, defaultOpen, onOpenChange }: DropdownOpenProps, disabled?: boolean) {
  const [inner, setInner] = useState(!!defaultOpen);
  const [focusOnOpen, setFocusOnOpen] = useState(false);
  const isOpen = !disabled && (open ?? inner);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const setOpen = (next: boolean, byUser = true) => {
    if (open === undefined) setInner(next);
    setFocusOnOpen(next && byUser);
    onOpenChange?.(next);
  };

  /** Close and put focus back on the button (Escape, Tab, or after choosing an option). */
  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false, false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  });

  const triggerProps = {
    ref: triggerRef,
    'aria-haspopup': 'listbox' as const,
    'aria-expanded': isOpen,
    onClick: () => setOpen(!isOpen),
    onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setOpen(false);
      }
    },
  };

  /** Pass to ListBox / TreeList `onDismiss`. */
  const onDismiss = () => close();

  return { isOpen, focusOnOpen, setOpen, close, onDismiss, rootRef, triggerRef, triggerProps };
}
