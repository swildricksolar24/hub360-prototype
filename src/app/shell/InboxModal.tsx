import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Avatar } from '../../components/Avatar/Avatar';
import { Badge } from '../../components/Badge/Badge';
import { IconButton } from '../../components/IconButton/IconButton';
import { AppModal } from '../components/AppModal';
import { INBOX_TITLES, SAMPLE_INBOX, senderPhoto, type InboxItem, type InboxKind } from './inbox';
import styles from './InboxModal.module.css';

/** Each item's place in the sample data, so an item whose bookmark is removed can go back to it. */
const ORDER: Record<string, number> = Object.fromEntries(
  Object.values(SAMPLE_INBOX).flatMap(list => list.map((item, index) => [item.id, index])),
);

/** Slide time for cards that change place (bookmark, archive, delete). */
const SLIDE_MS = 350;

/**
 * State for the header's Notifications, Chat and Email buttons. The badge counts unread items. Unread cards are
 * marked "New" while the list is open; closing the list marks them read.
 */
export function useInbox() {
  const [items, setItems] = useState(SAMPLE_INBOX);
  const [openKind, setOpenKind] = useState<InboxKind | null>(null);

  function update(kind: InboxKind, change: (list: InboxItem[]) => InboxItem[]) {
    setItems(all => ({ ...all, [kind]: change(all[kind]) }));
  }

  return {
    items,
    openKind,
    unread: (kind: InboxKind) => items[kind].filter(i => i.unread).length,
    open: (kind: InboxKind) => setOpenKind(kind),
    close() {
      if (openKind) update(openKind, list => list.map(i => (i.unread ? { ...i, unread: false } : i)));
      setOpenKind(null);
    },
    // A bookmarked card moves to the top of its list (latest bookmark first); removing the bookmark puts it back
    // in its original place below the other bookmarks.
    toggleBookmark: (kind: InboxKind, id: string) =>
      update(kind, list => {
        const item = list.find(i => i.id === id);
        if (!item) return list;
        const rest = list.filter(i => i.id !== id);
        if (!item.bookmarked) return [{ ...item, bookmarked: true }, ...rest];
        const others = [...rest.filter(i => !i.bookmarked), { ...item, bookmarked: false }].sort((a, b) => ORDER[a.id] - ORDER[b.id]);
        return [...rest.filter(i => i.bookmarked), ...others];
      }),
    remove: (kind: InboxKind, id: string) => update(kind, list => list.filter(i => i.id !== id)),
  };
}

export type Inbox = ReturnType<typeof useInbox>;

/** What the shell shares with the pages inside it (React Router outlet context). */
export type ShellContext = { inbox: Inbox };

