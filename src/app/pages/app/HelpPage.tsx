import { useState } from 'react';
import { AppModal } from '../../components/AppModal';
import { RecordActions, RecordPage } from '../../components/RecordPage';
import { GUIDES, SAMPLE_TICKETS, VIDEOS, type Guide, type HelpTopic, type Ticket, type Video } from './help/helpContent';
import { ContactSupport, Faqs, GettingStarted, Guides, MyTickets, VideoPlayer, Videos, WhatsNew } from './help/HelpSections';
import styles from './help/HelpSections.module.css';

/**
 * Help, opened from the header's Help button in its own tab. Built on RecordPage (the Tier 3 page framework) with
 * seven sections: Getting Started (search, first-week checklist, topics), Guides, Videos, FAQs, What's New,
 * Contact Support and My Tickets. Guides and videos open in the app's modal; new tickets join My Tickets.
 */
export function HelpPage() {
  const [section, setSection] = useState('getting-started');
  const [topic, setTopic] = useState<HelpTopic | null>(null);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>(SAMPLE_TICKETS);
  const openTickets = tickets.filter(t => t.status !== 'Resolved').length;

  function addTicket(ticket: Omit<Ticket, 'id'>) {
    const id = `TCK-${1049 + tickets.length - SAMPLE_TICKETS.length}`;
    setTickets(list => [{ ...ticket, id }, ...list]);
    return id;
  }

  return (
    <>
      <RecordPage
        title="HELP CENTER"
        icon="life-preserver"
        breadcrumb={[{ label: 'Help' }]}
        labels={[
          { label: 'Guides', value: String(GUIDES.length) },
          { label: 'Videos', value: String(VIDEOS.length) },
          { label: 'Open Tickets', value: String(openTickets) },
          { label: 'Support Hours', value: '7 AM – 6 PM MST' },
        ]}
        meta={
          <>
            Last Modified: <strong>Oct 30, 2026</strong>
          </>
        }
        actions={
          // Help keeps the Tier 3 template but has nothing to activate, save or step through
          <RecordActions
            hideActive
            hideSave
            hideArrows
            options={[
              { value: 'contact', label: 'Contact Support' },
              { value: 'report', label: 'Report a Problem' },
              { value: 'feedback', label: 'Send Feedback' },
            ]}
          />
        }
        section={section}
        onSectionChange={setSection}
        sections={[
          {
            id: 'getting-started',
            label: 'Getting Started',
            content: (
              <GettingStarted
                onOpenGuide={setGuide}
                onOpenTopic={t => {
                  setTopic(t);
                  setSection('guides');
                }}
              />
            ),
          },
          { id: 'guides', label: 'Guides', content: <Guides topic={topic} onTopic={setTopic} onOpenGuide={setGuide} /> },
          { id: 'videos', label: 'Videos', content: <Videos onOpenVideo={setVideo} /> },
          { id: 'faqs', label: 'FAQs', content: <Faqs /> },
          { id: 'whats-new', label: 'What’s New', content: <WhatsNew /> },
          {
            id: 'contact',
            label: 'Contact Support',
            content: <ContactSupport onSubmit={addTicket} onViewTickets={() => setSection('tickets')} />,
          },
          { id: 'tickets', label: 'My Tickets', content: <MyTickets tickets={tickets} onNewTicket={() => setSection('contact')} /> },
        ]}
      />

      <AppModal
        open={guide !== null}
        onClose={() => setGuide(null)}
        title={guide?.title ?? ''}
        description={guide && `${guide.summary} ${guide.topic} · ${guide.minutes} min read.`}
        secondaryAction={{ label: 'Close', onClick: () => setGuide(null) }}
      >
        {guide && (
          <ol className={`text-medium-regular ${styles.steps}`}>
            {guide.steps.map(step => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        )}
      </AppModal>

      <AppModal
        open={video !== null}
        onClose={() => setVideo(null)}
        title={video?.title ?? ''}
        description={video?.description}
        secondaryAction={{ label: 'Close', onClick: () => setVideo(null) }}
      >
        {video && <VideoPlayer video={video} />}
      </AppModal>
    </>
  );
}
