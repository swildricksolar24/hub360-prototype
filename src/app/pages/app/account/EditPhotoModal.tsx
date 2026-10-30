import { useEffect, useState } from 'react';
import { Avatar } from '../../../../components/Avatar/Avatar';
import { Button } from '../../../../components/Button/Button';
import { Message } from '../../../../components/Message/Message';
import { UploadFile } from '../../../../components/UploadFile/UploadFile';
import { useAuth } from '../../../auth/AuthContext';
import { AppModal } from '../../../components/AppModal';
import styles from './AccountSettings.module.css';

const MAX_BYTES = 5 * 1024 * 1024;
/** Photos are cropped to a square and scaled to this size, small enough to keep in the session. */
const PHOTO_PX = 256;

/** Center-crops an image file to a square and returns it as a JPEG data URL. */
function toSquarePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = PHOTO_PX;
      canvas
        .getContext('2d')!
        .drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, PHOTO_PX, PHOTO_PX);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('unreadable'));
    };
    img.src = url;
  });
}

/**
 * Account Settings › Edit Photo, in the app's modal: the design-system UploadFile (click to browse or drop an
 * image), a large Avatar preview, and Remove Photo. Save updates the photo everywhere, including the header.
 */
export function EditPhotoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, updatePhoto } = useAuth();
  // undefined = unchanged, '' = removed, data URL = new photo
  const [draft, setDraft] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(undefined);
      setError(null);
    }
  }, [open]);

  async function onFiles(files: File[]) {
    const file = files[0];
    setError(null);
    if (!file.type.startsWith('image/')) return setError('Choose an image file: JPG, PNG, GIF or WebP.');
    if (file.size > MAX_BYTES) return setError('That image is over 5 MB. Choose a smaller one.');
    setBusy(true);
    try {
      setDraft(await toSquarePhoto(file));
    } catch {
      setError('That image couldn’t be read. Try another file.');
    } finally {
      setBusy(false);
    }
  }

  const preview = draft ?? user?.photo;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Edit Photo"
      description="Your photo appears in the header and next to your messages."
      primaryAction={{
        label: 'Save',
        disabled: draft === undefined || busy,
        onClick: () => {
          updatePhoto(draft ?? null);
          onClose();
        },
      }}
    >
      <div className={styles.photoEditor}>
        <div className={styles.photoPreview}>
          <Avatar size="large" src={preview || undefined} initials={user?.initials} type={preview ? 'photo' : 'initial'} label="Photo preview" />
          <Button size="small" variant="outline" onClick={() => setDraft('')} disabled={!preview}>
            Remove Photo
          </Button>
        </div>
        <UploadFile
          className={styles.photoUpload}
          accept="image/*"
          onFiles={onFiles}
          title="Drop a photo here, or"
          hint="JPG, PNG, GIF or WebP, up to 5 MB. It’s cropped to a square."
        />
      </div>
      {error && <Message type="error" title={error} />}
    </AppModal>
  );
}
