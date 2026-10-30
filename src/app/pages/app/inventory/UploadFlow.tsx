import { useEffect, useState } from 'react';
import { AutocompleteInput } from '../../../../components/AutocompleteInput/AutocompleteInput';
import { Hyperlink } from '../../../../components/Hyperlink/Hyperlink';
import { Icon } from '../../../../components/Icon/Icon';
import { IconButton } from '../../../../components/IconButton/IconButton';
import { Message } from '../../../../components/Message/Message';
import { UploadFile } from '../../../../components/UploadFile/UploadFile';
import { AppModal } from '../../../components/AppModal';
import { IMPORT_FIELDS, TEMPLATE_HEADERS, type Warehouse } from './warehouseData';
import styles from './modals.module.css';

type Step = 'choose' | 'uploading' | 'map' | 'error';
type Sheet = { headers: string[]; rows: string[][] };

const SKIP = "Don't import";
const UPLOAD_MS = 1200;
const TEMPLATE_URL = `${import.meta.env.BASE_URL}templates/warehouses-template.csv`;

/** Rows from an XLS/XLSX file: the prototype can't read Excel, so it imports the template's sample rows. */
const SAMPLE_SHEET: Sheet = {
  headers: TEMPLATE_HEADERS,
  rows: [
    ['KNG-150', 'Kingman WH', '3800 N Stockton Hill Rd', '', 'Kingman', 'AZ', '86409', 'United States of America', '312450', '140', '96'],
    ['CAS-160', 'Casa Grande Yard', '1200 E Florence Blvd', 'Suite 4', 'Casa Grande', 'AZ', '85122', 'United States of America', '488920.5', '210', '175'],
  ],
};

/** A small CSV reader: commas, quoted values, and "" inside quotes. */
function parseCsv(text: string): Sheet {
  const lines: string[][] = [];
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    const cells: string[] = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (quoted) {
        if (ch === '"' && raw[i + 1] === '"') {
          cell += '"';
          i++;
        } else if (ch === '"') quoted = false;
        else cell += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ',') {
        cells.push(cell.trim());
        cell = '';
      } else cell += ch;
    }
    cells.push(cell.trim());
    lines.push(cells);
  }
  const [headers = [], ...rows] = lines;
  return { headers, rows };
}

const isSpreadsheet = (file: File) => /\.(csv|xlsx?)$/i.test(file.name);

/**
 * Toolbar › Upload: Figma "Upload Spreadsheet" (732:52154) → "Uploading" (732:52219) → "Map Columns" (732:52366–
 * 732:52459), or "Upload Error" (732:52362). The template link downloads a CSV with the right headers; a CSV's own
 * header row becomes the uploaded columns, matched to the warehouse fields where the names agree.
 */
