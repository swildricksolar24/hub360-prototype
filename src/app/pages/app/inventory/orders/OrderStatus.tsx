import { Chip } from '../../../../../components/Chip/Chip';
import { Status } from '../../../../../components/Status/Status';
import type { OrderStatus } from './orderData';

const TAG_ICON: Record<OrderStatus, string> = { 'In Process': 'in-process', Completed: 'check', Cancelled: 'close-small' };

/**
 * An order's status in a table: the shared status pill. Figma only draws "In Process" (Brand Orange); Completed and
 * Cancelled use the gray pill until the designer picks their colors (ORDERS.md, open question 3).
 */
export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return (
    <Status active={status === 'In Process'} data-status>
      {status}
    </Status>
  );
}

/** The record header's status tag (Figma Tag "Tiny / Icon Left", the coded Chip). It shows status; it isn't a control. */
export function OrderTag({ status }: { status: OrderStatus }) {
  return (
    <Chip variant="tiny" icon={TAG_ICON[status]} tabIndex={-1} aria-label={`Status: ${status}`}>
      {status}
    </Chip>
  );
}
