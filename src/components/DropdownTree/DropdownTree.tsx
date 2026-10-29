import { useId, useState } from 'react';
import { Icon } from '../Icon/Icon';
import { TreeList, type TreeNode } from '../ListBox/TreeList';
import { DropdownSelectorChip } from '../DropdownSelector/DropdownSelector';
import { useDropdown, type DropdownOpenProps } from '../Dropdown/useDropdown';
import styles from './DropdownTree.module.css';

export type { TreeNode } from '../ListBox/TreeList';

export type DropdownTreeProps = DropdownOpenProps & {
  /** Groups and their items. Parents expand and collapse; leaves can be chosen. */
  nodes: TreeNode[];
  /** Accessible name of the field and its tree (Figma shows no visible label). */
  label: string;
  /** Text shown while nothing is chosen ("Select a City" in Figma). */
  placeholder?: string;
  /** Chosen leaf id. */
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (id: string | null, node?: TreeNode) => void;
  /** Parent ids expanded when the menu opens. */
  defaultExpanded?: string[];
  disabled?: boolean;
  id?: string;
  className?: string;
};

function findNode(nodes: TreeNode[], id: string | null | undefined): TreeNode | undefined {
  if (!id) return undefined;
  for (const n of nodes) {
    if (n.id === id) return n;
    const hit = findNode(n.children ?? [], id);
    if (hit) return hit;
  }
  return undefined;
}

/**
 * Figma Dropdown Tree: a field that opens a two-level tree (Dropdown Selector rows; children use
 * `State=Indent`). Choosing a leaf closes the menu and shows it as a chip in the field.
 */
export function DropdownTree({
  nodes,
  label,
  placeholder = 'Select',
  value,
  defaultValue = null,
  onChange,
  defaultExpanded = [],
  disabled = false,
  id,
  className,
  open,
  defaultOpen,
  onOpenChange,
}: DropdownTreeProps) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const treeId = `${baseId}-tree`;
  const dd = useDropdown({ open, defaultOpen, onOpenChange }, disabled);
  const [inner, setInner] = useState<string | null>(defaultValue);
  const current = value !== undefined ? value : inner;
  const chosen = findNode(nodes, current);
  const change = (next: string | null, node?: TreeNode) => {
    if (value === undefined) setInner(next);
    onChange?.(next, node);
  };

  // Open with the chosen item's parent expanded so it is visible
  const parentOfChosen = nodes.find(n => n.children?.some(c => c.id === current))?.id;
  const expanded = parentOfChosen ? [...new Set([...defaultExpanded, parentOfChosen])] : defaultExpanded;

  return (
    <div ref={dd.rootRef} className={[styles.root, className].filter(Boolean).join(' ')} data-disabled={disabled || undefined}>
      <div
        className={styles.field}
        data-has-value={chosen ? true : undefined}
        onClick={e => {
          if (e.target === e.currentTarget && !disabled) dd.triggerRef.current?.click();
        }}
      >
        {chosen && <DropdownSelectorChip label={chosen.label} disabled={disabled} onRemove={() => change(null)} />}
        <button
          type="button"
          id={baseId}
          className={styles.trigger}
          disabled={disabled}
          aria-label={chosen ? `${label}: ${chosen.label}` : label}
          aria-controls={dd.isOpen ? treeId : undefined}
          {...dd.triggerProps}
          aria-haspopup="tree"
        >
          {!chosen && <span className={styles.text}>{placeholder}</span>}
          <Icon name="chevron-down" size={24} color="currentColor" className={styles.chevron} />
        </button>
      </div>
      {dd.isOpen && (
        <div className={styles.popup}>
          <TreeList
            id={treeId}
            aria-label={label}
            appearance="selector"
            nodes={nodes}
            value={current}
            defaultExpanded={expanded}
            onChange={(nid, node) => change(nid, node)}
            onCommit={dd.close}
            onDismiss={dd.onDismiss}
            autoFocus={dd.focusOnOpen}
          />
        </div>
      )}
    </div>
  );
}
