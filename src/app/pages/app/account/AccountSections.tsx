import { useState } from 'react';
import { Avatar } from '../../../../components/Avatar/Avatar';
import { Button } from '../../../../components/Button/Button';
import { Chip } from '../../../../components/Chip/Chip';
import { Dropdown } from '../../../../components/Dropdown/Dropdown';
import { Icon } from '../../../../components/Icon/Icon';
import { Logo } from '../../../../components/Logo/Logo';
import { Message } from '../../../../components/Message/Message';
import { TextInput } from '../../../../components/TextInput/TextInput';
import { Toggle } from '../../../../components/Toggle/Toggle';
import type { User } from '../../../auth/authService';
import { AppModal } from '../../../components/AppModal';
import { useTheme } from '../../../theme';
import { PasswordField } from '../../auth/PasswordField';
import { useCurrentDevice } from './currentDevice';
import { EditPhotoModal } from './EditPhotoModal';
import { FieldRow, Fields, Range, SettingRow, SettingsCard, SettingsColumn } from './SettingsLayout';
import styles from './AccountSettings.module.css';

const opts = (...values: string[]) => values.map(v => ({ value: v, label: v }));
const TIMES = opts('5:00AM', '6:00AM', '7:00AM', '8:00AM', '9:00AM', '4:00PM', '5:00PM', '6:00PM', '8:00PM', '9:00PM', '10:00PM', '11:00PM');

/** Figma "Drop Down Button / Small" used for the settings' choices. */
function Select({ label, options, defaultValue }: { label: string; options: { value: string; label: string }[]; defaultValue: string }) {
  return <Dropdown variant="small" label={label} hideLabel options={options} defaultValue={defaultValue} />;
}

function Switch({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  return <Toggle aria-label={label} defaultChecked={defaultOn} />;
}

/* ---------- Personal Information ---------- */

export function PersonalInformation({ user }: { user: User | null }) {
  const first = user?.name.split(' ')[0] ?? '';
  const [editingPhoto, setEditingPhoto] = useState(false);
  return (
    <SettingsColumn>
      <section className={`${styles.card} ${styles.profile}`} aria-label="Profile photo">
        <Avatar size="medium" src={user?.photo || undefined} initials={user?.initials} label={user?.name} />
        <div className={styles.rowText}>
          <span className={`text-large-bold ${styles.rowLabel}`}>{user?.name}</span>
          <span className={`text-small-regular ${styles.rowDescription}`}>Operations Manager · Operations</span>
        </div>
        <Button size="small" variant="brand" onClick={() => setEditingPhoto(true)}>
          Edit Photo
        </Button>
      </section>
      <EditPhotoModal open={editingPhoto} onClose={() => setEditingPhoto(false)} />
      <SettingsCard title="Personal Information">
        <Fields>
          <TextInput label="Full Name" defaultValue={user?.name} />
          <TextInput label="Preferred Name" defaultValue={first} />
          <TextInput label="Phone Number" type="tel" defaultValue="602-555-0187" />
          <TextInput label="Address" defaultValue="11565 Ponderosa Drive" />
          <FieldRow>
            <TextInput label="City" defaultValue="Phoenix" />
            <Dropdown label="State" options={opts('Arizona', 'California', 'Colorado', 'Nevada', 'New Mexico', 'Utah')} defaultValue="Arizona" />
            <TextInput label="Zip Code" defaultValue="85206" />
          </FieldRow>
          <FieldRow>
            <TextInput label="Emergency Contact" defaultValue="Tim Drake" />
            <TextInput label="Emergency Contact Phone Number" type="tel" defaultValue="(123) 456-7891" />
          </FieldRow>
        </Fields>
      </SettingsCard>
    </SettingsColumn>
  );
}

/* ---------- Security & Login ---------- */

export function SecurityLogin() {
  const [editing, setEditing] = useState(false);
  const [changed, setChanged] = useState('42 days ago');
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);
  const [microsoft, setMicrosoft] = useState(false);

  function savePassword() {
    if (!form.current || !form.next) return setError('Fill in your current and new password.');
    if (form.next.length < 12) return setError('Use at least 12 characters.');
    if (form.next !== form.confirm) return setError('The new passwords don’t match.');
    setEditing(false);
    setChanged('just now');
  }

  return (
    <SettingsColumn>
      <SettingsCard title="Password">
        <div className={styles.inline}>
          <PasswordField label="Current Password" defaultValue="icebergLounge1" readOnly />
          <Button
            size="small"
            variant="brand"
            onClick={() => {
              setForm({ current: '', next: '', confirm: '' });
              setError(null);
              setEditing(true);
            }}
          >
            Edit Password
          </Button>
        </div>
        <p className={`text-tiny-regular ${styles.rowDescription}`}>Last changed {changed}</p>
      </SettingsCard>

      <SettingsCard title="Two-Factor Authentication">
        <SettingRow label="Authenticator app" description="Google Authenticator">
          <Chip variant="secondary">Enabled</Chip>
        </SettingRow>
        <div className={styles.inline}>
          <TextInput label="SMS Backup" type="tel" defaultValue="+1 (602) 555-0187" />
          <Button size="small" variant="brand">
            Update
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard title="Login Methods">
        <SettingRow label="Google SSO" lead={<Logo name="google" height={20} />}>
          <Chip variant="secondary">Connected</Chip>
        </SettingRow>
        <SettingRow label="Microsoft" lead={<Logo name="microsoft" height={20} />}>
          <Chip variant="secondary" onClick={() => setMicrosoft(c => !c)}>
            {microsoft ? 'Connected' : 'Connect'}
          </Chip>
        </SettingRow>
      </SettingsCard>

      <AppModal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit Password"
        primaryAction={{ label: 'Save', onClick: savePassword }}
      >
        <Fields>
          {error && <Message type="error" title={error} />}
          <PasswordField label="Current Password" value={form.current} onChange={e => setForm(f => ({ ...f, current: e.target.value }))} />
          <PasswordField label="New Password" value={form.next} onChange={e => setForm(f => ({ ...f, next: e.target.value }))} />
          <PasswordField label="Confirm New Password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} />
        </Fields>
      </AppModal>
    </SettingsColumn>
  );
}

