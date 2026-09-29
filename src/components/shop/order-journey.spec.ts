import {
  addressDecision,
  cancellationDecision,
  canonicalStatus,
  nextStatuses,
  refundDecision,
  returnDecision,
  shouldRestoreStock,
} from './order-journey';

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

describe('order journey rules', () => {
  it('lets a shopper cancel before the order ships and blocks it afterwards', () => {
    expect(cancellationDecision({ status: 'order_received', payment_status: 'paid' }).allowed).toBe(true);
    expect(cancellationDecision({ status: 'packed', payment_status: 'paid' }).allowed).toBe(true);
    expect(cancellationDecision({ status: 'pending', payment_status: 'unpaid' }).allowed).toBe(true);
    expect(cancellationDecision({ status: 'paid', payment_status: 'paid' }).allowed).toBe(true);

    for (const status of ['shipped', 'in_transit', 'out_for_delivery', 'delivered', 'delivery_failed']) {
      expect(cancellationDecision({ status, payment_status: 'paid' }).allowed).toBe(false);
    }
    expect(cancellationDecision({ status: 'cancelled', payment_status: 'paid' }).allowed).toBe(false);
    expect(cancellationDecision({ status: 'failed', payment_status: 'failed' }).reason).toMatch(/nothing to cancel/i);
  });

  it('opens returns only inside 7 days after delivery', () => {
    expect(returnDecision({ status: 'packed' }).allowed).toBe(false);
    expect(
      returnDecision({ status: 'delivered', delivered_at: new Date(), payment_status: 'paid' }).allowed,
    ).toBe(true);
    expect(
      returnDecision({ status: 'delivered', delivered_at: daysAgo(8), payment_status: 'paid' }).allowed,
    ).toBe(false);
    expect(returnDecision({ status: 'return_requested' }).reason).toMatch(/already open/i);
  });

  it('refunds a paid cancellation or a warehouse return, and blocks a live shipment', () => {
    const paid = { payment_status: 'paid', total: 1000, refunded_amount: 0, razorpay_payment_id: 'pay_1' };
    expect(refundDecision({ ...paid, status: 'order_received' }).allowed).toBe(false);
    expect(refundDecision({ ...paid, status: 'cancelled' }).allowed).toBe(true);
    expect(refundDecision({ ...paid, status: 'cancelled' }).refundable_amount).toBe(1000);
    expect(refundDecision({ ...paid, status: 'in_transit' }).allowed).toBe(false);
    expect(refundDecision({ ...paid, status: 'delivered' }).allowed).toBe(false);
    expect(refundDecision({ ...paid, status: 'return_in_transit' }).allowed).toBe(false);
    expect(refundDecision({ ...paid, status: 'returned', delivered_at: daysAgo(2), return_requested_at: daysAgo(1) }).allowed).toBe(true);
    expect(
      refundDecision({ ...paid, status: 'returned', delivered_at: daysAgo(10), return_requested_at: daysAgo(1) }).allowed,
    ).toBe(false);
    expect(refundDecision({ ...paid, status: 'cancelled', refunded_amount: 1000 }).allowed).toBe(false);
    expect(refundDecision({ status: 'cancelled', payment_status: 'unpaid', total: 1000 }).reason).toMatch(/not paid/i);
    expect(refundDecision({ status: 'failed', payment_status: 'paid', razorpay_payment_id: 'pay_1', total: 500, refunded_amount: 0 }).allowed).toBe(true);
  });

  it('treats a legacy paid status as order received and walks one step at a time', () => {
    expect(canonicalStatus('paid')).toBe('order_received');
    expect(nextStatuses('order_received').map((step) => step.status)).toEqual(['packed']);
    expect(nextStatuses('packed').map((step) => step.status)).toEqual(['shipped']);
    expect(nextStatuses('shipped').map((step) => step.status)).toEqual(['in_transit', 'delivery_failed']);
    expect(nextStatuses('delivered')).toEqual([]);
  });

  it('returns stock for a paid packed order and not for an unpaid checkout', () => {
    expect(shouldRestoreStock({ status: 'packed', payment_status: 'paid', stock_restored: false })).toBe(true);
    expect(shouldRestoreStock({ status: 'pending', payment_status: 'unpaid' })).toBe(false);
    expect(shouldRestoreStock({ status: 'failed', payment_status: 'failed' })).toBe(false);
    expect(shouldRestoreStock({ status: 'packed', stock_restored: true })).toBe(false);
  });

  it('refunds only cancelled units on a live order and allows a refund the customer did not receive', () => {
    const paid = { status: 'order_received', payment_status: 'paid', total: 1500, paid_amount: 3000, cancelled_amount: 1500, refunded_amount: 0 };
    expect(refundDecision(paid).allowed).toBe(true);
    expect(refundDecision(paid).refundable_amount).toBe(1500);
    const missing = { status: 'cancelled', payment_status: 'paid', total: 0, paid_amount: 3000, refund_status: 'not_received', refunded_amount: 0 };
    expect(refundDecision(missing).allowed).toBe(true);
    expect(refundDecision(missing).refundable_amount).toBe(3000);
  });

  it('lets an admin change the address until delivery and locks it for a customer after shipping', () => {
    expect(addressDecision({ status: 'packed' }).allowed).toBe(true);
    expect(addressDecision({ status: 'shipped' }).allowed).toBe(false);
    expect(addressDecision({ status: 'shipped' }, true).allowed).toBe(true);
    expect(addressDecision({ status: 'delivered' }, true).allowed).toBe(false);
  });
});
