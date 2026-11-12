import { useEffect, useRef, useState } from 'react';
import { Badge } from '../../../../components/Badge/Badge';
import { Button } from '../../../../components/Button/Button';
import { DataHeader, type DataColumn, type DataSort } from '../../../../components/DataHeader/DataHeader';
import { DataRow } from '../../../../components/DataRow/DataRow';
import { EditableCell } from '../../../../components/EditableCell/EditableCell';
import { Icon } from '../../../../components/Icon/Icon';
import { IconButton } from '../../../../components/IconButton/IconButton';
import { Progress } from '../../../../components/Progress/Progress';
import { Timeline } from '../../../../components/Timeline/Timeline';
import { UploadFile } from '../../../../components/UploadFile/UploadFile';
import { AppModal } from '../../../components/AppModal';
import { useHelperFlag } from '../../../shell/helperFlags';
import { CANADA, MEXICO, TEMPLATE_HEADERS, USA, stateCodesFor, type Warehouse } from './warehouseData';
import styles from './uploadFlow.module.css';
import table from './table.module.css';

type Step = 'upload' | 'match' | 'review' | 'error';
type Sheet = { headers: string[]; rows: string[][] };
type Upload = { file: File; progress: number; sheet: Sheet | null };

const STEPS = ['Upload File', 'Match Columns', 'Review & Import'];
const SKIP = 'skip';
const UPLOAD_MS = 1200;
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_ROWS = 5000;
const TEMPLATE_URL = `${import.meta.env.BASE_URL}templates/warehouses-template.csv`;

/** The warehouse fields a column can go to, with the column names that match each one automatically. */
const FIELDS = [
  { key: 'code', label: 'Warehouse ID', required: true, names: ['code', 'warehouse id', 'warehouse code', 'id', 'wh id'] },
  { key: 'name', label: 'Warehouse Name', required: true, names: ['name', 'warehouse', 'warehouse name'] },
  { key: 'address1', label: 'Address 1', names: ['address 1', 'address1', 'address', 'street', 'street address'] },
  { key: 'address2', label: 'Address 2', names: ['address 2', 'address2', 'suite', 'unit'] },
  { key: 'city', label: 'City', names: ['city', 'town', 'municipality'] },
  { key: 'state', label: 'State', names: ['state', 'st', 'province', 'estado'] },
  { key: 'zip', label: 'Zip Code', names: ['zip code', 'zip', 'zipcode', 'postal code', 'postcode'] },
  { key: 'country', label: 'Country', required: true, names: ['country'] },
  { key: 'value', label: 'Inventory Value', names: ['inventory value', 'value'] },
  { key: 'locations', label: 'Locations', names: ['locations'] },
  { key: 'filled', label: 'Filled Locations', names: ['filled locations', 'filled'] },
];
const REQUIRED = FIELDS.filter(f => f.required);

/** Rows from an XLSX file: the prototype can't read Excel, so it imports the template's sample rows. */
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

/** Reads the file, or null when it can't be imported (wrong type, too big, too many rows, or named with "error"). */
async function readSheet(file: File): Promise<Sheet | null> {
  if (!/\.(csv|xlsx)$/i.test(file.name) || file.size > MAX_BYTES || /error/i.test(file.name)) return null;
  if (/\.xlsx$/i.test(file.name)) return SAMPLE_SHEET;
  const sheet = parseCsv(await file.text());
  return sheet.headers.length && sheet.rows.length <= MAX_ROWS ? sheet : null;
}

/** Each column starts on the field its name matches, if any (each field once). */
function autoMatch(headers: string[]) {
  const used = new Set<string>();
  return headers.map(h => {
    const field = FIELDS.find(f => !used.has(f.key) && f.names.includes(h.trim().toLowerCase()));
    if (!field) return '';
    used.add(field.key);
    return field.key;
  });
}

/**
 * Helper switch "Upload has bad rows": two invalid rows after the file's own, copied from its first row, for the real
 * validation to flag: one with a new Warehouse ID and no name, and an exact copy (its ID appears twice).
 */
function withBadRows(sheet: Sheet, mapping: string[]): Sheet {
  const first = sheet.rows[0] ?? [];
  const copy = (edit: Record<string, string>) => sheet.headers.map((_, i) => edit[mapping[i] ?? ''] ?? first[i] ?? '');
  return { ...sheet, rows: [...sheet.rows, copy({ code: 'YUM-170', name: '' }), copy({})] };
}

const fileSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

