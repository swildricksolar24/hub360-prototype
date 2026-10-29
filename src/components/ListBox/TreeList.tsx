import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { ListBoxItem, moveIndex, type ListBoxAppearance } from './ListBox';
import styles from './ListBox.module.css';

export type TreeNode = {
  id: string;
  label: string;
  children?: TreeNode[];
  disabled?: boolean;
  /** Draw the row as List Item / Avatar or / Checkbox instead of / Default (leaves only). */
  type?: 'default' | 'avatar' | 'checkbox';
  avatarSrc?: string;
  initials?: string;
};

export type TreeListProps = {
  nodes: TreeNode[];
  /** list = Figma "Tree List" (List Item / Tree rows) · selector = Dropdown Tree's Dropdown Selector rows. */
  appearance?: ListBoxAppearance;
  /** Selected node id. */
  value?: string | null;
  onChange?: (id: string, node: TreeNode) => void;
  /** leaf = only nodes without children can be chosen (parents toggle). all = any node. */
  selectable?: 'leaf' | 'all';
  /** Ids expanded on first render. */
  defaultExpanded?: string[];
  /** Fires after a node is chosen with click, Enter or Space. */
  onCommit?: (node: TreeNode) => void;
  /** Escape or Tab. */
  onDismiss?: (reason: 'escape' | 'tab') => void;
  /** Move focus to the selected (or first) row on mount. */
  autoFocus?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  id?: string;
  className?: string;
};

type Row = { node: TreeNode; level: number; parent?: string; setSize: number; pos: number };

function flatten(nodes: TreeNode[], expanded: Set<string>, level = 0, parent?: string, out: Row[] = []) {
  nodes.forEach((node, i) => {
    out.push({ node, level, parent, setSize: nodes.length, pos: i + 1 });
    if (node.children?.length && expanded.has(node.id)) flatten(node.children, expanded, level + 1, node.id, out);
  });
  return out;
}

/**
 * Figma ListBox › Tree List (and the open list of Dropdown Tree). A `role="tree"` with roving focus:
 * ↑/↓ move, → expands or enters, ← collapses or goes to the parent, Enter/Space chooses.
 */
export function TreeList({
  nodes,
  appearance = 'list',
  value,
  onChange,
  selectable = 'leaf',
  defaultExpanded = [],
  onCommit,
  onDismiss,
  autoFocus,
  id,
  className,
  ...aria
}: TreeListProps) {
  const autoId = useId();
  const treeId = id ?? autoId;
  const [expanded, setExpanded] = useState(() => new Set(defaultExpanded));
  const rows = flatten(nodes, expanded);
  const [active, setActive] = useState<string | undefined>(() => (rows.find(r => r.node.id === value) ?? rows[0])?.node.id);
  const refs = useRef(new Map<string, HTMLLIElement>());
  const activeId = rows.some(r => r.node.id === active) ? active : rows[0]?.node.id;

  useEffect(() => {
    if (autoFocus && activeId) refs.current.get(activeId)?.focus();
  }, []);

  // A row that should get focus once it exists (it may only render after an expand)
  const pendingFocus = useRef<string | null>(null);
  useEffect(() => {
    const rid = pendingFocus.current;
    if (rid && refs.current.has(rid)) {
      pendingFocus.current = null;
      refs.current.get(rid)?.focus();
    }
  });

  const focusRow = (rid: string | undefined) => {
    if (!rid) return;
    setActive(rid);
    const el = refs.current.get(rid);
    if (el) el.focus();
    else pendingFocus.current = rid;
  };

  const toggle = (rid: string, open?: boolean) =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (open ?? !next.has(rid)) next.add(rid);
      else next.delete(rid);
      return next;
    });

  const activate = (row: Row) => {
    const { node } = row;
    if (node.disabled) return;
    setActive(node.id);
    const isParent = !!node.children?.length;
    if (isParent) toggle(node.id);
    if (!isParent || selectable === 'all') {
      onChange?.(node.id, node);
      onCommit?.(node);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const i = Math.max(0, rows.findIndex(r => r.node.id === activeId));
    const row = rows[i];
    if (!row) return;
    const isEnabled = (r: Row) => !r.node.disabled;
    const hasKids = !!row.node.children?.length;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusRow(rows[moveIndex(rows, i, 1, isEnabled)].node.id);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusRow(rows[moveIndex(rows, i, -1, isEnabled)].node.id);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (hasKids && !expanded.has(row.node.id)) toggle(row.node.id, true);
        else if (hasKids) focusRow(row.node.children![0].id);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (hasKids && expanded.has(row.node.id)) toggle(row.node.id, false);
        else if (row.parent) focusRow(row.parent);
        break;
      case 'Home':
        e.preventDefault();
        focusRow(rows[0]?.node.id);
        break;
      case 'End':
        e.preventDefault();
        focusRow(rows[rows.length - 1]?.node.id);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        activate(row);
        break;
      case 'Escape':
        if (onDismiss) {
          e.preventDefault();
          e.stopPropagation();
          onDismiss('escape');
        }
        break;
      case 'Tab':
        onDismiss?.('tab');
        break;
    }
  };

  return (
    <ul
      id={treeId}
      role="tree"
      className={[styles.listbox, className].filter(Boolean).join(' ')}
      data-appearance={appearance}
      data-tree
      onKeyDown={onKeyDown}
      {...aria}
    >
      {rows.map(row => {
        const { node, level } = row;
        const isParent = !!node.children?.length;
        const isOpen = expanded.has(node.id);
        return (
          <ListBoxItem
            key={node.id}
            id={`${treeId}-${node.id}`}
            ref={el => {
              if (el) refs.current.set(node.id, el);
              else refs.current.delete(node.id);
            }}
            role="treeitem"
            appearance={appearance}
            type={isParent ? 'tree' : (node.type ?? (appearance === 'selector' ? 'tree' : 'default'))}
            label={node.label}
            level={level}
            expanded={isParent ? isOpen : undefined}
            selected={node.id === value}
            disabled={node.disabled}
            avatarSrc={node.avatarSrc}
            initials={node.initials}
            aria-level={level + 1}
            aria-setsize={row.setSize}
            aria-posinset={row.pos}
            aria-expanded={isParent ? isOpen : undefined}
            aria-selected={node.id === value}
            tabIndex={node.id === activeId ? 0 : -1}
            onClick={() => activate(row)}
          />
        );
      })}
    </ul>
  );
}