export function UploadFlow({
  open,
  onClose,
  existingCodes,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  existingCodes: string[];
  onImport: (warehouses: Warehouse[]) => void;
}) {
  const [step, setStep] = useState<Step>('choose');
  const [file, setFile] = useState<File | null>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [mapping, setMapping] = useState<string[]>([]);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep('choose');
    setFile(null);
    setSheet(null);
    setProblem(null);
  }, [open]);

  async function upload() {
    if (!file) return;
    setStep('uploading');
    const [loaded] = await Promise.all([
      (async () => {
        // A file that isn't a spreadsheet, or one named with "error", shows the upload error (Figma 732:52362)
        if (!isSpreadsheet(file) || /error/i.test(file.name)) return null;
        if (/\.csv$/i.test(file.name)) {
          const parsed = parseCsv(await file.text());
          return parsed.headers.length ? parsed : null;
        }
        return SAMPLE_SHEET;
      })(),
      new Promise(r => window.setTimeout(r, UPLOAD_MS)),
    ]);
    if (!loaded) return setStep('error');
    setSheet(loaded);
    // Columns whose names match a field start out mapped
    setMapping(loaded.headers.map(h => IMPORT_FIELDS.find(f => f.toLowerCase() === h.trim().toLowerCase()) ?? ''));
    setProblem(null);
    setStep('map');
  }

  function save() {
    if (!sheet) return;
    const col = (field: string) => mapping.indexOf(field);
    if (col('Code') < 0 || col('Name') < 0) return setProblem('Map a column to Code and one to Name to import warehouses.');
    const taken = new Set(existingCodes);
    const value = (row: string[], field: string) => (col(field) >= 0 ? (row[col(field)] ?? '').trim() : '');
    const num = (row: string[], field: string) => Number(value(row, field).replace(/[$,]/g, '')) || 0;
    const imported: Warehouse[] = [];
    for (const row of sheet.rows) {
      const code = value(row, 'Code').toUpperCase();
      if (!code || taken.has(code)) continue;
      taken.add(code);
      imported.push({
        id: code,
        code,
        name: value(row, 'Name') || code,
        address1: value(row, 'Address 1'),
        address2: value(row, 'Address 2') || undefined,
        city: value(row, 'City'),
        state: value(row, 'State'),
        zip: value(row, 'Zip Code'),
        country: value(row, 'Country') || 'United States of America',
        value: num(row, 'Inventory Value'),
        locations: num(row, 'Locations'),
        filled: num(row, 'Filled Locations'),
        active: true,
      });
    }
    if (imported.length === 0) return setProblem('No new warehouses found: every row is missing a code or uses a code that already exists.');
    onImport(imported);
  }

  const mapped = mapping.filter(m => m && m !== SKIP).length;

  return (
    <>
      {/* 8–9: Upload File, then uploading */}
      <AppModal
        open={open && (step === 'choose' || step === 'uploading')}
        onClose={onClose}
        title="Upload File"
        description={
          <>
            <Hyperlink href={TEMPLATE_URL} download="warehouses-template.csv" size="small">
              Download our template
            </Hyperlink>
            , add your information, and upload the completed file. You’ll then be able to map your columns to the correct fields for
            accurate data entry.
          </>
        }
        secondaryAction={{ label: 'Cancel', onClick: onClose, disabled: step === 'uploading' }}
        primaryAction={{ label: 'Upload', onClick: upload, disabled: !file || step === 'uploading' }}
      >
        {step === 'uploading' ? (
          <div className={styles.uploading} role="status">
            <span className={styles.spinner} aria-hidden>
              <Icon name="progress-activity" size={32} color="currentColor" />
            </span>
            <span className="text-medium-regular">Uploading {file?.name}…</span>
          </div>
        ) : (
          <div className={styles.uploadBody}>
            <UploadFile
              className={styles.uploadZone}
              accept=".csv,.xls,.xlsx"
              onFiles={files => setFile(files[0] ?? null)}
              title="Drop your file here, or"
              hint="Supports XLS and CSV files only"
            />
            {file && (
              <div className={styles.file}>
                <Icon name="document" size={20} color="currentColor" />
                <span className="text-medium-regular">{file.name}</span>
                <IconButton size="compact" icon="close" label={`Remove ${file.name}`} onClick={() => setFile(null)} />
              </div>
            )}
          </div>
        )}
      </AppModal>

      {/* 14: Upload error */}
      <AppModal
        open={open && step === 'error'}
        onClose={onClose}
        title="We couldn’t upload your file. Please try again."
        description="We couldn’t upload your file due to an unexpected error. Please check your file and internet connection, then try uploading it again. If the problem persists, try selecting the file again or contact support for assistance."
        primaryAction={{
          label: 'Try Again',
          onClick: () => {
            setFile(null);
            setStep('choose');
          },
        }}
      />

      {/* 10–13: Map Columns */}
      <AppModal
        open={open && step === 'map'}
        onClose={onClose}
        width={1040}
        title="Map Columns"
        primaryAction={{ label: 'Save', onClick: save }}
      >
        <div className={`text-medium-bold ${styles.mapHead}`} aria-hidden>
          <span>Uploaded Data Columns</span>
          <span>|</span>
          <span>Targeted Data Columns</span>
        </div>
        <ul className={styles.mapList}>
          {sheet?.headers.map((header, i) => (
            <li key={`${header}-${i}`} className={styles.mapRow}>
              <span className={`text-medium-bold ${styles.mapSource}`}>{header || `Column ${i + 1}`}</span>
              <span className={styles.mapArrow} aria-hidden>
                <Icon name="arrow-right" size={20} color="currentColor" />
              </span>
              <AutocompleteInput
                label={`Targeted column for ${header || `column ${i + 1}`}`}
                placeholder="Select Targeted Column Name"
                options={[...IMPORT_FIELDS, SKIP]}
                value={mapping[i] ?? ''}
                inlineComplete={false}
                filter={(option, q) => option.toLowerCase().includes(q.toLowerCase())}
                onValueChange={v => setMapping(m => m.map((x, j) => (j === i ? v : x)))}
                onSelect={v => setMapping(m => m.map((x, j) => (j === i ? v : x)))}
              />
            </li>
          ))}
        </ul>
        <p className={`text-small-regular ${styles.mapSummary}`}>
          {mapped} of {sheet?.headers.length ?? 0} columns mapped · {sheet?.rows.length === 1 ? '1 row' : `${sheet?.rows.length ?? 0} rows`} in
          the file
        </p>
        {problem && <Message type="error" title={problem} onClose={() => setProblem(null)} />}
      </AppModal>
    </>
  );
}
