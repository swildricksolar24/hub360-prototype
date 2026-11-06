import { useEffect, useState } from 'react';
import { Button } from '../../../../../../components/Button/Button';
import { Icon } from '../../../../../../components/Icon/Icon';
import { IconButton } from '../../../../../../components/IconButton/IconButton';
import { Message } from '../../../../../../components/Message/Message';
import { TextArea } from '../../../../../../components/TextArea/TextArea';
import { TextInput } from '../../../../../../components/TextInput/TextInput';
import { UploadFile } from '../../../../../../components/UploadFile/UploadFile';
import { useAuth } from '../../../../../auth/AuthContext';
import { AppModal } from '../../../../../components/AppModal';
import { FILE_ICON, isImage, today, TYPE_ICON, type FileType, type Item, type ItemFile } from '../itemData';
import { updateItem } from '../itemStore';
import { required, requiredNote } from '../shared';
import record from '../../record.module.css';
import styles from '../items.module.css';

/* ---------- Helpers ---------- */

const EXT_TYPE: Record<string, FileType> = {
  pdf: 'pdf',
  png: 'png',
  jpg: 'jpg',
  jpeg: 'jpg',
  mov: 'mov',
  mp4: 'mov',
  doc: 'doc',
  docx: 'doc',
  txt: 'doc',
  xls: 'xls',
  xlsx: 'xls',
  csv: 'xls',
  ppt: 'ppt',
  pptx: 'ppt',
};
/** A file's type from its name's extension; anything unknown counts as a document. */
export const typeFromName = (name: string): FileType => EXT_TYPE[name.split('.').pop()?.toLowerCase() ?? ''] ?? 'doc';
/** A file name without its extension (the table shows the type in its own column). */
export const baseName = (name: string) => (name.includes('.') ? name.slice(0, name.lastIndexOf('.')) : name);
const isUrl = (text: string) => /^https?:\/\/\S+\.\S+/i.test(text.trim());

/** The person signed in, for Modified By. */
export function useMe() {
  const { user } = useAuth();
  return user?.name ?? 'Oswald Cobblepot';
}

let fileSeq = 0;
/** A new row for the Files table. */
export function newFile(fields: Pick<ItemFile, 'name' | 'type' | 'folder'> & Partial<ItemFile>, by: string): ItemFile {
  fileSeq += 1;
  return { id: `file-${Date.now()}-${fileSeq}`, modified: today(), modifiedBy: by, active: true, description: '', ...fields };
}

/** A folder and everything inside it (sub-folders too). */
export function withContents(files: ItemFile[], ids: string[]): string[] {
  const out = new Set(ids);
  let grew = true;
  while (grew) {
    grew = false;
    for (const f of files) {
      if (f.folder && out.has(f.folder) && !out.has(f.id)) {
        out.add(f.id);
        grew = true;
      }
    }
  }
  return [...out];
}

/** The file-type icon and its name, as in the File Type column. */
export function FileTypeLabel({ type }: { type: FileType }) {
  return (
    <span className={styles.cellIcon}>
      <Icon name={FILE_ICON[type]} size={20} color="currentColor" className={styles.glyph} />
      {type}
    </span>
  );
}

/** A preview card: the prototype keeps no file contents, so it shows the type's icon, the name and the description. */
function Preview({ file }: { file: ItemFile }) {
  return (
    <div className={styles.preview}>
      <Icon name={FILE_ICON[file.type]} size={64} color="currentColor" />
      <p className="text-large-bold">{file.name}</p>
      <p className="text-medium-regular">{file.description || 'No description yet.'}</p>
      {file.url && (
        <a className="text-medium-regular" href={file.url} target="_blank" rel="noreferrer">
          {file.url}
        </a>
      )}
      <p className="text-small-regular">This prototype keeps the file’s details only, so there’s no preview of its contents.</p>
    </div>
  );
}

