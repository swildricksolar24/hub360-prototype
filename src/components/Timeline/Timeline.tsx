import type { ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Timeline.module.css';

export type TimelineStepState = 'done' | 'current' | 'upcoming';
export type TimelineStepPosition = 'start' | 'middle' | 'end';

const SR_STATE: Record<TimelineStepState, string> = { done: 'completed', current: 'current step', upcoming: 'not started' };

export type TimelineConnectorProps = {
  /** Figma "Status Connector" `State`. */
  state?: 'done' | 'upcoming';
  className?: string;
};

/** Figma "Status Connector": the 2px line between steps. Decorative. */
export function TimelineConnector({ state = 'done', className }: TimelineConnectorProps) {
  return <span aria-hidden className={[styles.connector, className].filter(Boolean).join(' ')} data-state={state} />;
}

export type TimelineStepProps = {
  /** Figma `Label`. */
  label: ReactNode;
  /** Figma `State`. */
  state?: TimelineStepState;
  /** Figma `Property`: which connector halves are drawn (start = right only, end = left only). */
  position?: TimelineStepPosition;
  className?: string;
};

/** Figma "Status Step". Renders an <li>; use it inside Timeline or another <ol>. */
export function TimelineStep({ label, state = 'upcoming', position = 'middle', className }: TimelineStepProps) {
  return (
    <li className={[styles.step, className].filter(Boolean).join(' ')} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
      {position !== 'start' && <TimelineConnector state={state === 'upcoming' ? 'upcoming' : 'done'} className={styles.before} />}
      {position !== 'end' && <TimelineConnector state={state === 'done' ? 'done' : 'upcoming'} className={styles.after} />}
      <span className={styles.marker} aria-hidden>
        {state === 'done' && <Icon name="check" size={18} color="currentColor" />}
        {state === 'current' && <span className={styles.dot} />}
      </span>
      <span className={styles.label}>
        {label}
        <span className={styles.srOnly}> ({SR_STATE[state]})</span>
      </span>
    </li>
  );
}

export type TimelineProps = {
  /** Step labels, in order. */
  steps: ReactNode[];
  /** Index of the current step. Earlier steps are done, later ones upcoming. Use `steps.length` when all are done. */
  current: number;
  /** Accessible name of the list. */
  label?: string;
  className?: string;
};

/** Figma "TimeLine": a horizontal row of Status Steps joined by Status Connectors. */
export function Timeline({ steps, current, label = 'Progress', className }: TimelineProps) {
  const last = steps.length - 1;
  return (
    <ol className={[styles.timeline, className].filter(Boolean).join(' ')} aria-label={label}>
      {steps.map((step, i) => (
        <TimelineStep
          key={i}
          label={step}
          state={i < current ? 'done' : i === current ? 'current' : 'upcoming'}
          position={i === 0 ? 'start' : i === last ? 'end' : 'middle'}
          className={styles.fill}
        />
      ))}
    </ol>
  );
}