/* ---------- Notifications ---------- */

const TOPICS = [
  { label: 'Task Alerts', email: 'Assignments, due dates, mentions', sms: 'Critical task updates only' },
  { label: 'Company Announcements', email: 'Org-wide updates from HR and leadership' },
  { label: 'Team Updates', email: 'Messages from your direct team' },
  { label: 'Reminders', email: 'Upcoming events and deadlines' },
];

export function Notifications() {
  return (
    <SettingsColumn>
      <SettingsCard title="Email Notifications">
        {TOPICS.map((t, i) => (
          <SettingRow key={t.label} label={t.label} description={t.email}>
            <Switch label={`Email: ${t.label}`} defaultOn={i === 0} />
          </SettingRow>
        ))}
      </SettingsCard>
      <SettingsCard title="Push Notifications">
        {TOPICS.map((t, i) => (
          <SettingRow key={t.label} label={t.label}>
            <Switch label={`Push: ${t.label}`} defaultOn={i === 0} />
          </SettingRow>
        ))}
      </SettingsCard>
      <SettingsCard title="SMS Notifications">
        {TOPICS.slice(0, 2).map((t, i) => (
          <SettingRow key={t.label} label={t.label} description={t.sms}>
            <Switch label={`SMS: ${t.label}`} defaultOn={i === 0} />
          </SettingRow>
        ))}
      </SettingsCard>
      <SettingsCard title="Notification Frequency">
        <SettingRow label="Digest Frequency">
          <Select label="Digest Frequency" options={opts('Real-Time', 'Hourly', 'Daily', 'Weekly')} defaultValue="Real-Time" />
        </SettingRow>
        <SettingRow label="Quiet Hours">
          <Range>
            <Select label="Quiet hours start" options={TIMES} defaultValue="10:00PM" />
            <Select label="Quiet hours end" options={TIMES} defaultValue="7:00AM" />
          </Range>
        </SettingRow>
      </SettingsCard>
    </SettingsColumn>
  );
}

/* ---------- Preferences ---------- */

