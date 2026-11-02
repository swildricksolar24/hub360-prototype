import { useEffect, useState } from 'react';
import { Button } from '../../../../../components/Button/Button';
import { Message } from '../../../../../components/Message/Message';
import { RadioButton } from '../../../../../components/RadioButton/RadioButton';
import { TextInput } from '../../../../../components/TextInput/TextInput';
import { AppModal } from '../../../../components/AppModal';
import { blankItem, TYPE_DESCRIPTION, type Item, type ItemType } from './itemData';
import { usedIn } from './itemStore';
import { ItemPicker, required, requiredNote } from './shared';
import record from '../record.module.css';
import styles from './items.module.css';

/**
 * Add Part / Add Assembly / Add Kit (ITEMS.md §1; Figma Modal Screen 571:53644, 571:53661, 571:53678): a custom #
 * and a name. Creating the item opens its new record.
 */
export function AddItemModal({
  type,
  existing,
  onClose,
  onCreate,
}: {
  /** The type being added; null closes the modal. */
  type: ItemType | null;
  existing: Item[];
  onClose: () => void;
  onCreate: (item: Item) => void;
}) {
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (!type) return;
    setNumber('');
    setName('');
    setTried(false);
  }, [type]);
  const word = type ?? 'Part';
  const errors = {
    name: !name.trim() ? `Enter the ${word.toLowerCase()} name` : undefined,
    number:
      number.trim() && existing.some(i => i.customNumber.toLowerCase() === number.trim().toLowerCase())
        ? `Another item already uses custom # ${number.trim()}`
        : undefined,
  };
  function create() {
    setTried(true);
    if (!type || errors.name || errors.number) return;
    onCreate(blankItem(type, name.trim(), number.trim()));
  }
  return (
    <AppModal
      open={type !== null}
      onClose={onClose}
      title={`Add ${word}`}
      description={
        <>
          {TYPE_DESCRIPTION[word]}
          <br />
          {requiredNote}
        </>
      }
      primaryAction={{ label: `Create ${word}`, onClick: create }}
    >
      <form
        className={record.form}
        noValidate
        onSubmit={e => {
          e.preventDefault();
          create();
        }}
      >
        <div className={record.halves}>
          <TextInput label={`Custom ${word} #`} value={number} onChange={e => setNumber(e.target.value)} error={tried ? errors.number : undefined} autoComplete="off" />
          <TextInput
            label={required(`${word} Name`)}
            value={name}
            onChange={e => setName(e.target.value)}
            error={tried ? errors.name : undefined}
            autoComplete="off"
            required
            autoFocus
          />
        </div>
        <button type="submit" hidden />
      </form>
    </AppModal>
  );
}

/**
 * Merging Items (ITEMS.md §1) and Merging Parts (§2): every selected item is combined into the one picked here. The
 * picker offers active items of the same type (when the selection shares one), leaving out the selection itself.
 */
export function MergeItemsModal({
  open,
  sources,
  all,
  noun = 'Items',
  onClose,
  onMerge,
}: {
  open: boolean;
  sources: Item[];
  all: Item[];
  /** "Items" from the list; "Parts", "Assemblies" or "Kits" from a record. */
  noun?: string;
  onClose: () => void;
  onMerge: (target: Item) => void;
}) {
  const [target, setTarget] = useState<Item | null>(null);
  useEffect(() => {
    if (open) setTarget(null);
  }, [open]);
  const types = new Set(sources.map(s => s.type));
  const candidates = all.filter(i => i.active && !sources.some(s => s.id === i.id) && (types.size !== 1 || types.has(i.type)));
  const count = sources.length === 1 ? `“${sources[0]?.name}”` : `the ${sources.length} selected items`;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={`Merging ${noun}`}
      primaryAction={{ label: `Merge ${noun}`, disabled: !target, onClick: () => target && onMerge(target) }}
    >
      <div className={styles.modalBody}>
        <p className="text-medium-regular">
          You are merging {count} into the item you choose below. Their details, stock, suppliers, notes, files, and their
          place in assemblies, kits and orders move to that item, and the merged items are deactivated.
        </p>
        <p className={`text-medium-regular ${styles.warning}`}>This process cannot be undone once the merge is complete.</p>
        {target ? (
          <Message
            type="info"
            title={`Merge into ${target.name}`}
            body={`${target.type} · ${target.id}`}
            onClose={() => setTarget(null)}
          />
        ) : (
          <ItemPicker items={candidates} onPick={setTarget} label="Item to merge into" placeholder="Search by # or name for the item to keep" autoFocus />
        )}
      </div>
    </AppModal>
  );
}

