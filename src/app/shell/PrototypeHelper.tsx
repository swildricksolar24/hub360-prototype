import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../components/Button/Button';
import { IconButton } from '../../components/IconButton/IconButton';
import { Toggle } from '../../components/Toggle/Toggle';
import { resetHelperFlags, setHelperFlag, useAnyHelperFlag, useHelperFlag } from './helperFlags';
import styles from './AppShell.module.css';

/*
 * Helper (a prototype tool, not in Figma): controls a page offers for trying states the sample data doesn't show on its own
 * (an empty list, an offline printer, a failed print job…), mostly <HelperToggle> switches bound to helperFlags.ts.
 * A page renders <PrototypeHelper> with its controls; they appear in the shell's
 * panel, opened from the life preserver icon in the tab bar, beside All tabs. The icon is always there; on a page without a
 * helper the panel says so.
 */

type HelperSlot = { target: HTMLElement | null; register: () => () => void };
const HelperContext = createContext<HelperSlot | null>(null);

/**
 * Page side: puts this page's prototype controls into the shell's Helper panel. Several can be on screen at once (a
 * record page and its open tab); each `title` starts its own group, in the order they mount.
 */
export function PrototypeHelper({ title, children }: { title?: string; children: ReactNode }) {
  const slot = useContext(HelperContext);
  const register = slot?.register;
  useEffect(() => register?.(), [register]);
  if (!slot?.target) return null;
  return createPortal(
    <div className={styles.helperGroup} role="group" aria-label={title}>
      {title && <h3 className={`text-tiny-regular ${styles.helperGroupTitle}`}>{title}</h3>}
      {children}
    </div>,
    slot.target,
  );
}

/** One Helper switch (Volt Toggle) bound to a named flag (helperFlags.ts). */
export function HelperToggle({ flag, label }: { flag: string; label: string }) {
  const on = useHelperFlag(flag);
  return <Toggle label={label} checked={on} onChange={e => setHelperFlag(flag, e.target.checked)} />;
}

/** Shell side: the panel's state, the provider for the pages, and whether the current page has a helper. */
export function usePrototypeHelper() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const register = useCallback(() => {
    setCount(c => c + 1);
    return () => setCount(c => c - 1);
  }, []);
  const slot = useMemo(() => ({ target, register }), [target, register]);
  const available = count > 0;
  return { available, open, setOpen, slot, setTarget };
}

export function PrototypeHelperProvider({ slot, children }: { slot: HelperSlot; children: ReactNode }) {
  return <HelperContext.Provider value={slot}>{children}</HelperContext.Provider>;
}

/**
 * The panel: under the tab bar at the top right, below the helper icon. Always rendered (so pages can fill it), hidden
 * until opened. Closes on its × button, Escape or a press outside it (the icon toggles it).
 */
export function PrototypeHelperPanel({
  open,
  available,
  onClose,
  setTarget,
}: {
  open: boolean;
  /** Whether the current page offers a helper; if not, the panel says so. */
  available: boolean;
  onClose: () => void;
  setTarget: (el: HTMLDivElement | null) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const anyOn = useAnyHelperFlag();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element;
      if (!ref.current?.contains(t) && !t.closest('[data-prototype-helper-toggle]')) onClose();
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <section ref={ref} id="prototype-helper" className={styles.helper} aria-labelledby="prototype-helper-title" hidden={!open}>
      <div className={styles.helperHead}>
        <h2 id="prototype-helper-title" className="text-small-bold">
          Helper
        </h2>
        <IconButton size="compact" icon="close" label="Close Helper" onClick={onClose} />
      </div>
      <p className={`text-small-regular ${styles.helperNote}`}>Not part of the design.</p>
      {!available && <p className={`text-small-regular ${styles.helperEmpty}`}>No Settings Here</p>}
      <div ref={setTarget} className={styles.helperBody} hidden={!available} />
      {/* Any switch left on (here or on another page) can be cleared from any page */}
      {anyOn && (
        <div className={styles.helperFoot}>
          <Button size="small" variant="outline" onClick={resetHelperFlags}>
            Turn All Off
          </Button>
        </div>
      )}
    </section>
  );
}