/** Figma's crop box with Move, Scale and Reset: Move steps the box around the image, Scale steps its size down. */
function CropStage({ round = false, icon }: { round?: boolean; icon: string }) {
  const MOVES = ['0%, 0%', '-12%, -10%', '12%, -10%', '12%, 10%', '-12%, 10%'];
  const SCALES = [1, 0.85, 0.7];
  const [move, setMove] = useState(0);
  const [scale, setScale] = useState(0);
  return (
    <div className={styles.column}>
      <div className={styles.cropStage}>
        <Icon name={icon} size={96} color="currentColor" />
        <span
          className={styles.cropBox}
          data-round={round || undefined}
          style={{ transform: `translate(${MOVES[move]}) scale(${SCALES[scale]})` }}
          aria-hidden
        />
      </div>
      <div className={styles.cropTools} role="group" aria-label="Crop">
        <Button size="small" variant="outline" icon="drag-pan" onClick={() => setMove(m => (m + 1) % MOVES.length)}>
          Move
        </Button>
        <Button size="small" variant="outline" icon="scale" onClick={() => setScale(s => (s + 1) % SCALES.length)}>
          Scale
        </Button>
        <Button
          size="small"
          variant="outline"
          icon="reset"
          onClick={() => {
            setMove(0);
            setScale(0);
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

/* ---------- New Folder ---------- */

/** New Folder (ITEMS.md §3): a name; the new row then shows it in an edit field to rename. */
export function NewFolderModal({ open, existing, onClose, onCreate }: { open: boolean; existing: string[]; onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState('');
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (!open) return;
    setName('');
    setTried(false);
  }, [open]);
  const error = !name.trim()
    ? 'Enter a folder name'
    : existing.some(n => n.toLowerCase() === name.trim().toLowerCase())
      ? `There’s already a folder named ${name.trim()} here`
      : undefined;
  function create() {
    setTried(true);
    if (!error) onCreate(name.trim());
  }
  return (
    <AppModal open={open} onClose={onClose} title="New Folder" description={requiredNote} primaryAction={{ label: 'Create', onClick: create }}>
      <form
        className={record.form}
        noValidate
        onSubmit={e => {
          e.preventDefault();
          create();
        }}
      >
        <TextInput label={required('Name')} value={name} onChange={e => setName(e.target.value)} error={tried ? error : undefined} autoComplete="off" required autoFocus />
        <button type="submit" hidden />
      </form>
    </AppModal>
  );
}

/* ---------- File Upload / Folder Upload ---------- */

/**
 * File Upload and Folder Upload (ITEMS.md §3): drop or browse for files; a folder upload also names the folder they go
 * in. The prototype can't store files, so each one becomes a row with its name and type.
 */
export function UploadFilesModal({
  mode,
  onClose,
  onUpload,
}: {
  /** null closes the modal. */
  mode: 'files' | 'folder' | null;
  onClose: () => void;
  onUpload: (files: { name: string; type: FileType }[], folderName?: string) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [folder, setFolder] = useState('');
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (!mode) return;
    setFiles([]);
    setFolder('');
    setTried(false);
  }, [mode]);
  const folderError = mode === 'folder' && !folder.trim() ? 'Enter a folder name' : undefined;
  function upload() {
    setTried(true);
    if (folderError || files.length === 0) return;
    onUpload(
      files.map(f => ({ name: baseName(f.name), type: typeFromName(f.name) })),
      mode === 'folder' ? folder.trim() : undefined,
    );
  }
  return (
    <AppModal
      open={mode !== null}
      onClose={onClose}
      title={mode === 'folder' ? 'Folder Upload' : 'File Upload'}
      description={mode === 'folder' ? <>Name the folder, then add the files that go in it. {requiredNote}</> : 'Add one or more files to this item’s library.'}
      primaryAction={{ label: 'Upload', onClick: upload, disabled: files.length === 0 }}
    >
      <div className={styles.modalBody}>
        {mode === 'folder' && (
          <TextInput label={required('Folder Name')} value={folder} onChange={e => setFolder(e.target.value)} error={tried ? folderError : undefined} autoComplete="off" autoFocus />
        )}
        <UploadFile
          multiple
          onFiles={chosen => setFiles(list => [...list, ...chosen.filter(c => !list.some(f => f.name === c.name))])}
          title="Drop your files here, or"
          hint="Supports PDF, PNG, JPG, MOV, DOC, XLS, PPT"
          icon="file-upload"
        />
        {files.length > 0 && (
          <ul className={styles.fileChips} aria-label="Files to upload">
            {files.map(f => (
              <li key={f.name} className={styles.fileChip}>
                <Icon name={FILE_ICON[typeFromName(f.name)]} size={20} color="currentColor" />
                {f.name}
                <button type="button" className={styles.trash} aria-label={`Remove ${f.name}`} onClick={() => setFiles(list => list.filter(x => x !== f))}>
                  <Icon name="close-small" size={20} color="currentColor" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {files.length > 0 && <p className={`text-small-regular ${styles.muted}`}>This prototype can’t store files, so each one is added as a row with its name and type.</p>}
      </div>
    </AppModal>
  );
}

/* ---------- Upload File from URL ---------- */

/** Upload File from URL (ITEMS.md §3) and Upload Image from URL (the profile image flow): a name and a link. */
export function UrlFileModal({
  open,
  title = 'Upload File from URL',
  onClose,
  onCreate,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  onCreate: (name: string, url: string) => void;
}) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (!open) return;
    setName('');
    setUrl('');
    setTried(false);
  }, [open]);
  const errors = {
    name: !name.trim() ? 'Enter a name' : undefined,
    url: !url.trim() ? 'Enter the URL' : !isUrl(url) ? 'Enter a full web address, starting with https://' : undefined,
  };
  function create() {
    setTried(true);
    if (!errors.name && !errors.url) onCreate(name.trim(), url.trim());
  }
  return (
    <AppModal open={open} onClose={onClose} title={title} description={requiredNote} primaryAction={{ label: 'Create', onClick: create }}>
      <form
        className={record.form}
        noValidate
        onSubmit={e => {
          e.preventDefault();
          create();
        }}
      >
        <TextInput label={required('Name')} value={name} onChange={e => setName(e.target.value)} error={tried ? errors.name : undefined} autoComplete="off" required autoFocus />
        <TextInput
          label={required('URL')}
          type="url"
          placeholder="https://"
          value={url}
          onChange={e => setUrl(e.target.value)}
          error={tried ? errors.url : undefined}
          autoComplete="off"
          required
        />
        <button type="submit" hidden />
      </form>
    </AppModal>
  );
}

/* ---------- View File ---------- */

/**
 * View File (ITEMS.md §3): the file's title with ← / → to step through the folder's files, a preview, Edit, Download
 * and Set as Profile Image (images only), and a red Delete.
 */
export function ViewFileModal({
  files,
  fileId,
  profileImage,
  onFileChange,
  onClose,
  onEdit,
  onDownload,
  onSetProfile,
  onDelete,
}: {
  /** The files to step through, in the table's order. */
  files: ItemFile[];
  /** The file shown; null closes the modal. */
  fileId: string | null;
  profileImage?: string;
  onFileChange: (id: string) => void;
  onClose: () => void;
  onEdit: (file: ItemFile) => void;
  onDownload: (file: ItemFile) => void;
  onSetProfile: (file: ItemFile) => void;
  onDelete: (file: ItemFile) => void;
}) {
  const index = files.findIndex(f => f.id === fileId);
  const file = files[index];
  const step = (by: number) => {
    const next = files[index + by];
    if (next) onFileChange(next.id);
  };
  return (
    <AppModal
      open={!!file}
      onClose={onClose}
      title={file ? `${file.name}${file.type === 'url' ? '' : `.${file.type}`}` : ''}
      secondaryAction={{ label: 'Close', onClick: onClose }}
      startAction={file && { label: 'Delete', danger: true, onClick: () => onDelete(file) }}
    >
      {file && (
        <div
          className={styles.modalBody}
          onKeyDown={e => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === 'ArrowLeft') step(-1);
            if (e.key === 'ArrowRight') step(1);
          }}
        >
          <div className={styles.previewNav}>
            <IconButton size="compact" icon="arrow-left" label="Previous file" disabled={index <= 0} onClick={() => step(-1)} />
            <span className="text-medium-regular" aria-live="polite">
              {index + 1} of {files.length}
            </span>
            <IconButton size="compact" icon="arrow-right" label="Next file" disabled={index >= files.length - 1} onClick={() => step(1)} />
          </div>
          <Preview file={file} />
          <div className={styles.previewMeta}>
            <span className="text-small-regular">
              <strong>Type</strong>
              <br />
              <FileTypeLabel type={file.type} />
            </span>
            <span className="text-small-regular">
              <strong>Modified</strong>
              <br />
              {file.modified}
            </span>
            <span className="text-small-regular">
              <strong>Modified By</strong>
              <br />
              {file.modifiedBy}
            </span>
          </div>
          <div className={styles.previewActions}>
            <Button size="small" variant="outline" icon="edit" onClick={() => onEdit(file)}>
              Edit
            </Button>
            <Button size="small" variant="outline" icon="export-download" onClick={() => onDownload(file)}>
              Download
            </Button>
            {isImage(file.type) && (
              <Button size="small" variant="outline" icon="photo" disabled={profileImage === file.name} onClick={() => onSetProfile(file)}>
                {profileImage === file.name ? 'Profile Image' : 'Set as Profile Image'}
              </Button>
            )}
          </div>
        </div>
      )}
    </AppModal>
  );
}

/* ---------- Edit File ---------- */

/** Edit File (ITEMS.md §3): a crop box with Move, Scale and Reset (images), the file name with its type, and a description. */
export function EditFileModal({
  file,
  onClose,
  onSave,
}: {
  file: ItemFile | null;
  onClose: () => void;
  onSave: (fields: Pick<ItemFile, 'name' | 'description'> & { url?: string }) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (!file) return;
    setName(file.name);
    setDescription(file.description);
    setUrl(file.url ?? '');
    setTried(false);
  }, [file]);
  const errors = {
    name: !name.trim() ? 'Enter the file name' : undefined,
    url: file?.type === 'url' && !isUrl(url) ? 'Enter a full web address, starting with https://' : undefined,
  };
  function save() {
    setTried(true);
    if (errors.name || errors.url) return;
    onSave({ name: name.trim(), description: description.trim(), ...(file?.type === 'url' ? { url: url.trim() } : {}) });
  }
  return (
    <AppModal open={!!file} onClose={onClose} title={file?.type === 'Folder' ? 'Rename Folder' : 'Edit File'} description={requiredNote} primaryAction={{ label: 'Save', onClick: save }}>
      {file && (
        <form
          className={record.form}
          noValidate
          onSubmit={e => {
            e.preventDefault();
            save();
          }}
        >
          {isImage(file.type) && <CropStage icon={FILE_ICON[file.type]} />}
          <div className={styles.fileNameRow}>
            <TextInput label={required(file.type === 'Folder' ? 'Folder Name' : 'File Name')} value={name} onChange={e => setName(e.target.value)} error={tried ? errors.name : undefined} autoComplete="off" required />
            <span className={styles.fileTypeBadge}>{file.type}</span>
          </div>
          {file.type === 'url' && (
            <TextInput label={required('URL')} type="url" value={url} onChange={e => setUrl(e.target.value)} error={tried ? errors.url : undefined} autoComplete="off" required />
          )}
          {file.type !== 'Folder' && <TextArea label="File Description" rows={4} value={description} onChange={e => setDescription(e.target.value)} />}
          <button type="submit" hidden />
        </form>
      )}
    </AppModal>
  );
}

/* ---------- Delete ---------- */

/** Deleting files: a confirmation that names what goes, including what's inside a folder. */
export function DeleteFilesModal({ files, all, onClose, onConfirm }: { files: ItemFile[] | null; all: ItemFile[]; onClose: () => void; onConfirm: (ids: string[]) => void }) {
  const ids = files ? withContents(all, files.map(f => f.id)) : [];
  const inside = ids.length - (files?.length ?? 0);
  const what = files?.length === 1 ? `${files[0].type === 'Folder' ? 'The folder' : ''} ${files[0].name}`.trim() : `${files?.length ?? 0} files`;
  return (
    <AppModal
      open={!!files && files.length > 0}
      onClose={onClose}
      title={files?.length === 1 ? (files[0].type === 'Folder' ? 'Delete Folder' : 'Delete File') : 'Delete Files'}
      description={
        <>
          {what}
          {inside > 0 ? ` and the ${inside} ${inside === 1 ? 'file' : 'files'} inside ${files?.length === 1 ? 'it' : 'them'}` : ''} will be deleted from this item. This action
          cannot be undone.
        </>
      }
      primaryAction={{ label: 'Delete', danger: true, onClick: () => onConfirm(ids) }}
    />
  );
}

/* ---------- Profile image ---------- */

type ProfileStep = 'main' | 'edit' | 'library' | 'upload' | 'url';

/**
 * The profile image flow from the record header's avatar (ITEMS.md §3): Profile Image (a round crop with Edit, Upload
 * From Library, Upload File and Upload a URL), Edit Profile Image, Choose From Files Library and Upload Image from
 * URL. Uploads also land in the item's Files.
 */
export function ProfileImageFlow({ open, item, onClose, onNotice }: { open: boolean; item: Item; onClose: () => void; onNotice: (text: string) => void }) {
  const me = useMe();
  const [step, setStep] = useState<ProfileStep>('main');
  const [picked, setPicked] = useState<string | null>(null);
  const [upload, setUpload] = useState<File | null>(null);
  useEffect(() => {
    if (!open) return;
    setStep('main');
    setPicked(null);
    setUpload(null);
  }, [open]);

  const images = item.files.filter(f => isImage(f.type) && f.active);
  const back = { label: 'Back', onClick: () => setStep('main') };
  function use(name: string, added?: ItemFile) {
    updateItem(item.id, i => ({ ...i, profileImage: name, files: added ? [...i.files, added] : i.files }));
    onNotice(added ? `${name} uploaded to Files and set as the profile image.` : `${name} is now the profile image.`);
    onClose();
  }

  if (step === 'url')
    return (
      <UrlFileModal
        open={open}
        title="Upload Image from URL"
        onClose={() => setStep('main')}
        onCreate={(name, url) => {
          const type = typeFromName(url.split('?')[0]);
          use(name, newFile({ name, type: isImage(type) ? type : 'url', folder: null, url, description: 'Profile image from a link.' }, me));
        }}
      />
    );

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={step === 'edit' ? 'Edit Profile Image' : step === 'library' ? 'Choose From Files Library' : step === 'upload' ? 'Upload Profile Image' : 'Profile Image'}
      secondaryAction={step === 'main' ? { label: 'Close', onClick: onClose } : back}
      startAction={
        step === 'main' && item.profileImage
          ? {
              label: 'Remove Image',
              danger: true,
              onClick: () => {
                updateItem(item.id, i => ({ ...i, profileImage: undefined }));
                onNotice('Profile image removed. The file is still in Files.');
                onClose();
              },
            }
          : undefined
      }
      primaryAction={
        step === 'edit'
          ? {
              label: 'Save',
              onClick: () => {
                onNotice('Profile image updated.');
                onClose();
              },
            }
          : step === 'library'
            ? { label: 'Upload', disabled: !picked, onClick: () => picked && use(picked) }
            : step === 'upload'
              ? {
                  label: 'Upload',
                  disabled: !upload,
                  onClick: () => upload && use(baseName(upload.name), newFile({ name: baseName(upload.name), type: typeFromName(upload.name), folder: null, description: 'Profile image.' }, me)),
                }
              : undefined
      }
    >
      {step === 'main' && (
        <div className={styles.profileStage}>
          <div className={styles.profileCircle}>
            <Icon name={item.profileImage ? 'photo' : TYPE_ICON[item.type]} size={48} color="currentColor" />
            {item.profileImage ?? 'No profile image yet'}
          </div>
          <div className={styles.previewActions}>
            <Button size="small" variant="outline" icon="edit" disabled={!item.profileImage} onClick={() => setStep('edit')}>
              Edit
            </Button>
            <Button size="small" variant="outline" icon="folder" onClick={() => setStep('library')}>
              Upload From Library
            </Button>
            <Button size="small" variant="outline" icon="file-upload" onClick={() => setStep('upload')}>
              Upload File
            </Button>
            <Button size="small" variant="outline" icon="url-upload" onClick={() => setStep('url')}>
              Upload a URL
            </Button>
          </div>
        </div>
      )}
      {step === 'edit' && <CropStage round icon="photo" />}
      {step === 'library' &&
        (images.length === 0 ? (
          <p className={`text-medium-regular ${styles.muted}`}>There are no images in this item’s Files yet. Use Upload File to add one.</p>
        ) : (
          <ul className={styles.thumbs} aria-label="Images in Files">
            {images.map(f => (
              <li key={f.id}>
                <button type="button" className={styles.thumb} aria-pressed={picked === f.name} onClick={() => setPicked(f.name)}>
                  <Icon name="photo" size={48} color="currentColor" />
                  {f.name}
                </button>
              </li>
            ))}
          </ul>
        ))}
      {step === 'upload' && (
        <div className={styles.modalBody}>
          <UploadFile onFiles={f => setUpload(f[0] ?? null)} accept="image/png,image/jpeg" title="Drop your image here, or" hint="Supports JPG, PNG" icon="photo" />
          {upload && <Message type="info" title={`${upload.name} is ready to upload`} body="It will also be added to this item’s Files." onClose={() => setUpload(null)} />}
        </div>
      )}
    </AppModal>
  );
}
