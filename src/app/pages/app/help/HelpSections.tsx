import { useState, type FormEvent } from 'react';
import { Accordion } from '../../../../components/Accordion/Accordion';
import { Badge, type BadgeColor } from '../../../../components/Badge/Badge';
import { Button } from '../../../../components/Button/Button';
import { Checkbox } from '../../../../components/Checkbox/Checkbox';
import { Dropdown } from '../../../../components/Dropdown/Dropdown';
import { HelpArticleRow, HelpCategoryCard } from '../../../../components/HelpCenter/HelpCenter';
import { Icon } from '../../../../components/Icon/Icon';
import { Message } from '../../../../components/Message/Message';
import { Progress } from '../../../../components/Progress/Progress';
import { SearchInput } from '../../../../components/SearchBar/SearchBar';
import { Tag } from '../../../../components/Tag/Tag';
import { TextArea } from '../../../../components/TextArea/TextArea';
import { TextInput } from '../../../../components/TextInput/TextInput';
import { Timeline } from '../../../../components/Timeline/Timeline';
import {
  FAQS,
  GUIDES,
  RELEASES,
  SUPPORT,
  TICKET_STEPS,
  TOPICS,
  VIDEOS,
  type Guide,
  type HelpTopic,
  type Ticket,
  type TicketStatus,
  type Video,
} from './helpContent';
import styles from './HelpSections.module.css';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

const topicIcon = (topic: HelpTopic) => TOPICS.find(t => t.id === topic)?.icon ?? 'document';

function Heading({ title, children }: { title: string; children?: string }) {
  return (
    <div className={styles.heading}>
      <h2 className="text-heading-4-bold">{title}</h2>
      {children && <p className="text-medium-regular">{children}</p>}
    </div>
  );
}

/* ---------- Getting Started ---------- */

const CHECKLIST = [
  'Add a photo and your phone number in Account Settings',
  'Find your warehouse in Inventory › Warehouses',
  'Look up an item and check its stock',
  'Receive your first purchase order',
  'Run a cycle count',
];

