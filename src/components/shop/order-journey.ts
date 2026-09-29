export const RETURN_WINDOW_DAYS = 7;

export const JOURNEY_STEPS = [
  {
    status: 'order_received',
    label: 'Order received',
    description: 'Payment is confirmed and the store has the order',
  },
  {
    status: 'packed',
    label: 'Order packed',
    description: 'Items are packed and waiting for the courier',
  },
  {
    status: 'shipped',
    label: 'Order shipped',
    description: 'Handed to the courier',
  },
  {
    status: 'in_transit',
    label: 'In transit',
    description: 'Moving between hubs',
  },
  {
    status: 'out_for_delivery',
    label: 'Out for delivery',
    description: 'With the delivery partner',
  },
  {
    status: 'delivered',
    label: 'Delivered',
    description: 'Received by the customer',
  },
] as const;

export const MANUAL_STATUSES = [
  'order_received',
  'packed',
  'shipped',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'delivery_failed',
  'return_requested',
  'return_in_transit',
  'returned',
  'cancelled',
] as const;

const LABELS: Record<string, string> = {
  pending: 'Order placed',
  paid: 'Order received',
  order_received: 'Order received',
  packed: 'Order packed',
  shipped: 'Order shipped',
  in_transit: 'In transit',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  failed: 'Payment failed',
  delivery_failed: 'Delivery failed',
  return_requested: 'Return requested',
  return_in_transit: 'Return in transit',
  returned: 'Returned to warehouse',
  refund_initiated: 'Refund initiated',
  refunded: 'Refunded',
  partially_refunded: 'Partially refunded',
  not_received: 'Refund not received',
  processing: 'Refund processing',
};

/** Statuses the store can set, in order. A step cannot be skipped. */
export const TRANSITIONS: Record<string, string[]> = {
  pending: [],
  order_received: ['packed'],
  packed: ['shipped'],
  shipped: ['in_transit', 'delivery_failed'],
  in_transit: ['out_for_delivery', 'delivery_failed'],
  out_for_delivery: ['delivered', 'delivery_failed'],
  delivery_failed: ['out_for_delivery', 'in_transit', 'returned'],
  delivered: [],
  return_requested: ['return_in_transit'],
  return_in_transit: ['returned'],
  returned: [],
  cancelled: [],
  failed: [],
  refunded: [],
};

const STOCK_STATUSES = new Set([
  'order_received',
  'packed',
  'shipped',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'delivery_failed',
  'return_requested',
  'return_in_transit',
  'returned',
]);

export type OrderSnapshot = {
  status?: string | null;
  payment_status?: string | null;
  refund_status?: string | null;
  refunded_amount?: number | null;
  paid_amount?: number | null;
  cancelled_amount?: number | null;
  total?: number | null;
  razorpay_payment_id?: string | null;
  delivered_at?: Date | string | null;
  return_requested_at?: Date | string | null;
  updated_at?: Date | string | null;
  stock_restored?: boolean | null;
};

export type Decision = {
  allowed: boolean;
  reason: string | null;
};

export function money(value: number) {
  return Math.round(Number(value || 0) * 100) / 100;
}

export function canonicalStatus(status?: string | null) {
  if (status === 'paid') return 'order_received';
  return status || 'pending';
}

export function labelFor(status?: string | null) {
  const key = canonicalStatus(status);
  return LABELS[key] || LABELS[status || ''] || key;
}

export function wasCharged(order: OrderSnapshot) {
  if (['paid', 'partially_refunded', 'refund_initiated', 'refunded'].includes(order.payment_status || '')) {
    return true;
  }
  if (order.razorpay_payment_id) return true;
  const status = canonicalStatus(order.status);
  if (order.payment_status === 'failed' || order.payment_status === 'unpaid') return false;
  return status !== 'pending' && status !== 'failed';
}

export const REFUND_STATUSES = [
  'eligible',
  'initiated',
  'processing',
  'partially_refunded',
  'refunded',
  'not_received',
  'failed',
] as const;

export function chargedAmount(order: OrderSnapshot) {
  const paid = Number(order.paid_amount || 0);
  if (paid > 0) return paid;
  return wasCharged(order) ? Number(order.total || 0) : 0;
}

export function refundableAmount(order: OrderSnapshot) {
  if (!wasCharged(order)) return 0;
  const remainingPaid = money(chargedAmount(order) - Number(order.refunded_amount || 0));
  if (remainingPaid <= 0) return 0;
  const status = canonicalStatus(order.status);
  const wholeOrder =
    ['cancelled', 'returned', 'failed'].includes(status) ||
    order.refund_status === 'not_received' ||
    order.refund_status === 'failed';
  if (wholeOrder) return remainingPaid;
  const fromCancelledLines = money(Number(order.cancelled_amount || 0) - Number(order.refunded_amount || 0));
  return Math.max(0, Math.min(remainingPaid, fromCancelledLines));
}

