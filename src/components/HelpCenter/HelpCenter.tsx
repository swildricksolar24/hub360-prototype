import type { MouseEventHandler, ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './HelpCenter.module.css';

type Interactive = {
  /** Renders the item as a link. */
  href?: string;
  /** Renders the item as a button when there is no `href`. */
  onClick?: MouseEventHandler<HTMLElement>;
  className?: string;
};

/** Link, button or plain box, so hover and focus styles land on a real control. */
function Surface({ href, onClick, className, children }: Interactive & { children: ReactNode }) {
  if (href) {
    return (
      <a href={href} onClick={onClick} className={className}>
        {children}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {children}
      </button>
    );
  }
  return <div className={className}>{children}</div>;
}

/* ---------- Help Article Row ---------- */

export type HelpArticleRowProps = Interactive & {
  /** Figma `Title`. */
  title: string;
  /** Figma `Meta`, e.g. "Inventory · 4 min read". */
  meta?: string;
  /** Figma `Type`: compact = icon + title + meta · result = path, title, snippet and meta (search results). */
  type?: 'compact' | 'result';
  /** Figma `Path`, e.g. "Inventory › Orders". Result type only. */
  path?: string;
  /** Figma `Snippet`. Result type only. */
  snippet?: ReactNode;
  /** Leading icon for the compact type. Figma uses `document`. */
  icon?: string;
};

/** Figma "Help Article Row" (Help Center). Hover is the CSS `:hover` state. */
export function HelpArticleRow({ title, meta, type = 'compact', path, snippet, icon = 'document', ...interactive }: HelpArticleRowProps) {
  const className = [styles.card, styles.article, interactive.className].filter(Boolean).join(' ');
  return (
    <Surface {...interactive} className={className}>
      {type === 'compact' ? (
        <span className={styles.compact}>
          <Icon name={icon} size={20} />
          <span className={styles.stack}>
            <span className={styles.compactTitle}>{title}</span>
            {meta && <span className={styles.meta}>{meta}</span>}
          </span>
        </span>
      ) : (
        <span className={styles.result}>
          {path && <span className={styles.path}>{path}</span>}
          <span className={styles.resultTitle}>{title}</span>
          {snippet && <span className={styles.snippet}>{snippet}</span>}
          {meta && <span className={styles.meta}>{meta}</span>}
        </span>
      )}
    </Surface>
  );
}

/* ---------- Help Category Card ---------- */

export type HelpCategoryCardProps = Interactive & {
  /** Figma `Title`. */
  title: string;
  /** Figma `Description`. */
  description?: string;
  /** Figma `Count`, e.g. "24 articles". */
  count?: string;
  /** Icon in the teal tile. Figma uses `warehouse`. */
  icon?: string;
};

/** Figma "Help Category Card" (Help Center). Hover is the CSS `:hover` state. */
export function HelpCategoryCard({ title, description, count, icon = 'warehouse', ...interactive }: HelpCategoryCardProps) {
  const className = [styles.card, styles.category, interactive.className].filter(Boolean).join(' ');
  return (
    <Surface {...interactive} className={className}>
      <span className={styles.tile}>
        <Icon name={icon} size={24} />
      </span>
      <span className={styles.stack}>
        <span className={styles.categoryTitle}>{title}</span>
        {description && <span className={styles.meta}>{description}</span>}
      </span>
      {count && <span className={styles.count}>{count}</span>}
    </Surface>
  );
}
