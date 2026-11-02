import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../../../../components/Icon/Icon';
import { Message, type MessageType } from '../../../../../components/Message/Message';
import { AppLink } from '../../../../components/AppLink';
import { AppModal } from '../../../../components/AppModal';
import { RecordActions, RecordPage } from '../../../../components/RecordPage';
import { useWarehouses } from '../warehouseStore';
import { AdjustmentTable, netCost } from './AdjustmentTable';
import { MoveItemsTable } from './MoveItemsTable';
import { OrderTag } from './OrderStatus';
import { DESIGNED_TYPES, adjustLineError, count, formatDate, money, moveLineErrors, type Order } from './orderData';
import { orderPath, updateOrder, useOrders } from './orderStore';
import record from '../record.module.css';
import styles from './orders.module.css';
import { Toast } from '../../../../components/Toast';

const LIST_PATH = '/app/inventory/orders';

type Notice = { text: string; type: MessageType };
type Confirming = 'process' | 'post' | 'cancel' | null;

/**
 * Inventory › Orders › one order (see ORDERS.md): the Figma Tier 3 header (order #, In Process tag, ORDER TYPE /
 * WAREHOUSE / WAREHOUSE NAME, Created / Due, Actions ▾, Save, ‹ ›) over the order's line items: the Move Request
 * (296:52864) or the Adjustment (705:167001). Other order types aren't designed yet and show a placeholder.
 */
export function OrderRecordPage() {
  const { orderId = '' } = useParams();
  const orders = useOrders();
  const index = orders.findIndex(o => o.id === orderId);
  const order: Order | undefined = orders[index];

  if (!order) {
    return (
      <div className={record.notFound}>
        <Icon name="in-process" size={32} />
        <p className="text-large-bold">Order not found</p>
        <p className="text-medium-regular">
          There’s no order “{orderId}”. <AppLink to={LIST_PATH}>Back to Orders</AppLink>
        </p>
      </div>
    );
  }
  // A different order (previous / next) starts from its own saved lines
  return <OrderRecord key={order.id} order={order} previous={orders[index - 1]} next={orders[index + 1]} />;
}

