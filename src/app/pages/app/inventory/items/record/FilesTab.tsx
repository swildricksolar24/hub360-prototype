import { useState, type MouseEvent, type ReactNode } from 'react';
import { Breadcrumb } from '../../../../../../components/Breadcrumb/Breadcrumb';
import { Button } from '../../../../../../components/Button/Button';
import { DataTable, type DataColumn, type DataSort } from '../../../../../../components/DataTable/DataTable';
import { Dropdown } from '../../../../../../components/Dropdown/Dropdown';
import { Icon } from '../../../../../../components/Icon/Icon';
import { SearchInput } from '../../../../../../components/SearchBar/SearchBar';
import { TextInput } from '../../../../../../components/TextInput/TextInput';
import { useHelperFlag } from '../../../../../shell/helperFlags';
import { HelperToggle, PrototypeHelper } from '../../../../../shell/PrototypeHelper';
import { RowMenu } from '../../record/RowMenu';
import { FILE_ICON, isImage, today, type FileType, type Item, type ItemFile } from '../itemData';
import { updateItem } from '../itemStore';
import { ColumnsModal, MenuButton, nextSort, sortRows, StatusPill, useSelection } from '../shared';
import { DeleteFilesModal, EditFileModal, FileTypeLabel, NewFolderModal, newFile, UploadFilesModal, UrlFileModal, useMe, useShownProfileImage, ViewFileModal } from './FileModals';
import { useColumnFilters } from '../../ColumnFilter';
import record from '../../record.module.css';
import listStyles from '../../warehouses.module.css';
import styles from '../items.module.css';

// File Type, Modified By and Status repeat, so they filter (a checkbox list of their values)
const COLUMNS: DataColumn[] = [
  { key: 'name', label: 'File Name', width: 'fill' },
  { key: 'type', label: 'File Type', width: 120, filterable: true },
  { key: 'modified', label: 'Modified', width: 130 },
  { key: 'modifiedBy', label: 'Modified By', width: 170, filterable: true },
];
const COLUMN_OPTIONS = COLUMNS.map(c => ({ key: c.key, label: c.label, locked: c.key === 'name' }));
// Figma's status pill has no header; with its filter it gets one ("Status"), and sorts. It sits right before the •••
const STATUS_COLUMN: DataColumn = { key: 'status', label: 'Status', width: 110, filterable: true };

const DOCUMENTS: FileType[] = ['pdf', 'doc', 'xls', 'ppt'];
/** View ▾: filters of the library. */
const VIEWS: { value: string; label: string; test: (f: ItemFile) => boolean }[] = [
  { value: 'all', label: 'All', test: () => true },
  { value: 'active', label: 'Active', test: f => f.active },
  { value: 'inactive', label: 'Inactive', test: f => !f.active },
  { value: 'images', label: 'Images', test: f => isImage(f.type) },
  { value: 'documents', label: 'Documents', test: f => DOCUMENTS.includes(f.type) },
  { value: 'videos', label: 'Videos', test: f => f.type === 'mov' },
  { value: 'links', label: 'Links', test: f => f.type === 'url' },
];

const cellValue = (f: ItemFile, key: string): string | number =>
  key === 'modified'
    ? Date.parse(f.modified) || 0
    : key === 'type'
      ? f.type
      : key === 'modifiedBy'
        ? f.modifiedBy
        : key === 'status'
          ? (f.active ? 'Active' : 'Inactive')
          : f.name.toLowerCase();
/** A cell's text as it shows, for the column filters' value lists. */
const filterText = (f: ItemFile, key: string) => String(cellValue(f, key));

/**
 * Item record › Files (ITEMS.md §3; Figma 612:14668): the item's library of folders, documents, photos, videos and
 * links. A folder trail, the toolbar (View, Columns, Upload, Actions, Search, Add New ▾) and the files table; a file
 * opens View File, a folder opens in place. The prototype keeps no file contents: uploads add rows with their names.
 */