/** "USA", "US", "Mexico", "CA"… as the country names warehouses use; null when it isn't one of them. */
function countryOf(value: string) {
  const v = value.trim().toLowerCase().replace(/\./g, '');
  if (['united states of america', 'united states', 'usa', 'us'].includes(v)) return USA;
  if (['canada', 'ca', 'can'].includes(v)) return CANADA;
  if (['mexico', 'méxico', 'mx', 'mex'].includes(v)) return MEXICO;
  return null;
}

type Problem = { row: number; text: string };
type Plan = { creates: Warehouse[]; updates: Warehouse[]; problems: Problem[] };

/** What importing the sheet with this column matching would do: new warehouses, updates, and rows skipped with errors. */
function planImport(sheet: Sheet, mapping: string[], existing: Warehouse[]): Plan {
  const byCode = new Map(existing.map(w => [w.code, w]));
  const seen = new Set<string>();
  const plan: Plan = { creates: [], updates: [], problems: [] };
  sheet.rows.forEach((cells, i) => {
    const row = i + 2; // the file's own row number: row 1 is the header
    if (cells.every(c => !c.trim())) return;
    const get = (key: string) => {
      const col = mapping.indexOf(key);
      return col >= 0 ? (cells[col] ?? '').trim() : undefined;
    };
    const num = (key: string) => Number((get(key) ?? '').replace(/[$,]/g, '')) || 0;
    const fail = (text: string) => plan.problems.push({ row, text });

    const code = (get('code') ?? '').toUpperCase();
    if (!code) return fail('Warehouse ID is empty');
    if (seen.has(code)) return fail(`Warehouse ID “${code}” appears twice in the file`);
    seen.add(code);
    const name = get('name') ?? '';
    if (!name) return fail('Warehouse Name is empty');
    const countryText = get('country') ?? '';
    if (!countryText) return fail('Country is empty');
    const country = countryOf(countryText);
    if (!country) return fail(`Country “${countryText}” isn’t one we support`);
    const zip = get('zip') ?? '';
    if (country === USA && zip && !/^\d{5}(-\d{4})?$/.test(zip)) {
      return fail(zip.replace(/\D/g, '').length < 5 ? `Zip Code “${zip}” is too short` : `Zip Code “${zip}” isn’t a valid ZIP code`);
    }
    const stateText = get('state');
    const state = stateText === undefined ? undefined : (stateCodesFor(country)[stateText] ?? stateText.toUpperCase());

    const current = byCode.get(code);
    // An existing warehouse keeps whatever the file has no column for
    const base: Warehouse = current ?? { id: code, code, name, address1: '', city: '', state: '', zip: '', country, value: 0, locations: 0, filled: 0, active: true };
    const next: Warehouse = {
      ...base,
      name,
      country,
      ...(get('address1') !== undefined && { address1: get('address1')! }),
      ...(get('address2') !== undefined && { address2: get('address2') || undefined }),
      ...(get('city') !== undefined && { city: get('city')! }),
      ...(state !== undefined && { state }),
      ...(get('zip') !== undefined && { zip }),
      ...(get('value') !== undefined && { value: num('value') }),
      ...(get('locations') !== undefined && { locations: num('locations') }),
      ...(get('filled') !== undefined && { filled: num('filled') }),
    };
    (current ? plan.updates : plan.creates).push(next);
  });
  return plan;
}

function download(name: string, href: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  a.click();
}

const MATCH_COLUMNS: DataColumn[] = [
  { key: 'column', label: 'Column in Your File', width: 220 },
  { key: 'samples', label: 'Sample Values', width: 'fill' },
  { key: 'field', label: 'HUB360 Field', width: 300 },
  { key: 'status', label: 'Status', width: 170 },
];

/** Status sorts in the order the pills read: matched, needs a match, skipped */
const STATUS_RANK = { matched: 0, needs: 1, skipped: 2 } as const;

/**
 * Warehouses toolbar › Upload: a three-step import in one dialog (Figma "Upload Spreadsheet" 826:58304, "Map Columns -
 * Default" 826:58411, "Review Import" 826:58495), or "Map Columns - Upload Error" (826:58404) when the file can't be read.
 * 1. Upload File: download the template, drop or browse a CSV or XLSX; the file shows its progress, and Next waits for it.
 * 2. Match Columns: columns are matched to warehouse fields by name; the user fixes the rest or skips them.
 * 3. Review & Import: counts of new and updated warehouses and of rows with errors (skipped), then Import.
 */