export function Preferences() {
  const [theme, setTheme] = useTheme();
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  return (
    <SettingsColumn>
      <SettingsCard title="Display">
        <SettingRow label="Language">
          <Select label="Language" options={opts('English', 'Español', 'Français')} defaultValue="English" />
        </SettingRow>
        <SettingRow label="Time Zone">
          <Select
            label="Time Zone"
            options={opts('America/Phoenix', 'America/Denver', 'America/Los_Angeles', 'America/Chicago', 'America/New_York')}
            defaultValue="America/Phoenix"
          />
        </SettingRow>
        <SettingRow label="Date Format">
          <Select label="Date Format" options={opts('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD')} defaultValue="MM/DD/YYYY" />
        </SettingRow>
        <SettingRow label="Time Format">
          <Select label="Time Format" options={opts('12-Hour', '24-Hour')} defaultValue="12-Hour" />
        </SettingRow>
        {/* Wired to the app theme, the same store as the account menu's Theme option */}
        <SettingRow label="Dark Mode">
          <Toggle aria-label="Dark Mode" checked={dark} onChange={e => setTheme(e.target.checked ? 'dark' : 'light')} />
        </SettingRow>
        <SettingRow label="Compact Mode">
          <Switch label="Compact Mode" defaultOn />
        </SettingRow>
      </SettingsCard>
      <SettingsCard title="Accessibility">
        <SettingRow label="Font Size">
          <Select label="Font Size" options={opts('Small', 'Medium', 'Large')} defaultValue="Medium" />
        </SettingRow>
        <SettingRow label="Motion">
          <Select label="Motion" options={opts('Full Animations', 'Reduced Motion')} defaultValue="Full Animations" />
        </SettingRow>
      </SettingsCard>
      <SettingsCard title="Navigation">
        <SettingRow label="Default Landing Page">
          <Select label="Default Landing Page" options={opts('Dashboard', 'Inventory')} defaultValue="Dashboard" />
        </SettingRow>
        <SettingRow label="Dashboard Layout">
          <Select label="Dashboard Layout" options={opts('Grid', 'List')} defaultValue="Grid" />
        </SettingRow>
      </SettingsCard>
    </SettingsColumn>
  );
}

/* ---------- Work Profile ---------- */

/** Read-only field managed by HR / admin (Figma: Text Input "Right Icon" with a lock). */
function Managed({ label, value }: { label: string; value: string }) {
  return <TextInput label={label} value={value} readOnly rightIcons={['lock']} />;
}

export function WorkProfile({ user }: { user: User | null }) {
  return (
    <SettingsColumn>
      <SettingsCard title="Work Profile">
        <p className={`text-small-regular ${styles.managed}`}>
          <Icon name="lock" size={20} color="currentColor" /> Managed by your organization. Contact HR to change these details.
        </p>
        <Fields>
          <Managed label="Job Title" value="Operations Manager" />
          <Managed label="Department" value="Operations" />
          <Managed label="Employee ID" value="HUB-000417" />
          <Managed label="Manager" value="Jonathan Crane" />
          <Managed label="Office / Location" value="Phoenix, Arizona" />
          <Managed label="Work Email" value={user?.email ?? ''} />
          <Managed label="Work Phone Number" value="602-555-0100" />
        </Fields>
      </SettingsCard>
      <SettingsCard title="Availability">
        <SettingRow label="Work Status">
          <Select label="Work Status" options={opts('Active', 'Away', 'Out of Office')} defaultValue="Active" />
        </SettingRow>
        <SettingRow label="Working Hours">
          <Range>
            <Select label="Working hours start" options={TIMES} defaultValue="8:00AM" />
            <Select label="Working hours end" options={TIMES} defaultValue="4:00PM" />
          </Range>
        </SettingRow>
      </SettingsCard>
    </SettingsColumn>
  );
}

/* ---------- Privacy ---------- */

export function Privacy() {
  return (
    <SettingsColumn>
      <SettingsCard title="Visibility">
        <SettingRow label="Profile Visibility" description="Show your profile to all employees">
          <Switch label="Profile Visibility" defaultOn />
        </SettingRow>
        <SettingRow label="Directory Visibility" description="Appear in the company directory">
          <Switch label="Directory Visibility" defaultOn />
        </SettingRow>
        <SettingRow label="Contact Information Visibility" description="Show phone and personal email">
          <Switch label="Contact Information Visibility" />
        </SettingRow>
        <SettingRow label="Activity Visibility" description="Let others see when you’re active">
          <Switch label="Activity Visibility" defaultOn />
        </SettingRow>
      </SettingsCard>
      <SettingsCard title="Data">
        <SettingRow label="Data Sharing Preferences" description="Share anonymized usage data to improve HUB 360">
          <Switch label="Data Sharing Preferences" defaultOn />
        </SettingRow>
      </SettingsCard>
    </SettingsColumn>
  );
}

/* ---------- Devices & Sessions ---------- */

type Device = { id: string; name: string; icon: string; os: string; place: string; active: string; current?: boolean };

/** Other signed-in devices (sample data); the current device comes from this browser (useCurrentDevice). */
const OTHER_DEVICES: Device[] = [
  { id: 'd2', name: 'iPhone 15 Pro', icon: 'iphone', os: 'iOS 18.4', place: 'Gilbert, AZ', active: '2 hours ago' },
  { id: 'd3', name: 'iPad Air M2', icon: 'tablet', os: 'iPadOS 18.4', place: 'Gilbert, AZ', active: '5 days ago' },
  { id: 'd4', name: 'Surface Laptop 7', icon: 'monitor', os: 'Windows 11', place: 'Mesa, AZ', active: '3 days ago' },
];

