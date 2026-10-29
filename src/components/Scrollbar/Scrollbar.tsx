import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Scrollbar.module.css';

export type ScrollbarProps = {
  children: ReactNode;
  /** Height of the scroll area (number = px, or any CSS length). Content taller than this scrolls. */
  height?: number | string;
  /** Accessible name of the scroll region. The region is focusable so keyboard users can scroll it. */
  label?: string;
  /** Pixels scrolled by the up / down chevrons. */
  step?: number;
  className?: string;
  /** Class for the scrolling content box. */
  contentClassName?: string;
};

/**
 * A scroll area with the Figma "Scrollbar" (12px track with up / down chevrons) in place of the native one.
 * The custom bar is pointer-only and hidden from assistive tech; keyboard and wheel scrolling stay native.
 */
export function Scrollbar({ children, height, label = 'Scrollable content', step = 40, className, contentClassName }: ScrollbarProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ size: 1, offset: 0 });

  const update = useCallback(() => {
    const el = viewport.current;
    if (!el) return;
    const size = el.scrollHeight > 0 ? el.clientHeight / el.scrollHeight : 1;
    setThumb({ size, offset: el.scrollHeight > 0 ? el.scrollTop / el.scrollHeight : 0 });
  }, []);

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    Array.from(el.children).forEach(child => ro.observe(child));
    return () => ro.disconnect();
  }, [update, children]);

  const scrollBy = (dir: 1 | -1) => viewport.current?.scrollBy({ top: dir * step, behavior: 'smooth' });

  const onThumbDown = (e: PointerEvent<HTMLDivElement>) => {
    const el = viewport.current;
    const tr = track.current;
    if (!el || !tr) return;
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startTop = el.scrollTop;
    const ratio = el.scrollHeight / tr.clientHeight;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    const move = (ev: globalThis.PointerEvent) => (el.scrollTop = startTop + (ev.clientY - startY) * ratio);
    const up = () => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
  };

  const onTrackDown = (e: PointerEvent<HTMLDivElement>) => {
    const el = viewport.current;
    const tr = track.current;
    if (!el || !tr) return;
    const rect = tr.getBoundingClientRect();
    const pos = (e.clientY - rect.top) / rect.height;
    el.scrollTo({ top: pos * el.scrollHeight - el.clientHeight / 2, behavior: 'smooth' });
  };

  const scrollable = thumb.size < 1;
  const style: CSSProperties = { height };
  const thumbStyle: CSSProperties = { top: `${thumb.offset * 100}%`, height: `${thumb.size * 100}%` };

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')} style={style}>
      <div ref={viewport} className={[styles.viewport, contentClassName].filter(Boolean).join(' ')} tabIndex={0} role="region" aria-label={label} onScroll={update}>
        {children}
      </div>
      <div className={styles.bar} aria-hidden data-scrollable={scrollable || undefined}>
        <button type="button" tabIndex={-1} className={styles.step} onClick={() => scrollBy(-1)}>
          <Icon name="chevron-up" size={12} />
        </button>
        <div ref={track} className={styles.track} onPointerDown={onTrackDown}>
          {scrollable && <div className={styles.thumb} style={thumbStyle} onPointerDown={onThumbDown} />}
        </div>
        <button type="button" tabIndex={-1} className={styles.step} onClick={() => scrollBy(1)}>
          <Icon name="chevron-down" size={12} />
        </button>
      </div>
    </div>
  );
}