export function UploadFlow({
  open,
  onClose,
  existing,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  existing: Warehouse[];
  onImport: (creates: Warehouse[], updates: Warehouse[]) => void;
}) {
  const [step, setStep] = useState<Step>('upload');
  const [upload, setUpload] = useState<Upload | null>(null);
  const [mapping, setMapping] = useState<string[]>([]);
  // How many columns matched by name when the file arrived (the Match Columns description)
  const [autoMatched, setAutoMatched] = useState(0);
  // Match Columns sort: the row order is taken when a header is pressed, so a row stays put while its match is changed
  const [sort, setSort] = useState<DataSort | null>(null);
  const [order, setOrder] = useState<number[] | null>(null);
  const run = useRef(0);
  // Helper switches (set on the Warehouses page)
  const uploadFails = useHelperFlag('warehouses.uploadFails');
  const badRows = useHelperFlag('warehouses.uploadBadRows');
  const unmatched = useHelperFlag('warehouses.uploadUnmatched');

  useEffect(() => {
    if (!open) return;
    run.current++;
    setStep('upload');
    setUpload(null);
  }, [open]);

  /** The file's starting matches: by column name, or none while the Helper's "Unmatched columns" is on. */
  function matchColumns(headers: string[]) {
    // Helper switch "Unmatched columns": every column starts on "Needs a match"
    const matched = unmatched ? headers.map(() => '') : autoMatch(headers);
    setMapping(matched);
    setAutoMatched(matched.filter(Boolean).length);
  }

  // Flipping "Unmatched columns" with a file already uploaded restarts its matching
  const uploadedHeaders = upload?.sheet?.headers;
  useEffect(() => {
    if (uploadedHeaders) matchColumns(uploadedHeaders);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the switch flips
  }, [unmatched]);

  /** Uploads the file: progress runs to 100% while the file is read, then Next unlocks (or the error shows). */
  async function start(file: File) {
    const id = ++run.current;
    setUpload({ file, progress: 0, sheet: null });
    const began = performance.now();
    const timer = window.setInterval(() => {
      if (run.current !== id) return window.clearInterval(timer);
      const progress = Math.min(99, Math.round(((performance.now() - began) / UPLOAD_MS) * 100));
      setUpload(u => (u ? { ...u, progress } : u));
    }, 60);
    const [sheet] = await Promise.all([readSheet(file), new Promise(r => window.setTimeout(r, UPLOAD_MS))]);
    window.clearInterval(timer);
    if (run.current !== id) return;
    // Helper switch "Upload fails": every file goes to the upload error
    if (!sheet || uploadFails) {
      setUpload(null);
      return setStep('error');
    }
    setUpload({ file, progress: 100, sheet });
    matchColumns(sheet.headers);
    setSort(null);
    setOrder(null);
  }

  function cancelUpload() {
    run.current++;
    setUpload(null);
  }

  const read = upload?.progress === 100 ? upload.sheet : null;
  // Helper switch "Upload has bad rows": two invalid rows join what was read (the upload itself is unchanged)
  const sheet = read && badRows ? withBadRows(read, mapping) : read;
  const statusOf = (key: string) => (key === SKIP ? 'skipped' : key ? 'matched' : 'needs');
  const counts = { matched: 0, needs: 0, skipped: 0 };
  mapping.forEach(m => counts[statusOf(m)]++);
  const missing = REQUIRED.filter(f => !mapping.includes(f.key));
  const plan = step === 'review' && sheet ? planImport(sheet, mapping, existing) : null;

  // Match Columns rows: each file column, its sample values, its field and its status
  const columnName = (i: number) => (sheet?.headers[i] || `Column ${i + 1}`);
  const samplesOf = (i: number) =>
    (sheet?.rows ?? [])
      .map(r => (r[i] ?? '').trim())
      .filter(Boolean)
      .slice(0, 3);
  const fieldLabel = (key: string) => (key === SKIP ? 'Don’t import' : FIELDS.find(f => f.key === key)?.label ?? '');
  function sortBy(key: string) {
    if (!sheet) return;
    const direction = sort?.key === key && sort.direction === 'ascending' ? 'descending' : 'ascending';
    const value = (i: number): string | number =>
      key === 'column' ? columnName(i) : key === 'samples' ? samplesOf(i).join(', ') : key === 'field' ? fieldLabel(mapping[i] ?? '') : STATUS_RANK[statusOf(mapping[i] ?? '')];
    const sign = direction === 'ascending' ? 1 : -1;
    const next = sheet.headers
      .map((_, i) => i)
      .sort((a, b) => {
        const x = value(a);
        const y = value(b);
        // Empty values (no samples, no field yet) go last either way
        if (x === '' || y === '') return x === y ? a - b : x === '' ? 1 : -1;
        const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true });
        return c * sign || a - b;
      });
    setSort({ key, direction });
    setOrder(next);
  }
  const rowOrder = order ?? sheet?.headers.map((_, i) => i) ?? [];
  const importing = plan ? plan.creates.length + plan.updates.length : 0;

  const steps = <Timeline className={styles.timeline} steps={STEPS} current={step === 'match' ? 1 : step === 'review' ? 2 : 0} label="Import steps" />;
  const back = (to: Step) => ({ label: 'Back', onClick: () => setStep(to) });

  return (
    <>
      {/* Step 1: Upload File */}
      <AppModal
        open={open && step === 'upload'}
        onClose={onClose}
        title="Upload File"
        description="Fill in our template, upload it here, then match your columns on the next step."
        primaryAction={{ label: 'Next: Match Columns', onClick: () => setStep('match'), disabled: !sheet }}
      >
        <div className={styles.body}>
          {steps}
          <Button className={styles.start} size="small" variant="primary" icon="export-download" onClick={() => download('warehouses-template.csv', TEMPLATE_URL)}>
            Download Template
          </Button>
          <UploadFile
            className={styles.dropZone}
            accept=".csv,.xlsx"
            icon="file-upload"
            iconSize={40}
            title={<span className="text-medium-bold">Drop your file here, or browse</span>}
            browseLabel={null}
            hint={`CSV or XLSX · up to 10 MB · up to ${MAX_ROWS.toLocaleString('en-US')} rows`}
            onFiles={files => files[0] && start(files[0])}
          />
          {upload && (
            <div className={styles.file}>
              <Icon name="document" size={28} color="currentColor" className={styles.fileIcon} />
              <div className={styles.fileInfo}>
                <div className={styles.fileName}>
                  <span className="text-medium-bold">{upload.file.name}</span>
                  <span className="text-tiny-regular" role="status">
                    {upload.progress < 100 ? `Uploading… ${upload.progress}%` : 'Uploaded'}
                  </span>
                </div>
                <Progress className={styles.fileProgress} value={upload.progress} label={`Upload progress for ${upload.file.name}`} width="100%" />
                <span className="text-tiny-regular">
                  {fileSize(upload.file.size)}
                  {sheet && ` · ${plural(sheet.rows.length, 'row')}`}
                </span>
              </div>
              <IconButton
                size="compact"
                icon="close"
                label={upload.progress < 100 ? `Cancel uploading ${upload.file.name}` : `Remove ${upload.file.name}`}
                onClick={cancelUpload}
              />
            </div>
          )}
        </div>
      </AppModal>

      {/* Step 2: Match Columns */}
      <AppModal
        open={open && step === 'match'}
        onClose={onClose}
        width={1040}
        title="Match Columns"
        description={
          autoMatched === mapping.length
            ? `We matched all ${mapping.length} columns automatically. Check the matches before you continue.`
            : `We matched ${autoMatched} of ${mapping.length} columns automatically. Check the matches, then map or skip the rest.`
        }
        startAction={back('upload')}
        primaryAction={{ label: 'Next: Review', onClick: () => setStep('review'), disabled: missing.length > 0 || counts.needs > 0 }}
      >
        <div className={styles.body}>
          {steps}
          <div className={styles.pills}>
            {counts.matched > 0 && <Badge shape="pill" color="green">{counts.matched} matched</Badge>}
            {counts.needs > 0 && <Badge shape="pill" color="amber">{counts.needs} {counts.needs === 1 ? 'needs' : 'need'} a match</Badge>}
            {counts.skipped > 0 && <Badge shape="pill" color="black">{counts.skipped} skipped</Badge>}
          </div>
          {(missing.length > 0 || counts.needs > 0) && (
            <div className={styles.notice} role="status">
              <Icon name="caution" size={22} color="currentColor" className={styles.noticeIcon} />
              <p className="text-medium-regular">
                Required fields: {REQUIRED.map(f => f.label).join(', ').replace(/, ([^,]*)$/, ' and $1')}.{' '}
                {missing.length > 0
                  ? `${missing.map(f => f.label).join(' and ')} ${missing.length === 1 ? 'isn’t' : 'aren’t'} matched yet, so the import can’t continue.`
                  : 'Choose a field for each column that needs a match, or choose Don’t import.'}
              </p>
            </div>
          )}
          <div className={table.tableScroll}>
            <div role="table" aria-label="Column matching" className={table.table}>
              <DataHeader
                className={table.head}
                corners="none"
                columns={MATCH_COLUMNS}
                leading="none"
                actions={false}
                sort={sort ?? undefined}
                onSortChange={sortBy}
              />
              {sheet && rowOrder.map((i, row) => {
                const name = columnName(i);
                const status = statusOf(mapping[i] ?? '');
                const samples = samplesOf(i);
                // A field matched to another column isn't offered again
                const taken = new Set(mapping.filter((m, j) => j !== i && m && m !== SKIP));
                return (
                  <div key={`${sheet.headers[i]}-${i}`} className={table.rowWrap} data-stripe={row % 2 === 0 || undefined}>
                    <DataRow
                      className={table.row}
                      columns={MATCH_COLUMNS}
                      leading="none"
                      actions={false}
                      cells={{
                        column: name,
                        samples: samples.join(', ') || '—',
                        field: (
                          <EditableCell
                            className={styles.fieldSelect}
                            type="select"
                            label={`HUB360 field for ${name}`}
                            value={mapping[i] ?? ''}
                            onValueChange={v => setMapping(m => m.map((x, j) => (j === i ? v : x)))}
                            options={[
                              { value: '', label: 'Select a field' },
                              ...FIELDS.filter(f => !taken.has(f.key)).map(f => ({ value: f.key, label: f.required ? `${f.label} *` : f.label })),
                              { value: SKIP, label: 'Don’t import' },
                            ]}
                          />
                        ),
                        status:
                          status === 'matched' ? (
                            <Badge shape="pill" color="green">Matched</Badge>
                          ) : status === 'needs' ? (
                            <Badge shape="pill" color="amber">Needs a match</Badge>
                          ) : (
                            <Badge shape="pill" color="black">Skipped</Badge>
                          ),
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AppModal>

      {/* Step 3: Review & Import */}
      <AppModal
        open={open && step === 'review'}
        onClose={onClose}
        title="Review & Import"
        description={`Here’s what will happen when you import ${upload?.file.name ?? 'your file'}.`}
        startAction={back('match')}
        primaryAction={{
          label: importing === 1 ? 'Import 1 Warehouse' : `Import ${importing.toLocaleString('en-US')} Warehouses`,
          onClick: () => plan && onImport(plan.creates, plan.updates),
          disabled: importing === 0,
        }}
      >
        {plan && (
          <div className={styles.body}>
            {steps}
            <div className={styles.tiles}>
              <div className={styles.tile} data-tone="new">
                <span className="text-heading-3-bold">{plan.creates.length.toLocaleString('en-US')}</span>
                <span className="text-medium-regular">New warehouses</span>
              </div>
              {/* A row whose Warehouse ID already exists updates that warehouse */}
              <div className={styles.tile} data-tone="update">
                <span className="text-heading-3-bold">{plan.updates.length.toLocaleString('en-US')}</span>
                <span className="text-medium-regular">Update existing</span>
              </div>
              <div className={styles.tile} data-tone="error">
                <span className="text-heading-3-bold">{plan.problems.length.toLocaleString('en-US')}</span>
                <span className="text-medium-regular">Rows with errors</span>
              </div>
            </div>
            {plan.problems.length > 0 && (
              <>
                <div className={styles.errorsHead}>
                  <h3 className="text-medium-bold">Rows with errors (skipped)</h3>
                  <Button
                    size="small"
                    variant="primary"
                    icon="import"
                    onClick={() => {
                      const csv = ['Row,Problem', ...plan.problems.map(p => `${p.row},"${p.text.replace(/"/g, '""')}"`)].join('\n');
                      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                      download(`${(upload?.file.name ?? 'import').replace(/\.[^.]+$/, '')}-errors.csv`, url);
                      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
                    }}
                  >
                    Download Error Report
                  </Button>
                </div>
                <ul className={styles.errors}>
                  {plan.problems.map(p => (
                    <li key={p.row}>
                      <Icon name="error" size={20} color="currentColor" className={styles.errorIcon} />
                      <span className="text-medium-bold">Row {p.row}</span>
                      <span className="text-medium-regular">{p.text}</span>
                    </li>
                  ))}
                </ul>
                <p className={`text-tiny-regular ${styles.footnote}`}>
                  Fix these rows in your file and import it again; rows that already imported won’t be duplicated.
                </p>
              </>
            )}
          </div>
        )}
      </AppModal>

      {/* Upload error */}
      <AppModal
        open={open && step === 'error'}
        onClose={onClose}
        title="We couldn’t upload your file. Please try again."
        description="We couldn’t upload your file due to an unexpected error. Please check your file and internet connection, then try uploading it again. If the problem persists, try selecting the file again or contact support for assistance."
        primaryAction={{ label: 'Try Again', onClick: () => setStep('upload') }}
      />
    </>
  );
}