export function shouldRestoreStock(order: OrderSnapshot) {
  if (order.stock_restored) return false;
  return STOCK_STATUSES.has(canonicalStatus(order.status));
}

export function cancellationDecision(order: OrderSnapshot): Decision {
  const status = canonicalStatus(order.status);
  if (['cancelled', 'refunded'].includes(status) || order.refund_status === 'refunded') {
    return { allowed: false, reason: 'This order is already cancelled or refunded.' };
  }
  if (order.refund_status === 'initiated') {
    return { allowed: false, reason: 'Cancellation is blocked because a refund is already in progress.' };
  }
  if (status === 'failed') {
    return { allowed: false, reason: 'Payment failed, so there is nothing to cancel. A captured payment can still be refunded.' };
  }
  if (['shipped', 'in_transit', 'out_for_delivery'].includes(status)) {
    return {
      allowed: false,
      reason: 'Cancellation is blocked after the order ships. Refuse the delivery, or request a return once it is delivered.',
    };
  }
  if (status === 'delivery_failed') {
    return {
      allowed: false,
      reason: 'Cancellation is blocked while a failed delivery is with the courier. Mark it returned to the warehouse, then refund.',
    };
  }
  if (status === 'delivered') {
    return {
      allowed: false,
      reason: `Delivered orders cannot be cancelled. Request a return within ${RETURN_WINDOW_DAYS} days of delivery.`,
    };
  }
  if (['return_requested', 'return_in_transit', 'returned'].includes(status)) {
    return { allowed: false, reason: 'A return is already open, so cancellation is blocked.' };
  }
  if (['pending', 'order_received', 'packed'].includes(status)) {
    return { allowed: true, reason: null };
  }
  return { allowed: false, reason: 'Cancellation is not available for this order.' };
}