/** The shell's inbox, for pages that show or open it (e.g. the Dashboard's Notifications / Chat / Email cards). */
export function useShellInbox() {
  return useOutletContext<ShellContext>().inbox;
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

export type InboxModalProps = {
  kind: InboxKind | null;
  items: InboxItem[];
  onClose: () => void;
  onToggleBookmark: (id: string) => void;
  /** Archive and Delete both take the item off the list in the prototype. */
  onRemove: (id: string) => void;
};

/**
 * Figma "_Sign In / Shell" › Communication (774:5511): the Notifications, Chat and Email dialogs, built into the
 * app's AppModal. Each row has the sender avatar (an orange bell for notifications), title, a two-line preview,
 * the time, and Bookmark / Archive / Delete buttons. Clicking a card expands it to the whole message.
 */
export function InboxModal({ kind, items, onClose, onToggleBookmark, onRemove }: InboxModalProps) {
  // After Archive / Delete, keyboard focus moves to the row that took its place (or the modal's buttons)
  const listRef = useRef<HTMLUListElement>(null);
  const [refocus, setRefocus] = useState<number | null>(null);
  useEffect(() => {
    if (refocus === null) return;
    const rows = listRef.current?.querySelectorAll('li');
    const row = rows?.[Math.min(refocus, rows.length - 1)];
    (row?.querySelector('button') ?? document.querySelector<HTMLElement>('dialog[open] button'))?.focus();
    setRefocus(null);
  }, [refocus, items]);

  // Clicking a card expands it to show the whole message and collapses the one that was open
  const [expandedId, setExpandedId] = useState<string | null>(null);
  useEffect(() => setExpandedId(null), [kind]);

  // Cards that change place slide there (FLIP): `snapshot` records each card's position before the change, then
  // after the re-render every card that moved animates from its old position to its new one. Expanding and
  // collapsing record the message heights instead and animate those; the cards below follow the height change.
  const before = useRef<{
    tops: Map<string, number>;
    heights: Map<string, number>;
    moved?: string;
    toTop?: boolean;
    resize?: boolean;
  } | null>(null);
  function snapshot({ moved, toTop, resize }: { moved?: string; toTop?: boolean; resize?: boolean } = {}) {
    const tops = new Map<string, number>();
    const heights = new Map<string, number>();
    listRef.current?.querySelectorAll<HTMLElement>('li[data-id]').forEach(li => {
      tops.set(li.dataset.id!, li.getBoundingClientRect().top);
      heights.set(li.dataset.id!, li.querySelector<HTMLElement>('[data-message]')!.offsetHeight);
    });
    before.current = { tops, heights, moved, toTop, resize };
  }
  useLayoutEffect(() => {
    const prev = before.current;
    const list = listRef.current;
    before.current = null;
    if (!prev || !list) return;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prev.resize) {
      list.querySelectorAll<HTMLElement>('li[data-id]').forEach(li => {
        const message = li.querySelector<HTMLElement>('[data-message]')!;
        const from = prev.heights.get(li.dataset.id!);
        const to = message.offsetHeight;
        const opening = li.hasAttribute('data-expanded');
        // Keep the opened card in view once it has grown
        const reveal = () => opening && li.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
        if (from === undefined || Math.abs(from - to) < 1 || reduceMotion) return void reveal();
        // A closing card keeps its full text while it shrinks; the two-line clamp comes back at the end
        if (!opening) message.style.setProperty('-webkit-line-clamp', 'unset');
        const animation = message.animate([{ height: `${from}px` }, { height: `${to}px` }], {
          duration: SLIDE_MS,
          easing: 'cubic-bezier(0.2, 0, 0, 1)',
        });
        // The timer backs up the finish event, which a hidden or throttled page may never deliver
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          message.style.removeProperty('-webkit-line-clamp');
          reveal();
        };
        animation.onfinish = animation.oncancel = finish;
        window.setTimeout(finish, SLIDE_MS + 50);
      });
      return;
    }

    // A newly bookmarked card lands at the top, so bring the top of the list into view
    if (prev.toTop) list.scrollTop = 0;
    const movedRow = prev.moved ? list.querySelector<HTMLElement>(`li[data-id="${prev.moved}"]`) : null;
    // Reordering moves the card's DOM node, which can drop focus from its Bookmark button
    if (movedRow && !movedRow.contains(document.activeElement)) {
      movedRow.querySelector<HTMLElement>('[data-action="bookmark"]')?.focus({ preventScroll: true });
    }
    if (reduceMotion) return;
    list.querySelectorAll<HTMLElement>('li[data-id]').forEach(li => {
      const top = prev.tops.get(li.dataset.id!);
      if (top === undefined) return;
      const dy = top - li.getBoundingClientRect().top;
      if (Math.abs(dy) < 1) return;
      // The bookmarked card travels above the cards it passes
      if (li === movedRow) li.style.zIndex = '1';
      const animation = li.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], {
        duration: SLIDE_MS,
        easing: 'cubic-bezier(0.2, 0, 0, 1)',
      });
      animation.onfinish = animation.oncancel = () => (li.style.zIndex = '');
    });
  }, [items, expandedId]);

  function toggleBookmark(item: InboxItem) {
    snapshot({ moved: item.id, toTop: !item.bookmarked });
    onToggleBookmark(item.id);
  }

  function toggleExpanded(id: string) {
    snapshot({ resize: true });
    setExpandedId(open => (open === id ? null : id));
  }

  // The whole card toggles, except its Bookmark / Archive / Delete buttons, and not when the click ends a text selection
  function onCardClick(e: MouseEvent<HTMLLIElement>, id: string) {
    if ((e.target as Element).closest('[data-card-actions]') || window.getSelection()?.toString()) return;
    toggleExpanded(id);
  }

  function remove(index: number, id: string) {
    snapshot();
    onRemove(id);
    setRefocus(index);
  }

  return (
    <AppModal
      open={kind !== null}
      onClose={onClose}
      title={kind ? INBOX_TITLES[kind] : ''}
      secondaryAction={{ label: 'Close', onClick: onClose }}
    >
      {items.length === 0 ? (
        <p className={`text-medium-regular ${styles.empty}`}>You're all caught up.</p>
      ) : (
        <ul ref={listRef} className={styles.list} aria-label={kind ? INBOX_TITLES[kind] : undefined}>
          {items.map((item, index) => {
            const expanded = item.id === expandedId;
            return (
              <li
                key={item.id}
                className={styles.row}
                data-id={item.id}
                data-unread={item.unread || undefined}
                data-expanded={expanded || undefined}
                onClick={e => onCardClick(e, item.id)}
              >
                <div className={styles.lead}>
                  {kind === 'notifications' ? (
                    <Avatar type="icon" icon="notification" className={styles.alertAvatar} />
                  ) : (
                    <Avatar src={senderPhoto(item.from ?? '')} initials={initialsOf(item.from ?? '')} label={item.from} />
                  )}
                </div>
                <div className={styles.text}>
                  <p className={`text-large-bold ${styles.title}`}>
                    {/* The title is the keyboard and screen-reader control for expanding; the card's click lands here too */}
                    <button type="button" className={styles.titleButton} aria-expanded={expanded} aria-controls={`inbox-message-${item.id}`}>
                      {item.title}
                    </button>
                    {item.unread && (
                      <Badge shape="pill" color="blue" className={styles.new}>
                        New
                      </Badge>
                    )}
                  </p>
                  <p id={`inbox-message-${item.id}`} className={`text-medium-regular ${styles.message}`} data-message>
                    {item.message}
                  </p>
                  <p className={`text-small-bold ${styles.time}`}>
                    {item.from && (
                      <>
                        <span className={styles.sender}>{item.from}</span>
                        {item.org && `, ${item.org}`}
                        {' · '}
                      </>
                    )}
                    {item.time}
                  </p>
                </div>
                <div className={styles.actions} data-card-actions>
                  {/* Bookmarked: the solid brand button. The label (not aria-pressed, which would draw the brand
                      button's white Selected state) tells screen readers the state. */}
                  <IconButton
                    size="compact"
                    icon="bookmark"
                    data-action="bookmark"
                    variant={item.bookmarked ? 'brand' : 'default'}
                    label={item.bookmarked ? `Remove bookmark from "${item.title}"` : `Bookmark "${item.title}"`}
                    title={item.bookmarked ? 'Remove bookmark' : 'Bookmark'}
                    onClick={() => toggleBookmark(item)}
                  />
                  <IconButton size="compact" icon="archive" label={`Archive "${item.title}"`} title="Archive" onClick={() => remove(index, item.id)} />
                  <IconButton size="compact" icon="delete" label={`Delete "${item.title}"`} title="Delete" onClick={() => remove(index, item.id)} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppModal>
  );
}
