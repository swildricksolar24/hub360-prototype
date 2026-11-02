import { useEffect, useState } from 'react';
import { Dropdown } from '../../../../../components/Dropdown/Dropdown';
import { TextInput } from '../../../../../components/TextInput/TextInput';
import { AppModal } from '../../../../components/AppModal';
import { useWarehouses } from '../warehouseStore';
import { todayIso, type OrderType } from './orderData';
import record from '../record.module.css';
import styles from './orders.module.css';

/**
 * New Order › Move / Adjustment: picks the warehouse (and an optional due date) before the order record opens.
 * Not in Figma, which has no orders list; the record itself is Figma's.
 */
export function NewOrderModal({
  type,
  onClose,
  onCreate,
}: {
  /** The type being started; `null` closes the modal. */
  type: OrderType | null;
  onClose: () => void;
  onCreate: (type: OrderType, warehouse: string, due?: string) => void;
}) {
  const warehouses = useWarehouses().filter(w => w.active);
  const [warehouse, setWarehouse] = useState<string | null>(null);
  const [due, setDue] = useState('');
  const [errors, setErrors] = useState<{ warehouse?: string; due?: string }>({});

  useEffect(() => {
    if (type) {
      setWarehouse(null);
      setDue('');
      setErrors({});
    }
  }, [type]);

  function create() {
    const next: typeof errors = {};
    if (!warehouse) next.warehouse = 'Choose a warehouse';
    if (due && due < todayIso()) next.due = 'The due date can’t be in the past';
    setErrors(next);
    if (type && warehouse && !next.due) onCreate(type, warehouse, due || undefined);
  }

  return (
    <AppModal
      open={type !== null}
      onClose={onClose}
      title={type === 'Adjustment' ? 'New Adjustment' : 'New Move Request'}
      description={
        <>
          {type === 'Adjustment'
            ? 'Choose the warehouse whose stock you’re adjusting. You add the items on the next screen.'
            : 'Choose the warehouse to move stock within. You add the items on the next screen.'}
          <br />
          <span className="text-small-regular">
            <span className={record.requiredMark}>*</span>Indicates required field
          </span>
        </>
      }
      primaryAction={{ label: 'Create Order', onClick: create }}
    >
      <div className={styles.form}>
        <Dropdown
          label="Warehouse *"
          required
          placeholder="Select a warehouse"
          options={warehouses.map(w => ({ value: w.code, label: `${w.code} · ${w.name}` }))}
          value={warehouse}
          onChange={v => {
            setWarehouse(v as string);
            setErrors(e => ({ ...e, warehouse: undefined }));
          }}
          error={errors.warehouse}
        />
        <TextInput
          label="Due date"
          type="date"
          min={todayIso()}
          value={due}
          onChange={e => {
            setDue(e.target.value);
            setErrors(x => ({ ...x, due: undefined }));
          }}
          error={errors.due}
        />
      </div>
    </AppModal>
  );
}
