import { useEffect, useState, type CSSProperties } from 'react';
import { Button } from '../../../../../components/Button/Button';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { Message } from '../../../../../components/Message/Message';
import { NumericInput } from '../../../../../components/NumericInput/NumericInput';
import { AppModal } from '../../../../components/AppModal';
import { LABEL_NAMES, LABEL_PRESETS, LABEL_SIZES, PRINTERS, labelInches, labelSizeText, type LabelSize, type PickLabel } from '../warehouseRecordData';
import { Segmented } from './tableKit';
import styles from '../record.module.css';

type Form = { name: string; printer: string; size: LabelSize | null; width: number | null; height: number | null; copies: number | null; orientation: PickLabel['orientation'] };
const EMPTY: Form = { name: '', printer: '', size: null, width: 4, height: 6, copies: 1, orientation: 'Portrait' };
const options = (list: readonly string[]) => list.map(v => ({ value: v, label: v }));

/** Bar widths for the preview's barcode (decorative). */
const BARS = [3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 1, 3, 1, 1, 2, 2, 1, 3, 1, 2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 2, 1, 1];

/**
 * Figma "Pick/Pack Label Defaults Modal" (723:15932 Add, 723:17434 Edit), 1040px wide: the label, printer, size (preset
 * by the label), copies and orientation on the left; a Label Preview on the right that follows the size. The prototype
 * can't print, so Full-Size Preview and Print Test Label explain that instead.
 */