function returnDeadline(order: OrderSnapshot) {
  const delivered = order.delivered_at || order.updated_at;
  if (!delivered) return null;
  const start = new Date(delivered);
  if (Number.isNaN(start.getTime())) return null;
  return new Date(start.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

export function returnDecision(order: OrderSnapshot, now = new Date()): Decision {
  const status = canonicalStatus(order.status);
  if (status === 'return_requested' || status === 'return_in_transit' || status === 'returned') {
    return { allowed: false, reason: 'A return is already open for this order.' };
  }
  if (['cancelled', 'refunded', 'failed', 'pending'].includes(status)) {
    return { allowed: false, reason: 'A return can be requested only after the order is delivered.' };
  }
  if (status !== 'delivered') {
    return { allowed: false, reason: 'A return can be requested only after the order is delivered.' };
  }
  const deadline = returnDeadline(order);
  if (deadline && now.getTime() > deadline.getTime()) {
    return {
      allowed: false,
      reason: `The ${RETURN_WINDOW_DAYS}-day return window has closed, so a return and its refund are blocked.`,
    };
  }
  return { allowed: true, reason: null };
}

export function refundDecision(order: OrderSnapshot): Decision & { refundable_amount: number } {
  const status = canonicalStatus(order.status);
  const refundable_amount = refundableAmount(order);
  if (!wasCharged(order) || refundable_amount <= 0) {
    if (order.refund_status === 'refunded' || status === 'refunded') {
      return { allowed: false, refundable_amount: 0, reason: 'This order is already refunded.' };
    }
    return {
      allowed: false,
      refundable_amount: 0,
      reason: 'Refund is blocked because this order was not paid.',
    };
  }
  if (order.refund_status === 'refunded' || status === 'refunded') {
    return { allowed: false, refundable_amount: 0, reason: 'This order is already refunded.' };
  }
  if (order.refund_status === 'not_received' || order.refund_status === 'failed') {
    return { allowed: true, refundable_amount, reason: null };
  }
  if (money(Number(order.cancelled_amount || 0)) > money(Number(order.refunded_amount || 0))) {
    return { allowed: true, refundable_amount, reason: null };
  }
  if (status === 'failed' && order.razorpay_payment_id) {
    return { allowed: true, refundable_amount, reason: null };
  }
  if (status === 'cancelled') {
    return { allowed: true, refundable_amount, reason: null };
  }
  if (status === 'returned') {
    const deadline = returnDeadline(order);
    if (
      deadline &&
      order.return_requested_at &&
      new Date(order.return_requested_at).getTime() > deadline.getTime()
    ) {
      return {
        allowed: false,
        refundable_amount,
        reason: `Refund is blocked because the return was requested after the ${RETURN_WINDOW_DAYS}-day window.`,
      };
    }
    return { allowed: true, refundable_amount, reason: null };
  }
  if (status === 'delivered') {
    return {
      allowed: false,
      refundable_amount,
      reason: `Refund is blocked on a delivered order. Request a return within ${RETURN_WINDOW_DAYS} days, then refund after it reaches the warehouse.`,
    };
  }
  if (['return_requested', 'return_in_transit'].includes(status)) {
    return {
      allowed: false,
      refundable_amount,
      reason: 'Refund is blocked until the return reaches the warehouse.',
    };
  }
  if (['shipped', 'in_transit', 'out_for_delivery', 'delivery_failed'].includes(status)) {
    return {
      allowed: false,
      refundable_amount,
      reason: 'Refund is blocked while the shipment is with the courier. Cancel before shipping, or refund after the return reaches the warehouse.',
    };
  }
  if (['pending', 'order_received', 'packed'].includes(status)) {
    return {
      allowed: false,
      refundable_amount,
      reason: 'Refund is blocked until the order is cancelled. It can still be cancelled before it ships.',
    };
  }
  return { allowed: false, refundable_amount, reason: 'Refund is not available for this order.' };
}

export function addressDecision(order: OrderSnapshot, staff = false): Decision {
  const status = canonicalStatus(order.status);
  if (['cancelled', 'refunded', 'failed', 'delivered'].includes(status)) {
    return { allowed: false, reason: 'The delivery address can no longer be changed.' };
  }
  if (staff) return { allowed: true, reason: null };
  if (['pending', 'order_received', 'packed'].includes(status)) return { allowed: true, reason: null };
  return {
    allowed: false,
    reason: 'The address is locked after the order ships. An admin can still change it before delivery.',
  };
}

export function partialCancelDecision(order: OrderSnapshot, staff = false): Decision {
  const status = canonicalStatus(order.status);
  if (['delivered', 'refunded', 'failed'].includes(status)) {
    return { allowed: false, reason: 'Items can no longer be cancelled on this order.' };
  }
  if (staff && status !== 'cancelled') return { allowed: true, reason: null };
  return cancellationDecision(order);
}

export function transitionMessage(current: string, next: string, allowed: string[]) {
  const from = labelFor(current);
  const to = labelFor(next);
  if (!allowed.length) {
    return `${from} cannot be moved to ${to}. Use cancel, return, or refund when that action is allowed.`;
  }
  return `${from} cannot move to ${to}. The next status must be ${allowed.map(labelFor).join(' or ')}.`;
}

export type JourneyEvent = {
  status: string;
  created_at?: Date | string | null;
};

export function buildJourney(status: string | null | undefined, events: JourneyEvent[]) {
  const current = canonicalStatus(status);
  const happyIndex = JOURNEY_STEPS.findIndex((step) => step.status === current);
  const reached = new Set(events.map((event) => canonicalStatus(event.status)));
  return JOURNEY_STEPS.map((step, index) => {
    const event = events.find((item) => canonicalStatus(item.status) === step.status);
    let state: 'complete' | 'current' | 'upcoming' = 'upcoming';
    if (happyIndex >= 0) {
      if (current === 'delivered' || index < happyIndex) state = 'complete';
      else if (index === happyIndex) state = 'current';
    } else if (reached.has(step.status)) {
      state = 'complete';
    }
    return {
      status: step.status,
      label: step.label,
      description: step.description,
      state,
      at: event?.created_at || null,
    };
  });
}

export function nextStatuses(status?: string | null) {
  const current = canonicalStatus(status);
  return (TRANSITIONS[current] || []).map((value) => ({
    status: value,
    label: labelFor(value),
  }));
}

export function backfillPlan(order: OrderSnapshot & { created_at?: Date | string | null }) {
  const status = canonicalStatus(order.status);
  const placedAt = order.created_at || order.updated_at || new Date();
  const rows: { status: string; label: string; note: string; created_at: Date | string }[] = [
    {
      status: 'pending',
      label: 'Order placed',
      note: 'Checkout started',
      created_at: placedAt,
    },
  ];
  if (status === 'failed') {
    rows.push({
      status: 'failed',
      label: 'Payment failed',
      note: 'Payment was not captured',
      created_at: order.updated_at || placedAt,
    });
    return rows;
  }
  if (wasCharged(order) || !['pending', 'cancelled'].includes(status)) {
    rows.push({
      status: 'order_received',
      label: 'Order received',
      note: 'Payment confirmed',
      created_at: placedAt,
    });
  }
  if (!['pending', 'order_received', 'failed'].includes(status)) {
    rows.push({
      status,
      label: labelFor(status),
      note: 'Recorded from the current order status',
      created_at: order.updated_at || placedAt,
    });
  }
  return rows;
}