export function GettingStarted({ onOpenGuide, onOpenTopic }: { onOpenGuide: (g: Guide) => void; onOpenTopic: (t: HelpTopic) => void }) {
  const [query, setQuery] = useState('');
  const [done, setDone] = useState<boolean[]>([true, true, false, false, false]);
  const q = query.trim().toLowerCase();
  const results = q ? GUIDES.filter(g => `${g.title} ${g.summary} ${g.topic}`.toLowerCase().includes(q)) : [];

  return (
    <>
      <div className={styles.panel}>
        <Heading title="How can we help?">Search the guides, or start with a topic below.</Heading>
        <SearchInput
          aria-label="Search help"
          placeholder="Search help, e.g. “cycle count” or “receive a PO”"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {q && (
          <div className={styles.list} aria-live="polite">
            {results.length === 0 ? (
              <p className={`text-medium-regular ${styles.muted}`}>No guides match “{query}”. Try another word, or contact support.</p>
            ) : (
              results.map(g => (
                <HelpArticleRow
                  key={g.id}
                  type="result"
                  path={`Guides › ${g.topic}`}
                  title={g.title}
                  snippet={g.summary}
                  meta={`${g.minutes} min read`}
                  onClick={() => onOpenGuide(g)}
                />
              ))
            )}
          </div>
        )}
      </div>

      <div className={styles.columns}>
        <div className={styles.panel}>
          <Heading title="Your first week">A few things to try. We’ll keep track as you go.</Heading>
          <Progress value={done.filter(Boolean).length} max={CHECKLIST.length} label="Checklist progress" showValue />
          <div className={styles.checklist}>
            {CHECKLIST.map((task, i) => (
              <Checkbox
                key={task}
                label={task}
                checked={done[i]}
                onChange={e => setDone(d => d.map((v, j) => (j === i ? e.target.checked : v)))}
              />
            ))}
          </div>
        </div>
        <div className={styles.panel}>
          <Heading title="Browse by topic" />
          <div className={styles.topics}>
            {TOPICS.map(t => (
              <HelpCategoryCard
                key={t.id}
                title={t.id}
                description={t.description}
                count={plural(GUIDES.filter(g => g.topic === t.id).length, 'guide')}
                icon={t.icon}
                onClick={() => onOpenTopic(t.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------- Guides ---------- */

export function Guides({
  topic,
  onTopic,
  onOpenGuide,
}: {
  topic: HelpTopic | null;
  onTopic: (t: HelpTopic | null) => void;
  onOpenGuide: (g: Guide) => void;
}) {
  const shown = topic ? GUIDES.filter(g => g.topic === topic) : GUIDES;
  return (
    <div className={styles.panel}>
      <Heading title="Guides">Step-by-step help for everyday work.</Heading>
      <div className={styles.filters} role="group" aria-label="Filter guides by topic">
        <Tag selected={topic === null} onClick={() => onTopic(null)}>
          All
        </Tag>
        {TOPICS.map(t => (
          <Tag key={t.id} selected={topic === t.id} onClick={() => onTopic(t.id)}>
            {t.id}
          </Tag>
        ))}
      </div>
      <div className={styles.list}>
        {shown.map(g => (
          <HelpArticleRow
            key={g.id}
            title={g.title}
            meta={`${g.topic} · ${g.minutes} min read`}
            icon={topicIcon(g.topic)}
            onClick={() => onOpenGuide(g)}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Videos ---------- */

export function Videos({ onOpenVideo }: { onOpenVideo: (v: Video) => void }) {
  return (
    <div className={styles.panel}>
      <Heading title="Videos">Short walkthroughs, a few minutes each.</Heading>
      <div className={styles.videos}>
        {VIDEOS.map(v => (
          <button key={v.id} type="button" className={styles.video} onClick={() => onOpenVideo(v)}>
            <span className={styles.thumb}>
              <Icon name="video-file" size={32} color="currentColor" />
              <span className={`text-tiny-semi-bold ${styles.length}`}>{v.length}</span>
            </span>
            <span className={`text-medium-bold ${styles.videoTitle}`}>{v.title}</span>
            <span className={`text-small-regular ${styles.muted}`}>{v.description}</span>
            <span className={`text-tiny-semi-bold ${styles.muted}`}>{v.topic}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** The video "player" inside the modal: a placeholder, since the prototype ships no video files. */
export function VideoPlayer({ video }: { video: Video }) {
  return (
    <div className={styles.player} role="img" aria-label={`Video: ${video.title}, ${video.length}`}>
      <Icon name="video-file" size={32} color="currentColor" />
      <span className="text-small-regular">Video playback isn’t available in the prototype · {video.length}</span>
    </div>
  );
}

/* ---------- FAQs ---------- */

export function Faqs() {
  // One answer open at a time
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className={styles.panel}>
      <Heading title="Frequently asked questions" />
      <div className={styles.faqs}>
        {FAQS.map((f, i) => (
          <Accordion key={f.q} label={f.q} open={open === i} onOpenChange={o => setOpen(o ? i : null)}>
            <p className={`text-medium-regular ${styles.answer}`}>{f.a}</p>
          </Accordion>
        ))}
      </div>
    </div>
  );
}

/* ---------- What's New ---------- */

const KIND_COLOR: Record<'New' | 'Improved' | 'Fixed', BadgeColor> = { New: 'blue', Improved: 'green', Fixed: 'amber' };

export function WhatsNew() {
  return (
    <div className={styles.panel}>
      <Heading title="What’s new">Release notes for HUB 360.</Heading>
      <div className={styles.releases}>
        {RELEASES.map(r => (
          <article key={r.version} className={styles.release}>
            <h3 className="text-large-bold">
              Version {r.version} <span className={`text-small-regular ${styles.muted}`}>· {r.date}</span>
            </h3>
            <ul className={styles.changes}>
              {r.items.map(item => (
                <li key={item.text}>
                  <Badge shape="pill" color={KIND_COLOR[item.kind]} className={styles.kind}>
                    {item.kind}
                  </Badge>
                  <span className="text-medium-regular">{item.text}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}

/* ---------- Contact Support ---------- */

const TOPIC_OPTIONS = ['Account & Access', 'Inventory', 'Receiving', 'Purchasing', 'Shipping', 'Reports', 'Hardware', 'Something else'].map(
  t => ({ value: t, label: t }),
);

export function ContactSupport({ onSubmit, onViewTickets }: { onSubmit: (t: Omit<Ticket, 'id'>) => string; onViewTickets: () => void }) {
  const [topic, setTopic] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    if (!topic || !subject.trim() || !details.trim()) return;
    const id = onSubmit({ subject: subject.trim(), topic, updated: 'Just now', status: 'Submitted', message: 'Thanks! We usually reply within one business day.' });
    setSent(id);
    setTopic(null);
    setSubject('');
    setDetails('');
    setTried(false);
  }

  return (
    <div className={styles.columns}>
      <div className={styles.panel}>
        <Heading title="Talk to us">{`Support is open ${SUPPORT.hours}.`}</Heading>
        <div className={styles.list}>
          <HelpCategoryCard title="Live Chat" description="Online now · usually answers in 2 minutes" icon="support-agent" />
          <HelpCategoryCard title="Phone" description={SUPPORT.phone} icon="iphone" />
          <HelpCategoryCard title="Email" description={SUPPORT.email} icon="email" />
        </div>
      </div>
      <form className={styles.panel} onSubmit={submit} noValidate>
        <Heading title="Open a ticket">Tell us what’s going on and we’ll follow up by email.</Heading>
        {sent && (
          <Message
            type="success"
            title={`Ticket ${sent} submitted`}
            body={
              <>
                We’ll reply within one business day.{' '}
                <button type="button" className={styles.inlineLink} onClick={onViewTickets}>
                  View my tickets
                </button>
              </>
            }
            onClose={() => setSent(null)}
          />
        )}
        <Dropdown
          label="Topic"
          placeholder="Choose a topic"
          options={TOPIC_OPTIONS}
          value={topic}
          onChange={v => setTopic(v as string)}
          required
          error={tried && !topic ? 'Choose a topic' : undefined}
        />
        <TextInput
          label="Subject"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          required
          error={tried && !subject.trim() ? 'Add a subject' : undefined}
        />
        <TextArea
          label="Details"
          rows={5}
          value={details}
          onChange={e => setDetails(e.target.value)}
          placeholder="What happened, and what did you expect? Include PO numbers or item SKUs if you have them."
          error={tried && !details.trim() ? 'Add some details' : undefined}
        />
        <div className={styles.formActions}>
          <Button size="small" variant="brand" type="submit">
            Submit Ticket
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ---------- My Tickets ---------- */

const STATUS_COLOR: Record<TicketStatus, BadgeColor> = {
  Submitted: 'black',
  'In Progress': 'blue',
  'Waiting on You': 'amber',
  Resolved: 'green',
};

export function MyTickets({ tickets, onNewTicket }: { tickets: Ticket[]; onNewTicket: () => void }) {
  return (
    <div className={styles.panel}>
      <div className={styles.headingRow}>
        <Heading title="My tickets">{`${tickets.filter(t => t.status !== 'Resolved').length} open`}</Heading>
        <Button size="small" variant="outline" icon="plus" onClick={onNewTicket}>
          New Ticket
        </Button>
      </div>
      <div className={styles.list}>
        {tickets.map(t => (
          <article key={t.id} className={styles.ticket}>
            <div className={styles.ticketTop}>
              <div className={styles.ticketText}>
                <h3 className="text-large-bold">{t.subject}</h3>
                <p className={`text-small-regular ${styles.muted}`}>
                  {t.id} · {t.topic} · Updated {t.updated}
                </p>
              </div>
              <Badge shape="pill" color={STATUS_COLOR[t.status]}>
                {t.status}
              </Badge>
            </div>
            <Timeline
              steps={TICKET_STEPS}
              // "Waiting on You" sits on the In Progress step
              current={t.status === 'Resolved' ? TICKET_STEPS.length : t.status === 'Submitted' ? 0 : 1}
              label={`${t.id} progress`}
            />
            {t.message && <p className={`text-medium-regular ${styles.ticketMessage}`}>{t.message}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
