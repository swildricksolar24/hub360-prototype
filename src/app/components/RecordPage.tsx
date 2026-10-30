import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { useHref, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import { Dropdown, type DropdownProps } from '../../components/Dropdown/Dropdown';
import { Icon } from '../../components/Icon/Icon';
import { IconButton } from '../../components/IconButton/IconButton';
import { NavTier3, type NavTier3LabelProps } from '../../components/NavTier3/NavTier3';
import { Toggle } from '../../components/Toggle/Toggle';
import styles from './RecordPage.module.css';

type DropdownOption = DropdownProps['options'][number];

export type RecordSection = {
  id: string;
  label: string;
  /** The section's content; without it the page shows a "not built yet" placeholder. */
  content?: ReactNode;
};

export type RecordActionsProps = {
  /** "Actions" dropdown options; an empty list hides the dropdown. */
  options?: DropdownOption[];
  /** Hides the "Active" toggle. */
  hideActive?: boolean;
  onSave?: () => void;
  /** Hides the Save button. */
  hideSave?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  /** Hides the previous / next record arrows. */
  hideArrows?: boolean;
};

const DEFAULT_OPTIONS: DropdownOption[] = [
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'export', label: 'Export' },
  { value: 'archive', label: 'Archive' },
];

/**
 * The Tier 3 header's controls as drawn in Figma: an "Active" Toggle Button, a small "Actions" Drop Down, the brand
 * Save button and previous / next record arrows. Each can be turned off per page.
 */
export function RecordActions({
  options = DEFAULT_OPTIONS,
  hideActive,
  onSave,
  hideSave,
  onPrevious,
  onNext,
  hideArrows,
}: RecordActionsProps) {
  return (
    <>
      {!hideActive && <Toggle contained label="Active" defaultChecked />}
      {options.length > 0 && <Dropdown variant="small" label="Actions" hideLabel placeholder="Actions" options={options} />}
      {!hideSave && (
        <Button size="small" variant="brand" onClick={onSave}>
          Save
        </Button>
      )}
      {!hideArrows && (
        <>
          <IconButton size="compact" icon="chevron-left" label="Previous record" onClick={onPrevious} disabled={!onPrevious} />
          <IconButton size="compact" icon="chevron-right" label="Next record" onClick={onNext} disabled={!onNext} />
        </>
      )}
    </>
  );
}

export type RecordPageProps = {
  /** Record or page name in the header (Figma shows it in capitals, e.g. "WAREHOUSE"). */
  title: string;
  /** Icon in the header's circle. */
  icon: string;
  /** Trail after the Home icon; the last item is the current page. Items with `to` are links. */
  breadcrumb?: { label: string; to?: string }[];
  /** Element after the title, e.g. a tiny Chip. */
  tag?: ReactNode;
  /** Label / value pairs under the title (up to 4). */
  labels?: NavTier3LabelProps[];
  /** Text under the actions, e.g. "Last Modified: …". */
  meta?: ReactNode;
  /** Header controls; defaults to the Figma set (RecordActions). */
  actions?: ReactNode;
  /** Sub menu buttons; each one shows its section below the header. */
  sections: RecordSection[];
  /** Section shown first; defaults to the first one. */
  defaultSection?: string;
  /** Controlled section, for pages that switch sections themselves (e.g. a link to another section). */
  section?: string;
  onSectionChange?: (id: string) => void;
  onViewPhoto?: () => void;
};

/**
 * The framework for the app's pages: the Figma "Tier 3" header (2644:3738, design-system NavTier3) with its back
 * button, breadcrumb, record icon, title, tag, labels, actions and sub menu, then the selected section's content.
 * The double chevron collapses the header to one row. Build new pages on this and pass the sections' content.
 */
export function RecordPage({
  title,
  icon,
  breadcrumb = [],
  tag,
  labels,
  meta,
  actions = <RecordActions />,
  sections,
  defaultSection,
  section: sectionProp,
  onSectionChange,
  onViewPhoto,
}: RecordPageProps) {
  const navigate = useNavigate();
  const homeTo = '/app';
  const homeHref = useHref(homeTo);
  const [collapsed, setCollapsed] = useState(false);
  const [sectionState, setSectionState] = useState(defaultSection ?? sections[0]?.id);
  const sectionId = sectionProp ?? sectionState;
  function setSectionId(id: string) {
    setSectionState(id);
    onSectionChange?.(id);
  }
  const section = sections.find(s => s.id === sectionId) ?? sections[0];

  const pageName = breadcrumb.at(-1)?.label ?? title;
  useEffect(() => {
    document.title = `${pageName} · HUB 360`;
  }, [pageName]);

  // Back goes to the previous page in the app, or Home when the page was opened directly
  function back() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate(homeTo);
  }

  // NavTier3's Breadcrumb renders plain links; send plain clicks through React Router so open tabs survive
  // (Ctrl / Cmd / Shift clicks still open the real href in a new browser tab or window)
  const plainClick = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
  function go(e: MouseEvent, to: string) {
    if (!plainClick(e)) return;
    e.preventDefault();
    navigate(to);
  }
  // The Home icon link has no onClick prop, so it is caught here
  function onClickCapture(e: MouseEvent<HTMLDivElement>) {
    const link = (e.target as Element).closest('a');
    if (link?.getAttribute('href') === homeHref) go(e, homeTo);
  }
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <div className={styles.page} onClickCapture={onClickCapture}>
      <NavTier3
        title={title}
        icon={icon}
        onViewPhoto={onViewPhoto}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        onBack={back}
        homeHref={homeHref}
        breadcrumb={breadcrumb.map(({ label, to }) =>
          to ? { label, href: `${base}${to}`, onClick: (e: MouseEvent<HTMLAnchorElement>) => go(e, to) } : { label },
        )}
        tag={tag}
        labels={labels}
        actions={actions}
        meta={meta}
        items={sections.map(({ id, label }) => ({ id, label }))}
        value={section?.id}
        onChange={setSectionId}
      />
      {section && (
        <section className={styles.content} aria-label={section.label}>
          {section.content ?? (
            <div className={styles.placeholder}>
              <Icon name={icon} size={32} />
              <p>{section.label} hasn’t been built yet.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