export function FilesTab({ item, onNotice }: { item: Item; onNotice: (text: string) => void }) {
  const me = useMe();
  // Helper switch: "No files" lists none (the store keeps them)
  const noFiles = useHelperFlag('item.noFiles');
  const files: ItemFile[] = noFiles ? [] : item.files;
  // Helper switch: "Has profile image" shows one when the item has none
  const profileImage = useShownProfileImage(item);
  const [folder, setFolder] = useState<string | null>(null);
  const [view, setView] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<DataSort | undefined>();
  const [columns, setColumns] = useState(COLUMNS.map(c => c.key));
  const sel = useSelection();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [newFolder, setNewFolder] = useState(false);
  const [uploading, setUploading] = useState<'files' | 'folder' | null>(null);
  const [linking, setLinking] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const [editing, setEditing] = useState<ItemFile | null>(null);
  const [deleting, setDeleting] = useState<ItemFile[] | null>(null);
  const [columnsOpen, setColumnsOpen] = useState(false);

  // A folder that was deleted (or merged away) falls back to the top of the library
  const current = folder && files.some(f => f.id === folder) ? folder : null;
  // This folder's files: what the column filters list and count (the 10-row rule)
  const inFolder = files.filter(f => f.folder === current);
  const colFilters = useColumnFilters(inFolder, filterText);
  const q = query.trim().toLowerCase();
  const narrowed = !!q || view !== 'all' || Object.keys(colFilters.filters).length > 0;
  const test = VIEWS.find(v => v.value === view)?.test ?? (() => true);
  const listed = inFolder.filter(f => test(f) && (!q || `${f.name} ${f.type} ${f.modifiedBy} ${f.description}`.toLowerCase().includes(q)) && colFilters.matches(f));
  const sorted = sortRows(listed, sort, cellValue);
  // Folders stay above files
  const rows = [...sorted.filter(f => f.type === 'Folder'), ...sorted.filter(f => f.type !== 'Folder')];
  const viewable = rows.filter(f => f.type !== 'Folder');
  const selected = files.filter(f => sel.selected.has(f.id));
  const tableColumns = [...COLUMNS.filter(c => columns.includes(c.key)), STATUS_COLUMN];

  const save = (fn: (list: ItemFile[]) => ItemFile[]) => updateItem(item.id, i => ({ ...i, files: fn(i.files) }));
  const touch = (f: ItemFile): ItemFile => ({ ...f, modified: today(), modifiedBy: me });

  // The folder trail: All Files › parent › … › this folder
  const trail: ItemFile[] = [];
  for (let id = current; id; ) {
    const f = files.find(x => x.id === id);
    if (!f) break;
    trail.unshift(f);
    id = f.folder;
  }
  const open = (id: string | null) => {
    setFolder(id);
    setQuery('');
    sel.clear();
  };

  function openFile(f: ItemFile) {
    if (f.type === 'Folder') open(f.id);
    else setViewing(f.id);
  }
  const download = (f: ItemFile) =>
    f.type === 'url' && f.url ? window.open(f.url, '_blank', 'noopener') : onNotice(`${f.name} would download here; this prototype doesn’t store file contents.`);
  function setProfile(f: ItemFile) {
    updateItem(item.id, i => ({ ...i, profileImage: f.name }));
    onNotice(`${f.name} is now the profile image.`);
  }
  function setActive(list: ItemFile[], active: boolean) {
    const ids = list.map(f => f.id);
    save(all => all.map(f => (ids.includes(f.id) ? touch({ ...f, active }) : f)));
    onNotice(`${list.length === 1 ? list[0].name : `${list.length} files`} ${active ? 'activated' : 'deactivated'}.`);
  }
  function commitRename() {
    if (!renaming) return;
    const name = renaming.name.trim();
    if (name) save(all => all.map(f => (f.id === renaming.id ? touch({ ...f, name }) : f)));
    setRenaming(null);
  }

  const addMenu = (
    <MenuButton
      label="Add New"
      items={[
        { label: 'New Folder', icon: 'folder', onSelect: () => setNewFolder(true) },
        { label: 'File Upload', icon: 'file-upload', onSelect: () => setUploading('files') },
        { label: 'Folder Upload', icon: 'folder-upload', onSelect: () => setUploading('folder') },
        { label: 'Upload from URL', icon: 'url-upload', onSelect: () => setLinking(true) },
      ]}
    />
  );

  return (
    <div className={record.tab}>
      <PrototypeHelper title="Files">
        <HelperToggle flag="item.noFiles" label="No files" />
        <HelperToggle flag="item.profileImage" label="Has profile image" />
      </PrototypeHelper>

      <section className={record.card} aria-label="Files">
        <div className={styles.trail}>
          <Breadcrumb
            aria-label="Folder"
            homeLabel="Files"
            items={[
              current
                ? {
                    label: 'All Files',
                    href: '#',
                    onClick: e => {
                      e.preventDefault();
                      open(null);
                    },
                  }
                : { label: 'All Files' },
              ...trail.map((f, i) =>
                i < trail.length - 1
                  ? {
                      label: f.name,
                      href: '#',
                      onClick: (e: MouseEvent<HTMLAnchorElement>) => {
                        e.preventDefault();
                        open(f.id);
                      },
                    }
                  : { label: f.name },
              ),
            ]}
          />
        </div>

        <div className={styles.toolbar} data-inset role="toolbar" aria-label="Files">
          <Dropdown
            variant="small"
            label="View"
            hideLabel
            options={VIEWS.map(v => ({ value: v.value, label: v.label }))}
            value={view}
            onChange={v => setView(v as string)}
            renderValue={s => `View: ${s[0]?.label ?? 'All'}`}
          />
          <Button size="small" variant="primary" icon="view-column" onClick={() => setColumnsOpen(true)}>
            Columns
          </Button>
          <Button size="small" variant="primary" icon="upload" onClick={() => setUploading('files')}>
            Upload
          </Button>
          <Dropdown
            variant="small"
            label="Actions"
            hideLabel
            placeholder="Actions"
            options={[
              { value: 'download', label: 'Download', disabled: selected.length === 0 },
              { value: 'activate', label: 'Activate', disabled: selected.length === 0 },
              { value: 'deactivate', label: 'Deactivate', disabled: selected.length === 0 },
              { value: 'delete', label: 'Delete', disabled: selected.length === 0 },
            ]}
            value={null}
            onChange={v => {
              if (v === 'download') onNotice(`${selected.length === 1 ? selected[0].name : `${selected.length} files`} would download here; this prototype doesn’t store file contents.`);
              if (v === 'activate') setActive(selected, true);
              if (v === 'deactivate') setActive(selected, false);
              if (v === 'delete') setDeleting(selected);
            }}
            renderValue={() => (selected.length ? `Actions (${selected.length})` : 'Actions')}
          />
          <SearchInput className={styles.search} aria-label="Search files" placeholder="Search" value={query} onChange={e => setQuery(e.target.value)} />
          {addMenu}
        </div>

        {/* Volt Data Table (Figma "Data Table" page); File Type, Modified By and Status filter */}
        <div ref={colFilters.boxRef} className={listStyles.tableBox}>
          <DataTable
            aria-label={trail.length ? `Files in ${trail[trail.length - 1].name}` : 'Files'}
            className={record.statusStart}
            columns={tableColumns}
            rows={rows}
            rowLabel={f => f.name}
            sort={sort}
            onSortChange={k => setSort(nextSort(k))}
            selected={[...sel.selected]}
            onSelectedChange={ids => {
              sel.setMany([...sel.selected], false);
              sel.setMany(ids, true);
            }}
            {...colFilters.tableProps}
            totalRows={inFolder.length}
            inactive={f => !f.active}
            empty={
              <div className={styles.emptyCell}>
                <Icon name={narrowed ? 'search' : 'folder'} size={32} />
                <p className="text-large-bold">{narrowed ? 'No files match your search' : current ? 'This folder is empty' : 'No files yet'}</p>
                <p className="text-medium-regular">
                  {narrowed ? 'Try a different word, or clear the search, view and filters.' : 'Upload spec sheets, photos, videos and links for this item.'}
                </p>
                {narrowed ? (
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => {
                      setQuery('');
                      setView('all');
                      colFilters.clear();
                    }}
                  >
                    Clear search, view and filters
                  </Button>
                ) : (
                  addMenu
                )}
              </div>
            }
            onMore={f => setMenuFor(m => (m === f.id ? null : f.id))}
            renderAfterRow={f =>
              menuFor === f.id && (
                <RowMenu
                  label={f.name}
                  onClose={() => setMenuFor(null)}
                  items={[
                    ...(f.type === 'Folder'
                      ? [
                          { label: 'Open', onSelect: () => open(f.id) },
                          { label: 'Rename', onSelect: () => setRenaming({ id: f.id, name: f.name }) },
                        ]
                      : [
                          { label: 'View', onSelect: () => setViewing(f.id) },
                          { label: 'Edit', onSelect: () => setEditing(f) },
                          { label: 'Download', onSelect: () => download(f) },
                          ...(isImage(f.type) ? [{ label: 'Set as Profile Image', onSelect: () => setProfile(f) }] : []),
                        ]),
                    { label: f.active ? 'Deactivate' : 'Activate', onSelect: () => setActive([f], !f.active) },
                    { label: 'Delete', onSelect: () => setDeleting([f]) },
                  ]}
                />
              )
            }
            cells={(f): Record<string, ReactNode> => ({
              name:
                renaming?.id === f.id ? (
                  <div className={styles.cellField}>
                    <TextInput
                      label="Folder name"
                      value={renaming.name}
                      onChange={e => setRenaming({ id: f.id, name: e.target.value })}
                      onBlur={commitRename}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setRenaming(null);
                      }}
                      autoFocus
                      autoComplete="off"
                    />
                  </div>
                ) : (
                  <span className={styles.cellIcon}>
                    <Icon name={FILE_ICON[f.type]} size={20} color="currentColor" className={styles.glyph} />
                    <button type="button" className={record.cellLink} onClick={() => openFile(f)}>
                      {f.name}
                    </button>
                  </span>
                ),
              type: <FileTypeLabel type={f.type} />,
              modified: f.modified,
              modifiedBy: f.modifiedBy,
              status: <StatusPill active={f.active} />,
            })}
          />
          {colFilters.popover(tableColumns)}
        </div>
      </section>

      <NewFolderModal
        open={newFolder}
        existing={files.filter(f => f.type === 'Folder' && f.folder === current).map(f => f.name)}
        onClose={() => setNewFolder(false)}
        onCreate={name => {
          const created = newFile({ name, type: 'Folder', folder: current }, me);
          save(all => [created, ...all]);
          setNewFolder(false);
          // Figma: the new folder's row shows its name in an edit field
          setRenaming({ id: created.id, name });
          onNotice(`Folder ${name} created.`);
        }}
      />

      <UploadFilesModal
        mode={uploading}
        onClose={() => setUploading(null)}
        onUpload={(list, folderName) => {
          const parent = folderName ? newFile({ name: folderName, type: 'Folder', folder: current }, me) : null;
          const added = list.map(f => newFile({ ...f, folder: parent ? parent.id : current }, me));
          save(all => [...(parent ? [parent] : []), ...added, ...all]);
          setUploading(null);
          onNotice(parent ? `Folder ${parent.name} uploaded with ${added.length} ${added.length === 1 ? 'file' : 'files'}.` : `${added.length === 1 ? added[0].name : `${added.length} files`} uploaded.`);
        }}
      />

      <UrlFileModal
        open={linking}
        onClose={() => setLinking(false)}
        onCreate={(name, url) => {
          save(all => [newFile({ name, type: 'url', folder: current, url }, me), ...all]);
          setLinking(false);
          onNotice(`${name} added.`);
        }}
      />

      <ViewFileModal
        files={viewable}
        fileId={viewing}
        profileImage={profileImage}
        onFileChange={setViewing}
        onClose={() => setViewing(null)}
        onEdit={f => setEditing(f)}
        onDownload={download}
        onSetProfile={setProfile}
        onDelete={f => setDeleting([f])}
      />

      <EditFileModal
        file={editing}
        onClose={() => setEditing(null)}
        onSave={fields => {
          if (editing) save(all => all.map(f => (f.id === editing.id ? touch({ ...f, ...fields }) : f)));
          // A renamed profile image keeps its place as the profile image
          if (editing && item.profileImage === editing.name) updateItem(item.id, i => ({ ...i, profileImage: fields.name }));
          onNotice(`${fields.name} saved.`);
          setEditing(null);
        }}
      />

      <DeleteFilesModal
        files={deleting}
        all={files}
        onClose={() => setDeleting(null)}
        onConfirm={ids => {
          const gone = files.filter(f => ids.includes(f.id));
          updateItem(item.id, i => ({
            ...i,
            files: i.files.filter(f => !ids.includes(f.id)),
            profileImage: gone.some(f => f.name === i.profileImage) ? undefined : i.profileImage,
          }));
          ids.forEach(id => sel.toggle(id, false));
          if (viewing && ids.includes(viewing)) setViewing(null);
          onNotice(`${deleting?.length === 1 ? deleting[0].name : `${deleting?.length ?? 0} files`} deleted.`);
          setDeleting(null);
        }}
      />

      <ColumnsModal
        open={columnsOpen}
        columns={COLUMN_OPTIONS}
        visible={columns}
        onClose={() => setColumnsOpen(false)}
        onApply={keys => {
          setColumns(keys);
          setColumnsOpen(false);
        }}
      />
    </div>
  );
}
