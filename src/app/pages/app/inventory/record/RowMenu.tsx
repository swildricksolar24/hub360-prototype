import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { ContextMenu } from '../../../../../components/ContextMenu/ContextMenu';
import table from '../table.module.css';

/**
 * A row's ••• menu (text-only options), under its button; clicking anywhere else closes it. It's placed against the window (fixed), so a
 * table's scroll area can't clip it, and it opens upward when there's no room below the button.
 */
export function RowMenu({
  label,
  items,
  onClose,
}: {
  label: string;
  /** Text-only options: the row menus don't show icons. A disabled option shows dimmed and can't be chosen. */
  items: { label: string; onSelect: () => void; disabled?: boolean }[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Set before the first paint (useLayoutEffect), so the menu never shows unplaced and can take focus right away
  const [place, setPlace] = useState<CSSProperties>({});

  useEffect(() => {
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node) && !(e.target as Element).closest('[aria-label^="More actions"]')) onClose();
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [onClose]);

  useLayoutEffect(() => {
    const menu = ref.current;
    if (!menu) return;
    // The row's own ••• button: the nearest one around the menu (the menu renders beside its row)
    let scope = menu.parentElement;
    while (scope && !scope.querySelector('[aria-label^="More actions"]')) scope = scope.parentElement;
    const button = scope?.querySelector('[aria-label^="More actions"]');
    if (!button) return;
    const position = () => {
      const b = button.getBoundingClientRect();
      const gap = 4; // px between the button and the menu (the --space-4 value; inline placement needs a number)
      const below = b.bottom + gap + menu.offsetHeight <= window.innerHeight;
      setPlace({
        right: window.innerWidth - b.right,
        ...(below ? { top: b.bottom + gap } : { bottom: window.innerHeight - b.top + gap }),
      });
    };
    position();
    // Keep it with its button while the page or the table scrolls, or the window resizes
    window.addEventListener('scroll', position, true);
    window.addEventListener('resize', position);
    return () => {
      window.removeEventListener('scroll', position, true);
      window.removeEventListener('resize', position);
    };
  }, []);

  return (
    <div ref={ref} className={table.rowMenu} style={place}>
      <ContextMenu
        aria-label={`Actions for ${label}`}
        autoFocus
        onClose={onClose}
        items={items.map(item => ({
          ...item,
          onSelect: () => {
            onClose();
            item.onSelect();
          },
        }))}
      />
    </div>
  );
}
