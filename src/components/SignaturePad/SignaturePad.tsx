import { useCallback, useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import { Button } from '../Button/Button';
import styles from './SignaturePad.module.css';

export type SignaturePadProps = {
  /** Figma `Label` text property. */
  label?: string;
  /** Called with a PNG data URL of the signature when Save is pressed. */
  onSave?: (dataUrl: string) => void;
  /** Called after the pad is cleared. */
  onClear?: () => void;
  /** Called when the pad goes from empty to signed or back. */
  onSignedChange?: (signed: boolean) => void;
  /** Height of the drawing area in px (278 in Figma). */
  height?: number;
  /** Button labels. */
  clearLabel?: string;
  saveLabel?: string;
  /** Disables drawing and both buttons. */
  disabled?: boolean;
  /** Pre-drawn strokes, as lists of points in CSS px. Useful for previews and tests. */
  defaultStrokes?: { x: number; y: number }[][];
  className?: string;
};

type Point = { x: number; y: number };

/**
 * Signature Pad (Figma "Signature Pad*"). Draw with a mouse, pen or finger.
 * Figma `State=Active` is the pad while it is being signed or holds a signature.
 */
export function SignaturePad({
  label = 'Sign Below',
  onSave,
  onClear,
  onSignedChange,
  height = 278,
  clearLabel = 'Clear',
  saveLabel = 'Save',
  disabled = false,
  defaultStrokes,
  className,
}: SignaturePadProps) {
  const labelId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Point[][]>(defaultStrokes ? defaultStrokes.map(s => [...s]) : []);
  const drawing = useRef(false);
  const [signed, setSigned] = useState(strokes.current.length > 0);
  const [active, setActive] = useState(false);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cs = getComputedStyle(canvas);
    // Ink color and width come from CSS tokens (Gray Stroke/Strong, Strokes/2)
    ctx.strokeStyle = cs.color;
    ctx.lineWidth = parseFloat(cs.getPropertyValue('--ink-width')) || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const s of strokes.current) {
      if (!s.length) continue;
      ctx.beginPath();
      ctx.moveTo(s[0].x, s[0].y);
      if (s.length === 1) ctx.lineTo(s[0].x + 0.01, s[0].y);
      for (let i = 1; i < s.length - 1; i++) {
        const mx = (s[i].x + s[i + 1].x) / 2;
        const my = (s[i].y + s[i + 1].y) / 2;
        ctx.quadraticCurveTo(s[i].x, s[i].y, mx, my);
      }
      if (s.length > 1) ctx.lineTo(s[s.length - 1].x, s[s.length - 1].y);
      ctx.stroke();
    }
  }, []);

  // Match the canvas bitmap to its CSS size and pixel ratio, and redraw on theme changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height: h } = canvas.getBoundingClientRect();
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(h * dpr);
      redraw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const mo = new MutationObserver(redraw);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', redraw);
    return () => {
      ro.disconnect();
      mo.disconnect();
      mq.removeEventListener('change', redraw);
    };
  }, [redraw]);

  const point = (e: PointerEvent<HTMLCanvasElement>): Point => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const setSignedState = (next: boolean) => {
    if (next !== signed) {
      setSigned(next);
      onSignedChange?.(next);
    }
  };

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic pointers (tests) have no capturable id; drawing still works without capture
    }
    drawing.current = true;
    setActive(true);
    strokes.current.push([point(e)]);
    redraw();
  };
  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    strokes.current[strokes.current.length - 1].push(point(e));
    redraw();
  };
  const onPointerUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    setActive(false);
    setSignedState(true);
  };

  const clear = () => {
    strokes.current = [];
    redraw();
    setSignedState(false);
    onClear?.();
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (canvas && signed) onSave?.(canvas.toDataURL('image/png'));
  };

  return (
    <div
      className={[styles.signature, className].filter(Boolean).join(' ')}
      data-active={active || signed || undefined}
      data-disabled={disabled || undefined}
    >
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      <div className={styles.pad} style={{ height }}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          role="img"
          aria-labelledby={labelId}
          aria-description={signed ? 'Signed' : 'Empty. Draw a signature with a mouse, pen or finger.'}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>
      <div className={styles.actions}>
        <Button size="small" variant="outline" onClick={clear} disabled={disabled}>
          {clearLabel}
        </Button>
        <Button size="small" variant="primary" onClick={save} disabled={disabled}>
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