export function LabelModal({
  open,
  label,
  warehouse,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  /** The label being edited; null adds a new one. */
  label: PickLabel | null;
  /** The warehouse whose code and name the preview prints. */
  warehouse: { code: string; name: string };
  onClose: () => void;
  onSave: (label: Omit<PickLabel, 'id'>) => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [tried, setTried] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    setTried(false);
    setNote(null);
    setForm(
      label
        ? {
            name: label.name,
            printer: label.printer,
            size: label.size,
            width: labelInches(label).width,
            height: labelInches(label).height,
            copies: label.copies,
            orientation: label.orientation,
          }
        : EMPTY,
    );
  }, [open, label]);

  const set = <K extends keyof Form>(key: K) => (value: Form[K]) => setForm(f => ({ ...f, [key]: value }));
  const custom = form.size === 'Custom';
  const errors = {
    name: !form.name ? 'Choose a label' : undefined,
    printer: !form.printer ? 'Choose a printer' : undefined,
    size: !form.size ? 'Choose a label size' : undefined,
    width: custom && !(form.width && form.width > 0) ? 'Enter the width' : undefined,
    height: custom && !(form.height && form.height > 0) ? 'Enter the height' : undefined,
    copies: !(form.copies && form.copies >= 1) ? 'Print at least 1 copy' : undefined,
  };

  function save() {
    setTried(true);
    if (Object.values(errors).some(Boolean) || !form.size) return;
    onSave({
      name: form.name,
      printer: form.printer,
      size: form.size,
      custom: custom ? { width: form.width!, height: form.height! } : undefined,
      copies: form.copies!,
      orientation: form.orientation,
    });
  }

  // The preview follows the size (a Custom size once both sides are filled in) and the orientation
  const size = form.size ?? (form.name ? LABEL_PRESETS[form.name]! : '4 × 6 in');
  const inches = size === 'Custom' ? { width: form.width || 4, height: form.height || 6 } : labelInches({ size });
  // Portrait prints the size as written (width × height); Landscape turns it
  const [w, h] = form.orientation === 'Landscape' ? [inches.height, inches.width] : [inches.width, inches.height];
  const compact = Math.min(w, h) <= 2;
  const preset = form.name ? LABEL_PRESETS[form.name] : undefined;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      width={1040}
      title={label ? 'Edit Label' : 'Add Label'}
      description={
        <>
          Choose the label and printer for this warehouse. The size is preset from the label and can be changed.{' '}
          <span className="text-small-regular">
            <span className={styles.requiredMark}>*</span>Indicates required field
          </span>
        </>
      }
      startAction={label && onDelete ? { label: 'Delete', danger: true, onClick: onDelete } : undefined}
      primaryAction={{ label: 'Save Label', onClick: save }}
    >
      <div className={styles.labelLayout}>
        <form
          className={styles.form}
          noValidate
          onSubmit={e => {
            e.preventDefault();
            save();
          }}
        >
          <Dropdown
            label="Label Name *"
            placeholder="Select"
            options={options(LABEL_NAMES)}
            value={form.name || null}
            onChange={v => setForm(f => ({ ...f, name: v as string, size: LABEL_PRESETS[v as string] ?? f.size }))}
            error={tried ? errors.name : undefined}
            required
          />
          <Dropdown
            label="Printer *"
            placeholder="Select"
            options={options(PRINTERS)}
            value={form.printer || null}
            onChange={v => set('printer')(v as string)}
            error={tried ? errors.printer : undefined}
            required
          />
          <div className={styles.field}>
            <span className={styles.fieldLabel} aria-hidden>
              Label Size <span className={styles.requiredMark}>*</span>
            </span>
            <Segmented label="Label Size (required)" options={options(LABEL_SIZES) as { value: LabelSize; label: string }[]} value={form.size as LabelSize} onChange={set('size')} />
            {tried && errors.size ? (
              <p className={styles.fieldError}>{errors.size}</p>
            ) : (
              <p className={styles.fieldHelp}>
                {preset
                  ? `${preset} is the preset for ${form.name}. Change it only if the printer is loaded with different label stock.`
                  : 'Choosing a label presets its size.'}
              </p>
            )}
          </div>
          {custom && (
            <div className={styles.halves}>
              <NumericInput
                label="Width (in) *"
                value={form.width}
                onValueChange={set('width')}
                min={0.5}
                max={12}
                step={0.5}
                error={tried ? errors.width : undefined}
                decrementLabel="Decrease width"
                incrementLabel="Increase width"
              />
              <NumericInput
                label="Height (in) *"
                value={form.height}
                onValueChange={set('height')}
                min={0.5}
                max={12}
                step={0.5}
                error={tried ? errors.height : undefined}
                decrementLabel="Decrease height"
                incrementLabel="Increase height"
              />
            </div>
          )}
          <div className={styles.halves}>
            <NumericInput
              label="Copies per Carton"
              value={form.copies}
              onValueChange={set('copies')}
              min={1}
              max={20}
              error={tried ? errors.copies : undefined}
              decrementLabel="Fewer copies"
              incrementLabel="More copies"
            />
            <Dropdown label="Orientation" options={options(['Portrait', 'Landscape'])} value={form.orientation} onChange={v => set('orientation')(v as Form['orientation'])} />
          </div>
          <button type="submit" hidden />
        </form>

        <section className={styles.preview} aria-labelledby="label-preview-title">
          <div className={styles.previewHead}>
            <h3 id="label-preview-title" className={styles.previewTitle}>
              Label Preview
            </h3>
            <span className={styles.weak}>
              {labelSizeText({ size, custom: inches })} · {form.orientation.toLowerCase()} · sample data
            </span>
          </div>
          <div className={styles.previewStage}>
            {/* A mock label; its aspect ratio follows the size */}
            <div
              className={styles.labelSheet}
              data-compact={compact || undefined}
              style={{ aspectRatio: `${w} / ${h}`, ...(h >= w ? { height: '100%' } : { width: '100%' }) } as CSSProperties}
              role="img"
              aria-label={`Sample ${form.name || 'label'}, ${labelSizeText({ size, custom: inches })}, for order ORD-10480`}
            >
              <div className={styles.labelTop}>
                <span className={styles.labelKind}>PICK / PACK</span>
                <span>{warehouse.code}</span>
              </div>
              {!compact && <div className={styles.labelWarehouse}>{warehouse.name}</div>}
              <div className={styles.labelOrder}>
                ORDER <strong>ORD-10480</strong>
              </div>
              {!compact && (
                <div className={styles.labelShip}>
                  <span className={styles.labelSmall}>Ship to:</span>
                  <span>Gomez Residence</span>
                  <span>4418 E Cactus Rd</span>
                  <span>Phoenix, AZ 85032</span>
                </div>
              )}
              {!compact && (
                <div className={styles.labelCarton}>
                  <span>Carton 1 of 3</span>
                  <span>12 items</span>
                </div>
              )}
              <div className={styles.barcode} aria-hidden>
                {BARS.map((grow, i) => (
                  <span key={i} style={{ flexGrow: grow }} data-space={i % 2 === 1 || undefined} />
                ))}
              </div>
              <div className={styles.labelId}>ORD-10480-C01</div>
            </div>
          </div>
          <div className={styles.previewActions}>
            <Button size="small" variant="primary" icon="visibility" onClick={() => setNote('Full-size preview')}>
              Full-Size Preview
            </Button>
            <Button size="small" variant="primary" icon="document" onClick={() => setNote('Test print')}>
              Print Test Label
            </Button>
          </div>
          {note && (
            <Message
              type="info"
              title={`${note} isn’t available in this prototype`}
              body={`The prototype can’t reach ${form.printer || 'a printer'}. In the real app this ${note === 'Test print' ? 'sends one sample label to the printer' : 'opens the label at its printed size'}.`}
              onClose={() => setNote(null)}
            />
          )}
        </section>
      </div>
    </AppModal>
  );
}

/** Asks before a label default is deleted. */
export function DeleteLabelModal({ label, onClose, onConfirm }: { label: PickLabel | null; onClose: () => void; onConfirm: () => void }) {
  return (
    <AppModal
      open={label !== null}
      onClose={onClose}
      title="Delete label?"
      description={label && `${label.name} on ${label.printer} will be removed from this warehouse’s label defaults.`}
      primaryAction={{ label: 'Delete Label', danger: true, onClick: onConfirm }}
    />
  );
}
