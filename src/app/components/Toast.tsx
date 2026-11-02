import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Message, type MessageType } from '../../components/Message/Message';
import styles from './Toast.module.css';

/** How long a toast stays before it leaves on its own (paused while the pointer or focus is on it). */
const DURATION_MS = 5000;

type ToastProps = { type?: MessageType; title: ReactNode; body?: ReactNode; onClose: () => void };

/**
 * The app's notification: the design-system Message, floating at the top center of the window. It slides down from the
 * top edge, leaves on its own after 5 seconds (or when closed), and slides back up. Use it for page notices such as
 * "Toronto WH was added." Render it while there's a notice; it calls `onClose` once it has left. A new notice that
 * replaces one still showing comes down again with a fresh 5 seconds.
 */
export function Toast(props: ToastProps) {
  return <ToastView key={typeof props.title === 'string' ? props.title : undefined} {...props} />;
}

function ToastView({ type = 'success', title, body, onClose }: ToastProps) {
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused || leaving) return;
    const timer = window.setTimeout(() => setLeaving(true), DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [paused, leaving]);

  // With reduced motion there's no slide-out to wait for
  useEffect(() => {
    if (leaving && window.matchMedia('(prefers-reduced-motion: reduce)').matches) onClose();
  }, [leaving, onClose]);

  return createPortal(
    <div
      ref={ref}
      className={styles.toast}
      data-leaving={leaving || undefined}
      onAnimationEnd={e => e.target === ref.current && leaving && onClose()}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Message type={type} title={title} body={body} onClose={() => setLeaving(true)} />
    </div>,
    document.body,
  );
}
