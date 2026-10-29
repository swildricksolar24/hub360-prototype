import { useId, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import styles from './Tabs.module.css';

export type TabsSize = 'small' | 'tiny';

export type TabProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  children: ReactNode;
  /** small = Figma "Tab / Small" (32px, Large/Regular) · tiny = Figma "Tab / Tiny*" (28px, Medium/Regular). */
  size?: TabsSize;
  ref?: Ref<HTMLButtonElement>;
  /** Figma `State=Current Tab`. Rendered as `aria-selected`. */
  selected?: boolean;
};

/** One tab button (Figma "Tab / Small" and "Tab / Tiny*"). Use inside an element with `role="tablist"`. */
export function Tab({ children, size = 'small', selected = false, type = 'button', className, ...rest }: TabProps) {
  return (
    <button
      type={type}
      role="tab"
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      className={[styles.tab, className].filter(Boolean).join(' ')}
      data-size={size}
      {...rest}
    >
      <span className={styles.label}>{children}</span>
    </button>
  );
}

export type TabPanelProps = { children: ReactNode; id?: string; 'aria-labelledby'?: string; className?: string };

/** Figma "Tab Content": the panel under the tab row. */
export function TabPanel({ children, className, ...rest }: TabPanelProps) {
  return (
    <div role="tabpanel" tabIndex={0} className={[styles.panel, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  );
}

export type TabItem = { id: string; label: ReactNode; content?: ReactNode; disabled?: boolean };

export type TabsProps = {
  /** The tabs and their panels. */
  items: TabItem[];
  /** Selected tab id (controlled). */
  value?: string;
  /** Initially selected tab id (uncontrolled). Defaults to the first enabled tab. */
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** Tab size: small = "Tab / Small" · tiny = "Tab / Tiny*". */
  size?: TabsSize;
  /** Accessible name of the tab list. */
  'aria-label'?: string;
  className?: string;
};

/** Figma "Tab Bar*": a row of tabs over a "Tab Content" panel. Arrow keys, Home and End move between tabs. */
export function Tabs({ items, value, defaultValue, onChange, size = 'small', 'aria-label': ariaLabel, className }: TabsProps) {
  const baseId = useId();
  const firstEnabled = items.find(t => !t.disabled)?.id;
  const [internal, setInternal] = useState(defaultValue ?? firstEnabled);
  const current = value ?? internal;
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const select = (id: string) => {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const enabled = items.filter(t => !t.disabled);
    const index = enabled.findIndex(t => t.id === current);
    let next: TabItem | undefined;
    if (e.key === 'ArrowRight') next = enabled[(index + 1) % enabled.length];
    else if (e.key === 'ArrowLeft') next = enabled[(index - 1 + enabled.length) % enabled.length];
    else if (e.key === 'Home') next = enabled[0];
    else if (e.key === 'End') next = enabled[enabled.length - 1];
    if (!next) return;
    e.preventDefault();
    select(next.id);
    refs.current[next.id]?.focus();
  };

  const active = items.find(t => t.id === current);
  return (
    <div className={[styles.tabs, className].filter(Boolean).join(' ')}>
      <div role="tablist" aria-label={ariaLabel} className={styles.list} onKeyDown={onKeyDown}>
        {items.map(t => (
          <Tab
            key={t.id}
            ref={el => {
              refs.current[t.id] = el;
            }}
            id={`${baseId}-tab-${t.id}`}
            aria-controls={`${baseId}-panel-${t.id}`}
            size={size}
            selected={t.id === current}
            disabled={t.disabled}
            onClick={() => select(t.id)}
          >
            {t.label}
          </Tab>
        ))}
      </div>
      {active?.content !== undefined && (
        <TabPanel id={`${baseId}-panel-${active.id}`} aria-labelledby={`${baseId}-tab-${active.id}`}>
          {active.content}
        </TabPanel>
      )}
    </div>
  );
}