/** Deleting Items / Deleting Part - Confirmation Required (ITEMS.md §1, §2). */
export function DeleteItemsModal({
  open,
  items,
  noun = 'Items',
  onClose,
  onConfirm,
}: {
  open: boolean;
  items: Item[];
  /** "Items" from the list; "Part", "Assembly" or "Kit" from a record. */
  noun?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const names = items.length === 1 ? `“${items[0]?.name}”` : `${items.length} items`;
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={`Deleting ${noun} - Confirmation Required`}
      primaryAction={{ label: `Delete ${noun}`, danger: true, onClick: onConfirm }}
    >
      <div className={styles.modalBody}>
        <p className="text-medium-regular">
          Deleting {names} removes {items.length === 1 ? 'it' : 'them'} from every kit, assembly and order that uses{' '}
          {items.length === 1 ? 'it' : 'them'}. Where an active replacement item exists, the replacement is substituted.
        </p>
        <p className={`text-medium-regular ${styles.warning}`}>
          This action cannot be undone. Please confirm that you want to proceed with the deletion.
        </p>
      </div>
    </AppModal>
  );
}

export type DeactivateChoice = 'replace' | 'deactivate' | 'remove';

/**
 * Deactivating Part - Active Assemblies or Kits Error (ITEMS.md §2), shown when active builds use the item; it asks
 * what to do with them. An item no build uses gets the plain Confirm Deactivation.
 */
export function DeactivateItemModal({
  item,
  all,
  onClose,
  onConfirm,
}: {
  item: Item | null;
  all: Item[];
  onClose: () => void;
  onConfirm: (how: DeactivateChoice | 'none', replacementId?: string) => void;
}) {
  const [how, setHow] = useState<DeactivateChoice>('replace');
  const [replacement, setReplacement] = useState<Item | null>(null);
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (!item) return;
    setHow('replace');
    setReplacement(null);
    setTried(false);
  }, [item]);
  const users = item ? usedIn(item.id, all).filter(i => i.active) : [];

  if (item && users.length === 0) {
    return (
      <AppModal
        open
        variant="confirm"
        onClose={onClose}
        title="Confirm Deactivation"
        description={`You are about to DEACTIVATE ${item.name}. It stays on file and can be activated again. Do you want to continue?`}
        primaryAction={{ label: 'Confirm', onClick: () => onConfirm('none') }}
      />
    );
  }

  const word = item?.type ?? 'Part';
  const assemblies = users.filter(u => u.type === 'Assembly').length;
  const kits = users.filter(u => u.type === 'Kit').length;
  const usedText = [assemblies && `${assemblies} active ${assemblies === 1 ? 'assembly' : 'assemblies'}`, kits && `${kits} active ${kits === 1 ? 'kit' : 'kits'}`]
    .filter(Boolean)
    .join(' and ');
  const candidates = all.filter(i => i.active && i.id !== item?.id && i.type === word);

  return (
    <AppModal
      open={item !== null}
      onClose={onClose}
      title={`Deactivating ${word} - Active Assemblies or Kits Error`}
      primaryAction={{
        label: `Deactivate ${word}`,
        onClick: () => {
          setTried(true);
          if (how === 'replace' && !replacement) return;
          onConfirm(how, replacement?.id);
        },
      }}
    >
      <div className={styles.modalBody}>
        <p className="text-medium-regular">
          {item?.name} is used in {usedText}: {users.map(u => u.name).join(', ')}.
        </p>
        <p className="text-large-bold">Would You Like To?</p>
        <div className={styles.radios} role="radiogroup" aria-label="What to do with the builds">
          <RadioButton
            name="deactivate-how"
            label={`Replace this ${word.toLowerCase()} with another (recommended)`}
            checked={how === 'replace'}
            onChange={() => setHow('replace')}
          />
          {how === 'replace' && (
            <div className={styles.indent}>
              {replacement ? (
                <div className={styles.segmentRow}>
                  <span className="text-medium-regular">
                    Replace with <strong>{replacement.name}</strong> ({replacement.id})
                  </span>
                  <Button size="small" variant="outline" onClick={() => setReplacement(null)}>
                    Change
                  </Button>
                </div>
              ) : (
                <>
                  <ItemPicker items={candidates} onPick={setReplacement} label={`${word} Name`} placeholder={`Search for the replacement ${word.toLowerCase()}`} />
                  {tried && <p className={`text-small-regular ${styles.warning}`}>Choose the {word.toLowerCase()} to use instead.</p>}
                </>
              )}
            </div>
          )}
          <RadioButton
            name="deactivate-how"
            label="Deactivate the assemblies and kits that include it"
            checked={how === 'deactivate'}
            onChange={() => setHow('deactivate')}
          />
          <RadioButton
            name="deactivate-how"
            label="Remove it from those assemblies and kits"
            checked={how === 'remove'}
            onChange={() => setHow('remove')}
          />
        </div>
      </div>
    </AppModal>
  );
}
