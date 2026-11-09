import { Button } from '../../../../../components/Button/Button';
import { Icon } from '../../../../../components/Icon/Icon';
import styles from './editBanner.module.css';

/**
 * The bar above the record header while a section is being edited (Figma 84:11914 Pick / Pack, 891:12852 Printers):
 * "You're editing Warehouse Pick / Pack Settings. 2 unsaved changes." with Discard Changes and Save Changes. Pass it
 * to RecordPage's `banner`.
 */
export function EditBanner({ what, changes, onDiscard, onSave }: { what: string; changes: number; onDiscard: () => void; onSave: () => void }) {
  return (
    <div className={styles.banner} role="region" aria-label={`Editing ${what}`}>
      <p className="text-medium-bold">
        <Icon name="edit" size={20} />
        You’re editing {what}. {changes ? `${changes} unsaved change${changes === 1 ? '' : 's'}.` : 'No changes yet.'}
      </p>
      <span className={styles.buttons}>
        <Button size="small" variant="outline" onClick={onDiscard}>
          Discard Changes
        </Button>
        <Button size="small" variant="brand" onClick={onSave}>
          Save Changes
        </Button>
      </span>
    </div>
  );
}

/** How many top-level fields differ between an edited copy and what's saved. */
export function countChanges<T extends object>(draft: T, saved: T) {
  return (Object.keys(saved) as (keyof T)[]).filter(k => JSON.stringify(draft[k]) !== JSON.stringify(saved[k])).length;
}