function OrderRecord({ order, previous, next }: { order: Order; previous?: Order; next?: Order }) {
  const navigate = useNavigate();
  const warehouses = useWarehouses();
  const [moveLines, setMoveLines] = useState(order.moveLines);
  const [adjustLines, setAdjustLines] = useState(order.adjustLines);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirming, setConfirming] = useState<Confirming>(null);
  const [validateSignal, setValidateSignal] = useState(0);

  const designed = DESIGNED_TYPES.includes(order.type);
  const isMove = order.type === 'Move';
  const open = order.status === 'In Process';
  const say = (text: string, type: MessageType = 'success') => setNotice({ text, type });

  function save() {
    updateOrder(order.id, { moveLines, adjustLines });
    say(`${order.number} was saved.`);
  }

  // Process Move / Post Adjustment check every line first; unfinished lines open with their errors
  function finish() {
    const lineCount = isMove ? moveLines.length : adjustLines.length;
    if (lineCount === 0) return say(`Add at least one item before you ${isMove ? 'process this move' : 'post this adjustment'}.`, 'error');
    const unfinished = isMove
      ? moveLines.filter(l => Object.keys(moveLineErrors(l)).length > 0).length
      : adjustLines.filter(l => adjustLineError(l)).length;
    if (unfinished > 0) {
      setValidateSignal(n => n + 1);
      return say(
        `${unfinished === 1 ? '1 line needs' : `${unfinished} lines need`} ${isMove ? 'a Move Quantity and a New Location' : 'a quantity other than 0'} first.`,
        'error',
      );
    }
    setConfirming(isMove ? 'process' : 'post');
  }

  function complete() {
    updateOrder(order.id, { moveLines, adjustLines, status: 'Completed' });
    say(isMove ? `${order.number} was processed. The stock is at its new locations.` : `${order.number} was posted. On-hand quantities are updated.`);
    setConfirming(null);
  }

  function cancelOrder() {
    // A cancelled order keeps what was last saved
    updateOrder(order.id, { status: 'Cancelled' });
    setMoveLines(order.moveLines);
    setAdjustLines(order.adjustLines);
    say(`${order.number} was cancelled.`);
    setConfirming(null);
  }

  // Previous / next order in the list's order, reusing this app tab
  const go = (to: Order | undefined) => (to ? () => navigate(orderPath(to), { state: { replaceTab: true } }) : undefined);

  const warehouseName = warehouses.find(w => w.code === order.warehouse)?.name ?? '—';
  const units = moveLines.reduce((sum, l) => sum + (l.moveQty ?? 0), 0);
  const total = adjustLines.reduce((sum, l) => sum + netCost(l), 0);

  const options =
    open && designed
      ? [
          isMove ? { value: 'process', label: 'Process Move' } : { value: 'post', label: 'Post Adjustment' },
          { value: 'cancel', label: 'Cancel Order' },
        ]
      : open
        ? [{ value: 'cancel', label: 'Cancel Order' }]
        : [];

  const notices: ReactNode = notice && <Toast type={notice.type} title={notice.text} onClose={() => setNotice(null)} />;

  let body: ReactNode;
  if (!designed) {
    body = (
      <div className={styles.tableCard}>
        <div className={styles.emptyCell}>
          <Icon name="in-process" size={32} />
          <p className="text-large-bold">{order.type} orders aren’t designed yet</p>
          <p className="text-medium-regular">Figma has an empty {order.type} page, so this record only shows its header for now.</p>
        </div>
      </div>
    );
  } else if (isMove) {
    body = (
      <MoveItemsTable
        lines={moveLines}
        onLinesChange={setMoveLines}
        status={order.status}
        validateSignal={validateSignal}
        onNotice={(text, type) => say(text, type)}
      />
    );
  } else {
    body = (
      <AdjustmentTable
        lines={adjustLines}
        onLinesChange={setAdjustLines}
        status={order.status}
        validateSignal={validateSignal}
        onNotice={(text, type) => say(text, type)}
      />
    );
  }

  return (
    <>
      <RecordPage
        title={order.number}
        icon="in-process"
        breadcrumb={[{ label: 'Inventory' }, { label: 'Orders', to: LIST_PATH }, { label: order.number }]}
        tag={<OrderTag status={order.status} />}
        labels={[
          { label: 'ORDER TYPE', value: order.type },
          { label: 'WAREHOUSE', value: order.warehouse },
          { label: 'WAREHOUSE NAME', value: warehouseName },
        ]}
        meta={
          <>
            Created: {formatDate(order.created)} · Due: {formatDate(order.due)}
          </>
        }
        actions={
          <RecordActions
            hideActive
            options={options}
            onAction={value => {
              if (value === 'process' || value === 'post') finish();
              else if (value === 'cancel') setConfirming('cancel');
            }}
            hideSave={!open || !designed}
            onSave={save}
            onPrevious={go(previous)}
            onNext={go(next)}
          />
        }
        // One section: the sub menu shows a single "Items" button (Figma's Adjustment tabs were copied in; see ORDERS.md)
        sections={[
          {
            id: 'items',
            label: 'Items',
            content: (
              <>
                {notices}
                {body}
              </>
            ),
          },
        ]}
      />

      {/* Actions › Process Move / Post Adjustment */}
      <AppModal
        open={confirming === 'process' || confirming === 'post'}
        variant="confirm"
        onClose={() => setConfirming(null)}
        title={confirming === 'post' ? 'Confirm Adjustment' : 'Confirm Move'}
        description={
          confirming === 'post' ? (
            <>
              You are about to <strong className={styles.verb}>POST</strong> this adjustment: {count(adjustLines.length)}{' '}
              {adjustLines.length === 1 ? 'line' : 'lines'}, net cost {money(total)}. On-hand quantities change immediately. Do you
              want to continue?
            </>
          ) : (
            <>
              You are about to <strong className={styles.verb}>PROCESS</strong> this move: {count(moveLines.length)}{' '}
              {moveLines.length === 1 ? 'line' : 'lines'}, {count(units)} units. The stock moves to its new locations immediately.
              Do you want to continue?
            </>
          )
        }
        primaryAction={{ label: confirming === 'post' ? 'Post Adjustment' : 'Process Move', onClick: complete }}
      />

      {/* Actions › Cancel Order */}
      <AppModal
        open={confirming === 'cancel'}
        variant="confirm"
        icon="close"
        onClose={() => setConfirming(null)}
        title="Confirm Cancellation"
        description={
          <>
            You are about to <strong className={styles.verb}>CANCEL</strong> {order.number}. A cancelled order can’t be processed or
            edited, and unsaved changes are lost. Do you want to continue?
          </>
        }
        secondaryAction={{ label: 'Keep Order', onClick: () => setConfirming(null) }}
        primaryAction={{ label: 'Cancel Order', danger: true, onClick: cancelOrder }}
      />
    </>
  );
}