export function DevicesSessions() {
  const current = useCurrentDevice();
  const [others, setOthers] = useState(OTHER_DEVICES);
  const devices: Device[] = [
    { id: 'current', name: current.name, icon: current.icon, os: `${current.os} · ${current.browser}`, place: current.place, active: 'Now', current: true },
    ...others,
  ];
  const setDevices = (change: (list: Device[]) => Device[]) => setOthers(list => change(list));
  return (
    <SettingsColumn>
      <SettingsCard
        title="Devices & Sessions"
        footer={
          <Chip
            variant="secondary"
            className={styles.danger}
            disabled={others.length === 0}
            onClick={() => setDevices(() => [])}
          >
            Sign Out of All Devices
          </Chip>
        }
      >
        {devices.map(d => (
          <SettingRow
            key={d.id}
            label={d.name}
            description={
              <>
                {d.os} · {d.place}
                <br />
                Last active: {d.active}
              </>
            }
            lead={
              <span className={styles.deviceIcon}>
                <Icon name={d.icon} size={24} color="currentColor" />
              </span>
            }
          >
            {d.current ? (
              <Chip variant="secondary">Current Device</Chip>
            ) : (
              <Chip
                variant="secondary"
                className={styles.danger}
                aria-label={`Sign out ${d.name}`}
                onClick={() => setDevices(list => list.filter(x => x.id !== d.id))}
              >
                Sign Out
              </Chip>
            )}
          </SettingRow>
        ))}
      </SettingsCard>
    </SettingsColumn>
  );
}

/* ---------- Account & Data ---------- */

const ACTIVITY = [
  { when: 'Today, 8:02 AM', what: 'Signed in from MacBook Pro 16" · Phoenix, AZ' },
  { when: 'Yesterday, 4:47 PM', what: 'Changed notification settings' },
  { when: 'Oct 27, 9:15 AM', what: 'Signed in from iPhone 15 Pro · Gilbert, AZ' },
  { when: 'Oct 24, 2:30 PM', what: 'Two-factor authentication verified' },
  { when: 'Oct 18, 10:05 AM', what: 'Exported personal data' },
];

export function AccountData() {
  const [notice, setNotice] = useState<string | null>(null);
  const [log, setLog] = useState(false);
  const [confirm, setConfirm] = useState<'deactivate' | 'delete' | null>(null);

  return (
    <SettingsColumn>
      {notice && <Message type="success" title={notice} onClose={() => setNotice(null)} />}
      <SettingsCard title="Account">
        <SettingRow label="Account status" description="Active since March 14, 2023">
          <Chip variant="secondary">Active</Chip>
        </SettingRow>
        <SettingRow label="Download personal data" description="Export a copy of your profile, activity, and settings">
          <Button size="small" variant="outline" onClick={() => setNotice('Your export is being prepared. We’ll email you a download link.')}>
            Export
          </Button>
        </SettingRow>
        <SettingRow label="Account activity log" description="View sign-ins, changes, and security events">
          <Button size="small" variant="outline" onClick={() => setLog(true)}>
            View Log
          </Button>
        </SettingRow>
        <SettingRow label="Danger zone" description="This action is permanent and cannot be reversed">
          <Button size="small" variant="brand" className={styles.danger} onClick={() => setConfirm('deactivate')}>
            Deactivate Account
          </Button>
          <Button size="small" variant="brand" className={styles.danger} onClick={() => setConfirm('delete')}>
            Delete Account
          </Button>
        </SettingRow>
      </SettingsCard>

      <AppModal open={log} onClose={() => setLog(false)} title="Account activity log" secondaryAction={{ label: 'Close', onClick: () => setLog(false) }}>
        <ul className={styles.log}>
          {ACTIVITY.map(a => (
            <li key={a.when}>
              <span className={`text-small-bold ${styles.rowDescription}`}>{a.when}</span>
              <span className="text-medium-regular">{a.what}</span>
            </li>
          ))}
        </ul>
      </AppModal>

      <AppModal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm === 'delete' ? 'Delete your account?' : 'Deactivate your account?'}
        description={
          confirm === 'delete'
            ? 'Your profile, settings and activity will be permanently deleted. This can’t be undone.'
            : 'You’ll be signed out everywhere and won’t be able to sign in until an admin reactivates your account.'
        }
        primaryAction={{
          label: confirm === 'delete' ? 'Delete Account' : 'Deactivate Account',
          onClick: () => {
            setConfirm(null);
            setNotice('This is a prototype, so your account wasn’t changed.');
          },
        }}
      />
    </SettingsColumn>
  );
}
