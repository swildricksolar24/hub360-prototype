import { useEffect } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { useHelperFlag } from '../../../shell/helperFlags';
import { HelperToggle, PrototypeHelper } from '../../../shell/PrototypeHelper';
import { AccountData, DevicesSessions, Notifications, PersonalInformation, Preferences, Privacy, SecurityLogin, WorkProfile } from './AccountSections';
import styles from './AccountSettings.module.css';

/**
 * Account Settings, from the account menu: every section of the Figma "_Sign In / Shell" › Account Settings page
 * (774:6033) on one scrolling page, in the order of Figma's "Settings" menu. No Tier 3 header here.
 */
export function AccountSettingsPage() {
  const { user: account } = useAuth();
  const noPhoto = useHelperFlag('account.noPhoto');
  // Helper switch: "No profile photo" shows the initials avatar, as after Edit Photo › Remove Photo (the account keeps its photo)
  const user = noPhoto && account ? { ...account, photo: '' } : account;

  useEffect(() => {
    document.title = 'HUB360 · Account Settings';
  }, []);

  const sections = [
    { id: 'personal', label: 'Personal Information', content: <PersonalInformation user={user} /> },
    { id: 'security', label: 'Security & Login', content: <SecurityLogin /> },
    { id: 'notifications', label: 'Notifications', content: <Notifications /> },
    { id: 'preferences', label: 'Preferences', content: <Preferences /> },
    { id: 'work', label: 'Work Profile', content: <WorkProfile user={user} /> },
    { id: 'privacy', label: 'Privacy', content: <Privacy /> },
    { id: 'devices', label: 'Devices & Sessions', content: <DevicesSessions /> },
    { id: 'account', label: 'Account & Data', content: <AccountData /> },
  ];

  return (
    <div className={styles.page}>
      <PrototypeHelper title="Account">
        <HelperToggle flag="account.noPhoto" label="No profile photo" />
      </PrototypeHelper>
      <h1 className={`text-heading-3-bold ${styles.pageTitle}`}>Account Settings</h1>
      {sections.map(s => (
        <section key={s.id} id={`settings-${s.id}`} className={styles.group} aria-labelledby={`settings-${s.id}-title`}>
          <h2 id={`settings-${s.id}-title`} className={`text-heading-4-bold ${styles.groupTitle}`}>
            {s.label}
          </h2>
          {s.content}
        </section>
      ))}
    </div>
  );
}
