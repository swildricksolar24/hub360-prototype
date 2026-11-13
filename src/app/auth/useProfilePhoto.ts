import { useHelperFlag } from '../shell/helperFlags';
import { useAuth } from './AuthContext';

/**
 * The current profile photo: the signed-in user's (so Account Settings › Edit Photo changes it everywhere), or
 * undefined when there is none (removed, or the Helper's "No profile photo" switch is on), so an Avatar shows its
 * initials. The prototype uses it for every person's picture: inbox senders, note authors, contacts, print jobs.
 */
export function useProfilePhoto(): string | undefined {
  const { user } = useAuth();
  const noPhoto = useHelperFlag('account.noPhoto');
  return (!noPhoto && user?.photo) || undefined;
}
