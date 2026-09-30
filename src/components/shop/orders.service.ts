import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';
import { ShopOrder } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderEvent } from './entities/order-event.entity';
import { CartService } from './cart.service';
import { Product } from './entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CustomerLookup, findCustomer } from './customer-lookup';
import {
  backfillPlan,
  addressDecision,
  buildJourney,
  cancellationDecision,
  canonicalStatus,
  chargedAmount,
  labelFor,
  money,
  nextStatuses,
  partialCancelDecision,
  refundDecision,
  returnDecision,
  shouldRestoreStock,
  transitionMessage,
  wasCharged,
} from './order-journey';

export type OrderActor = {
  id?: string;
  role: string;
  name?: string;
  allowForce?: boolean;
};

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(
    @InjectRepository(ShopOrder)
    private readonly orders: Repository<ShopOrder>,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(OrderEvent)
    private readonly events: Repository<OrderEvent>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly cartService: CartService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.orders.query('CREATE SEQUENCE IF NOT EXISTS shop_order_public_seq');
    const missing = await this.orders.find({
      where: { order_number: IsNull() },
      order: { created_at: 'ASC' },
    });
    for (const order of missing) {
      await this.assignOrderNumber(order);
    }
    await this.orders
      .createQueryBuilder()
      .update()
      .set({ paid_amount: () => '"total"' })
      .where('paid_amount = 0')
      .andWhere(
        `(payment_status IN (:...paid) OR (razorpay_payment_id IS NOT NULL AND status NOT IN (:...open)))`,
        {
          paid: ['paid', 'partially_refunded', 'refund_initiated', 'refunded'],
          open: ['pending', 'failed'],
        },
      )
      .execute();
  }

  private async assignOrderNumber(order: ShopOrder) {
    if (order.order_number) return order.order_number;
    const rows = await this.orders.query(`SELECT nextval('shop_order_public_seq')::int AS n`);
    const orderNumber = `order_${rows[0].n}`;
    await this.orders.update(order.id, { order_number: orderNumber });
    order.order_number = orderNumber;
    return orderNumber;
  }

  private orderKey(id: string) {
    return /^order_\d+$/i.test(String(id || '').trim())
      ? { order_number: String(id).trim().toLowerCase() }
      : { id };
  }

  private envValue(name: string) {
    const raw = this.configService.get<string>(name) || process.env[name] || '';
    return raw.trim().replace(/^['"]|['"]$/g, '');
  }

  private razorpayKey() {
    return this.envValue('RAZORPAY_KEY_ID') || this.envValue('RAZORPAY_KEY');
  }

  private razorpaySecret() {
    return this.envValue('RAZORPAY_KEY_SECRET');
  }

  async checkout(userId: string, shipping: any) {
    const cart = await this.cartService.getOrCreate(userId);
    if (!cart.items.length) {
      throw new BadRequestException('Your cart is empty');
    }
    if (!shipping?.shipping_name || !shipping?.address || !shipping?.phone) {
      throw new BadRequestException('Name, phone, and address are required');
    }

    const pending = await this.orders.find({
      where: { user_id: userId, status: 'pending' },
      relations: ['items', 'events'],
    });
    for (const previous of pending) {
      await this.cancelOrder(
        previous.id,
        { reason: 'Replaced by a new checkout' },
        { id: userId, role: 'user' },
      );
    }

    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(`${item.product.name} is out of stock`);
      }
    }

    const order = await this.orders.save(
      this.orders.create({
        user_id: userId,
        status: 'pending',
        total: cart.subtotal,
        shipping_name: shipping.shipping_name,
        phone: shipping.phone,
        address: shipping.address,
        city: shipping.city || '',
        pincode: shipping.pincode || '',
        payment_status: 'unpaid',
        refund_status: 'none',
        events: [
          this.events.create({
            status: 'pending',
            label: 'Order placed',
            note: 'Waiting for payment',
            actor_role: 'user',
            actor_id: userId,
          }),
        ],
        items: cart.items.map((item) =>
          this.orderItems.create({
            product_id: item.product.id,
            name: item.product.name,
            image_url: item.product.image_url,
            price: Number(item.product.price),
            quantity: item.quantity,
          }),
        ),
      }),
    );

    const amount = Math.round(Number(order.total) * 100);
    const secret = this.razorpaySecret();
    const key = this.razorpayKey();
    if (!key || !secret) {
      throw new BadRequestException('Razorpay is not configured on the server');
    }
    const razorpay = new Razorpay({ key_id: key, key_secret: secret });
    let razorpayOrderId = '';
    try {
      const razorpayOrder = await razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt: order.id.replace(/-/g, '').slice(0, 40),
      });
      razorpayOrderId = razorpayOrder.id;
      order.razorpay_order_id = razorpayOrderId;
      await this.orders.save(order);
    } catch {
      razorpayOrderId = '';
    }

    await this.orders.save(order);
    await this.assignOrderNumber(order);

    return {
      order_id: order.id,
      order_number: order.order_number,
      amount,
      currency: 'INR',
      key,
      razorpay_order_id: razorpayOrderId,
      total: order.total,
    };
  }

  async confirm(userId: string, body: any) {
    const order = await this.orders.findOne({
      where: { ...this.orderKey(body.order_id), user_id: userId },
      relations: ['items', 'events'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (['paid', 'order_received'].includes(order.status) || order.payment_status === 'paid') {
      await this.ensureHistory(order);
      return this.toView(order);
    }
    if (!['pending', 'failed'].includes(order.status)) {
      throw new BadRequestException('This order can no longer be paid');
    }
    if (!body.razorpay_payment_id) {
      throw new BadRequestException('Payment id is required');
    }

    const secret = this.razorpaySecret();
    const razorpayOrderId = body.razorpay_order_id || order.razorpay_order_id;
    if (secret && razorpayOrderId && body.razorpay_signature) {
      const payload = `${razorpayOrderId}|${body.razorpay_payment_id}`;
      const expected = createHmac('sha256', secret).update(payload).digest('hex');
      const given = String(body.razorpay_signature || '');
      const valid =
        expected.length === given.length &&
        timingSafeEqual(Buffer.from(expected), Buffer.from(given));
      if (!valid) {
        order.status = 'failed';
        order.payment_status = 'failed';
        await this.orders.save(order);
        await this.appendEvent(order, {
          status: 'failed',
          label: 'Payment failed',
          note: 'Payment verification failed',
          actor: { id: userId, role: 'user' },
        });
        throw new BadRequestException('Payment verification failed');
      }
    }

    const reserved = [];
    for (const item of order.items) {
      if (!item.product_id) continue;
      const product = await this.products.findOne({ where: { id: item.product_id } });
      if (!product || product.stock < item.quantity) {
        order.status = 'failed';
        order.payment_status = order.razorpay_payment_id || body.razorpay_payment_id ? 'paid' : 'failed';
        order.razorpay_payment_id = body.razorpay_payment_id;
        await this.orders.save(order);
        await this.appendEvent(order, {
          status: 'failed',
          label: 'Could not fulfill order',
          note: `${item.name} is out of stock. The payment was captured and can be refunded.`,
          actor: { id: userId, role: 'user' },
        });
        throw new BadRequestException(`${item.name} no longer has enough stock`);
      }
      reserved.push({ product, quantity: item.quantity });
    }
    for (const row of reserved) {
      row.product.stock -= row.quantity;
      await this.products.save(row.product);
    }

    order.previous_status = order.status;
    order.status = 'order_received';
    order.payment_status = 'paid';
    order.paid_amount = money(Number(order.total));
    order.razorpay_payment_id = body.razorpay_payment_id;
    order.razorpay_order_id = body.razorpay_order_id || order.razorpay_order_id;
    await this.orders.save(order);
    await this.appendEvent(order, {
      status: 'order_received',
      label: 'Order received',
      note: 'Payment confirmed',
      actor: { id: userId, role: 'user' },
    });
    await this.cartService.clear(userId);
    return this.findMineOne(userId, order.id);
  }

  async findMine(userId: string) {
    const orders = await this.orders.find({
      where: { user_id: userId },
      relations: ['items', 'events'],
      order: { created_at: 'DESC' },
    });
    const views = [];
    for (const order of orders) {
      await this.ensureHistory(order);
      views.push(this.toView(order));
    }
    return views;
  }

  async findMineOne(userId: string, id: string) {
    const order = await this.loadOrder(id);
    if (order.user_id !== userId) {
      throw new NotFoundException('Order not found');
    }
    return this.toView(order);
  }

  async findAll() {
    const orders = await this.orders.find({
      relations: ['items', 'events'],
      order: { created_at: 'DESC' },
    });
    return this.attachCustomers(orders);
  }

  async checkoutForCustomer(lookup: CustomerLookup, shipping: any) {
    const user = await this.customerFromLookup(lookup);
    return this.checkout(user.id, shipping);
  }

  async confirmForCustomer(lookup: CustomerLookup, body: any) {
    const user = await this.customerFromLookup(lookup);
    const order = await this.confirm(user.id, body);
    const listed = await this.findByCustomer(lookup);
    return { paid_order_id: order.id, ...listed };
  }

  async findByCustomer(lookup: CustomerLookup) {
    const user = await this.customerFromLookup(lookup);
    const orders = await this.orders.find({
      where: { user_id: user.id },
      relations: ['items', 'events'],
      order: { created_at: 'DESC' },
    });
    const views = [];
    for (const order of orders) {
      await this.ensureHistory(order);
      views.push(this.toView(order, user.email, user.first_name, user.last_name));
    }
    return {
      customer: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
      },
      orders: views,
    };
  }

  async customerFromLookup(lookup: CustomerLookup) {
    return findCustomer(this.users, lookup);
  }

  async getForPartner(id: string, lookup: CustomerLookup) {
    await this.assertPartnerCustomer(id, lookup);
    return this.getForActor(id, { role: 'api', allowForce: false });
  }

  async assertPartnerCustomer(id: string, lookup: CustomerLookup) {
    const user = await this.customerFromLookup(lookup);
    const order = await this.loadOrder(id);
    if (order.user_id !== user.id) {
      throw new NotFoundException('Order not found');
    }
    return user;
  }

  private async attachCustomers(orders: ShopOrder[]) {
    const ids = [...new Set(orders.map((order) => order.user_id).filter(Boolean))];
    const users = ids.length
      ? await this.users
          .createQueryBuilder('user')
          .select([
            'user.id',
            'user.email',
            'user.first_name',
            'user.last_name',
          ])
          .where('user.id IN (:...ids)', { ids })
          .getMany()
      : [];
    const byId = new Map(users.map((user) => [user.id, user]));
    const views = [];
    for (const order of orders) {
      await this.ensureHistory(order);
      const customer = byId.get(order.user_id);
      views.push(
        this.toView(order, customer?.email, customer?.first_name, customer?.last_name, true),
      );
    }
    return views;
  }

  async getForActor(id: string, actor: OrderActor) {
    const order = await this.loadOrder(id);
    this.assertCanView(order, actor);
    return this.toView(order, undefined, undefined, undefined, this.canManageOrder(actor));
  }

  async getStatus(id: string, actor: OrderActor) {
    const view = await this.getForActor(id, actor);
    return {
      order_id: view.order_number || view.id,
      id: view.id,
      order_number: view.order_number,
      status: view.status,
      status_label: view.status_label,
      payment_status: view.payment_status,
      refund_status: view.refund_status,
      refunded_amount: view.refunded_amount,
      tracking_id: view.tracking_id,
      carrier: view.carrier,
      journey: view.journey,
      timeline: view.timeline,
      actions: view.actions,
      updated_at: view.updated_at,
    };
  }

  async updateFulfillment(id: string, body: any, actor: OrderActor) {
    if (actor.role === 'user') {
      throw new ForbiddenException('Customers cannot update the shipment status');
    }
    const order = await this.loadOrder(id);
    const current = canonicalStatus(order.status);
    const next = canonicalStatus(body.status);
    if (body.force) {
      if (!actor.allowForce) {
        throw new ForbiddenException('Only a superadmin can override the shipment timeline');
      }
      if (!String(body.note || '').trim()) {
        throw new BadRequestException('A note is required when overriding the shipment timeline');
      }
    }
    if (next === 'cancelled') {
      if (!String(body.note || '').trim()) {
        throw new BadRequestException('A note is required to cancel an order');
      }
      return this.cancelOrder(id, { reason: body.note }, actor);
    }
    if (next === 'return_requested') {
      if (!String(body.note || '').trim()) {
        throw new BadRequestException('A note is required to request a return');
      }
      return this.requestReturn(id, { reason: body.note }, actor, { force: Boolean(body.force) });
    }
    if (next === current) {
      return this.recordScan(order, body, actor);
    }
    const allowed = nextStatuses(current).map((step) => step.status);
    if (!body.force && !allowed.includes(next)) {
      throw new BadRequestException(transitionMessage(current, next, allowed));
    }
    if (['refunded', 'refund_initiated', 'pending', 'failed'].includes(next)) {
      throw new BadRequestException(`${labelFor(next)} is not set from the shipment update`);
    }
    this.applyShipmentFields(order, body);
    if (next === 'delivered' && !order.delivered_at) {
      order.delivered_at = new Date();
    }
    if (next === 'returned') {
      await this.restoreStock(order);
    }
    order.previous_status = order.status;
    order.status = next;
    await this.orders.save(order);
    await this.appendEvent(order, {
      status: next,
      label: labelFor(next),
      note: body.note || (body.force ? 'Status corrected by superadmin' : null),
      location: body.location,
      tracking_id: body.tracking_id || order.tracking_id,
      carrier: body.carrier || order.carrier,
      actor,
    });
    return this.getForActor(id, { ...actor, role: 'admin' });
  }

  async cancelOrder(id: string, body: { reason: string; items?: { item_id: string; quantity: number }[] }, actor: OrderActor) {
    if (body.items?.length) {
      return this.cancelItems(id, body, actor);
    }
    const order = await this.loadOrder(id);
    this.assertCanView(order, actor);
    const decision = cancellationDecision(order);
    if (!decision.allowed) {
      throw new BadRequestException(decision.reason);
    }
    const reason = String(body.reason || '').trim();
    if (reason.length < 3) {
      throw new BadRequestException('A cancellation reason is required');
    }
    if (shouldRestoreStock(order)) {
      await this.restoreStock(order);
    }
    for (const item of order.items || []) {
      item.cancelled_quantity = item.quantity;
    }
    if (order.items?.length) await this.orderItems.save(order.items);
    order.cancelled_amount = money(chargedAmount(order) || Number(order.total || 0));
    order.total = 0;
    order.previous_status = order.status;
    order.status = 'cancelled';
    order.cancel_reason = reason;
    order.cancelled_at = new Date();
    if (wasCharged(order) && order.refund_status === 'none') {
      order.refund_status = 'eligible';
    }
    await this.orders.save(order);
    await this.appendEvent(order, {
      status: 'cancelled',
      label: 'Cancelled',
      note: reason,
      actor,
    });
    return this.getForActor(id, actor.role === 'user' ? actor : { ...actor, role: 'admin' });
  }

  async cancelItems(
    id: string,
    body: { reason: string; items?: { item_id: string; quantity: number }[] },
    actor: OrderActor,
  ) {
    const order = await this.loadOrder(id);
    this.assertCanView(order, actor);
    const staff = this.canManageOrder(actor);
    const decision = partialCancelDecision(order, staff);
    if (!decision.allowed) throw new BadRequestException(decision.reason);
    const reason = String(body.reason || '').trim();
    if (reason.length < 3) throw new BadRequestException('A cancellation reason is required');
    const lines = body.items || [];
    if (!lines.length) throw new BadRequestException('Choose at least one item to cancel');
    let cancelledValue = 0;
    const notes: string[] = [];
    const shipped = ['shipped', 'in_transit', 'out_for_delivery', 'delivery_failed', 'return_requested', 'return_in_transit', 'returned'].includes(
      canonicalStatus(order.status),
    );
    for (const line of lines) {
      const item = (order.items || []).find((row) => row.id === line.item_id);
      if (!item) throw new BadRequestException('That item is not on this order');
      const active = item.quantity - Number(item.cancelled_quantity || 0);
      const qty = Math.floor(Number(line.quantity));
      if (qty < 1 || qty > active) {
        throw new BadRequestException(`${item.name} only has ${active} unit${active === 1 ? '' : 's'} that can be cancelled`);
      }
      if (!shipped && item.product_id && shouldRestoreStock(order)) {
        await this.products.increment({ id: item.product_id }, 'stock', qty);
      }
      item.cancelled_quantity = Number(item.cancelled_quantity || 0) + qty;
      cancelledValue += Number(item.price) * qty;
      notes.push(`${qty} × ${item.name}`);
    }
    await this.orderItems.save(order.items);
    order.cancelled_amount = money(Number(order.cancelled_amount || 0) + cancelledValue);
    order.total = money(
      (order.items || []).reduce(
        (sum, item) => sum + Number(item.price) * (item.quantity - Number(item.cancelled_quantity || 0)),
        0,
      ),
    );
    const activeLeft = (order.items || []).some((item) => item.quantity - Number(item.cancelled_quantity || 0) > 0);
    if (!activeLeft) {
      order.previous_status = order.status;
      order.status = 'cancelled';
      order.cancel_reason = reason;
      order.cancelled_at = new Date();
    }
    if (wasCharged(order) && ['none', 'refunded', 'failed', 'not_received'].includes(order.refund_status || 'none')) {
      order.refund_status = order.refund_status === 'not_received' ? 'not_received' : 'eligible';
    }
    await this.orders.save(order);
    await this.appendEvent(order, {
      status: activeLeft ? canonicalStatus(order.status) : 'cancelled',
      label: activeLeft ? 'Items cancelled' : 'Cancelled',
      note: `${notes.join(', ')}. ${reason}`,
      actor,
    });
    return this.getForActor(id, actor.role === 'user' ? actor : { ...actor, role: 'admin' });
  }

  async updateAddress(id: string, body: any, actor: OrderActor) {
    const order = await this.loadOrder(id);
    this.assertCanView(order, actor);
    const staff = this.canManageOrder(actor);
    const decision = addressDecision(order, staff);
    if (!decision.allowed) throw new BadRequestException(decision.reason);
    const name = String(body.shipping_name || '').trim();
    const phone = String(body.phone || '').trim();
    const address = String(body.address || '').trim();
    if (!name || !phone || !address) {
      throw new BadRequestException('Name, phone, and address are required');
    }
    const previous = [order.shipping_name, order.address, order.city, order.pincode].filter(Boolean).join(', ');
    order.shipping_name = name;
    order.phone = phone;
    order.address = address;
    order.city = String(body.city || '').trim();
    order.pincode = String(body.pincode || '').trim();
    await this.orders.save(order);
    const next = [order.shipping_name, order.address, order.city, order.pincode].filter(Boolean).join(', ');
    await this.appendEvent(order, {
      status: canonicalStatus(order.status),
      label: 'Address updated',
      note: `${previous} → ${next}`,
      actor,
    });
    return this.getForActor(id, actor.role === 'user' ? actor : { ...actor, role: 'admin' });
  }

  async updateRefundStatus(id: string, body: any, actor: OrderActor) {
    if (!this.canManageOrder(actor)) {
      throw new ForbiddenException('Only an admin can change the refund status');
    }
    const order = await this.loadOrder(id);
    const next = String(body.status || '').trim();
    const allowed = ['eligible', 'initiated', 'processing', 'partially_refunded', 'refunded', 'not_received', 'failed'];
    if (!allowed.includes(next)) throw new BadRequestException('Invalid refund status');
    if (!wasCharged(order) && next !== 'failed') {
      throw new BadRequestException('Refund status can be changed only after the order is paid');
    }
    if (next === 'not_received' && !['processing', 'refunded', 'partially_refunded', 'not_received'].includes(order.refund_status || '')) {
      throw new BadRequestException('Mark a refund as not received only after one has been sent');
    }
    if (next === 'not_received' && ['refunded', 'partially_refunded'].includes(order.refund_status || '')) {
      order.refunded_amount = 0;
      order.payment_status = 'paid';
      if (order.status === 'refunded' && order.previous_status) {
        order.status = order.previous_status;
      }
    }
    if (next === 'refunded') {
      const paid = chargedAmount(order);
      order.refunded_amount = paid;
      order.payment_status = 'refunded';
      order.previous_status = order.status === 'refunded' ? order.previous_status : order.status;
      order.status = 'refunded';
      if (body.reference) order.refund_reference = String(body.reference).trim();
    }
    if (next === 'partially_refunded') {
      order.payment_status = 'partially_refunded';
      if (body.reference) order.refund_reference = String(body.reference).trim();
    }
    if (next === 'failed') {
      order.payment_status = wasCharged(order) ? order.payment_status === 'refunded' ? 'paid' : order.payment_status : 'failed';
    }
    order.refund_status = next;
    order.refund_note = String(body.note || '').trim() || order.refund_note;
    await this.orders.save(order);
    const refundLabels: Record<string, string> = {
      eligible: 'Refund eligible',
      initiated: 'Refund initiated',
      processing: 'Refund processing',
      partially_refunded: 'Partially refunded',
      refunded: 'Refunded',
      not_received: 'Refund not received',
      failed: 'Refund failed',
    };
    await this.appendEvent(order, {
      status: next === 'refunded' ? 'refunded' : 'refund_initiated',
      label: refundLabels[next] || 'Refund updated',
      note: body.note || `Refund status set to ${next.replace(/_/g, ' ')}`,
      actor,
    });
    return this.getForActor(id, { ...actor, role: 'admin' });
  }

  private canManageOrder(actor: OrderActor) {
    return actor.role === 'admin' || actor.role === 'superadmin' || actor.role === 'api';
  }

  async requestReturn(id: string, body: { reason: string }, actor: OrderActor, opts?: { force?: boolean }) {
    const order = await this.loadOrder(id);
    this.assertCanView(order, actor);
    const decision = returnDecision(order);
    const force = Boolean(opts?.force && actor.allowForce);
    if (!decision.allowed && !force) {
      throw new BadRequestException(decision.reason);
    }
    const reason = String(body.reason || '').trim();
    if (reason.length < 3) {
      throw new BadRequestException('A return reason is required');
    }
    order.previous_status = order.status;
    order.status = 'return_requested';
    order.return_reason = reason;
    order.return_requested_at = new Date();
    await this.orders.save(order);
    await this.appendEvent(order, {
      status: 'return_requested',
      label: 'Return requested',
      note: reason,
      actor,
    });
    return this.getForActor(id, actor.role === 'user' ? actor : { ...actor, role: 'admin' });
  }

  async refundOrder(id: string, body: any, actor: OrderActor) {
    if (actor.role === 'user' || actor.role === 'store') {
      throw new ForbiddenException('Only a superadmin or a refund API key can refund an order');
    }
    const order = await this.loadOrder(id);
    const decision = refundDecision(order);
    if (!decision.allowed) {
      throw new BadRequestException(decision.reason);
    }
    const remaining = decision.refundable_amount;
    const amount = body.amount == null ? remaining : money(Number(body.amount));
    if (!(amount > 0)) {
      throw new BadRequestException('Refund amount must be greater than zero');
    }
    if (amount - remaining > 0.001) {
      throw new BadRequestException(`Refund amount cannot exceed the remaining ${remaining.toFixed(2)}`);
    }
    if (body.mark_completed) {
      if (!String(body.reference || '').trim()) {
        throw new BadRequestException('reference is required to complete a refund manually');
      }
      return this.completeRefund(order, amount, String(body.reference).trim(), body.note, actor);
    }
    const already = order.refund_status === 'initiated';
    if (!already) {
      order.refund_status = 'initiated';
      await this.orders.save(order);
      await this.appendEvent(order, {
        status: 'refund_initiated',
        label: 'Refund initiated',
        note: body.note || `Refund of ₹${amount.toFixed(2)} started`,
        actor,
      });
    }
    const paymentId = order.razorpay_payment_id;
    const secret = this.razorpaySecret();
    const key = this.razorpayKey();
    if (paymentId && secret && key) {
      try {
        const razorpay = new Razorpay({ key_id: key, key_secret: secret });
        const result = await razorpay.payments.refund(paymentId, {
          amount: Math.round(amount * 100),
          speed: 'normal',
          notes: { order_id: order.id },
        });
        return this.completeRefund(order, amount, result.id, body.note, actor);
      } catch (error) {
        const message = error?.error?.description || error?.message || 'Razorpay refund failed';
        await this.appendEvent(order, {
          status: 'refund_initiated',
          label: 'Refund could not reach the gateway',
          note: message,
          actor,
        });
        throw new BadRequestException(message);
      }
    }
    if (already) {
      throw new BadRequestException(
        'A refund is already initiated. Complete it with mark_completed and a reference.',
      );
    }
    return this.getForActor(id, { ...actor, role: 'admin' });
  }

  async updateStatus(id: string, status: string, actor: OrderActor) {
    return this.updateFulfillment(id, { status }, actor);
  }

  private async completeRefund(
    order: ShopOrder,
    amount: number,
    reference: string,
    note: string | undefined,
    actor: OrderActor,
  ) {
    order.refunded_amount = money(Number(order.refunded_amount || 0) + amount);
    const fully = order.refunded_amount + 0.001 >= money(chargedAmount(order) || Number(order.total || 0));
    order.refund_status = fully ? 'refunded' : 'partially_refunded';
    order.payment_status = fully ? 'refunded' : 'partially_refunded';
    order.refund_reference = reference;
    if (fully) {
      order.previous_status = order.status;
      order.status = 'refunded';
    }
    await this.orders.save(order);
    await this.appendEvent(order, {
      status: fully ? 'refunded' : 'refund_initiated',
      label: fully ? 'Refunded' : 'Partial refund completed',
      note: note || `₹${amount.toFixed(2)} refunded (${reference})`,
      actor,
    });
    return this.getForActor(order.id, { ...actor, role: 'admin' });
  }

  private async recordScan(order: ShopOrder, body: any, actor: OrderActor) {
    const tracking = body.tracking_id || order.tracking_id;
    const carrier = body.carrier || order.carrier;
    const changed = Boolean(
      String(body.note || '').trim() ||
      String(body.location || '').trim() ||
      (body.tracking_id && body.tracking_id !== order.tracking_id) ||
      (body.carrier && body.carrier !== order.carrier),
    );
    if (!changed) {
      return this.getForActor(order.id, { ...actor, role: 'admin' });
    }
    this.applyShipmentFields(order, body);
    await this.orders.save(order);
    await this.appendEvent(order, {
      status: canonicalStatus(order.status),
      label: 'Shipment update',
      note: body.note || null,
      location: body.location,
      tracking_id: tracking,
      carrier,
      actor,
    });
    return this.getForActor(order.id, { ...actor, role: 'admin' });
  }

  private applyShipmentFields(order: ShopOrder, body: any) {
    if (body.tracking_id) order.tracking_id = String(body.tracking_id).trim();
    if (body.carrier) order.carrier = String(body.carrier).trim();
  }

  private async restoreStock(order: ShopOrder) {
    if (order.stock_restored || !shouldRestoreStock(order)) return;
    await this.orders.manager.transaction(async (manager) => {
      for (const item of order.items || []) {
        if (!item.product_id) continue;
        const remaining = item.quantity - Number(item.cancelled_quantity || 0);
        if (remaining <= 0) continue;
        await manager.increment(Product, { id: item.product_id }, 'stock', remaining);
      }
      order.stock_restored = true;
      await manager.update(ShopOrder, order.id, { stock_restored: true });
    });
  }

  private assertCanView(order: ShopOrder, actor: OrderActor) {
    if (['store', 'admin', 'superadmin', 'api'].includes(actor.role)) return;
    if (order.user_id !== actor.id) {
      throw new NotFoundException('Order not found');
    }
  }

  private async loadOrder(id: string) {
    const order = await this.orders.findOne({
      where: this.orderKey(id),
      relations: ['items', 'events'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (!order.order_number) {
      await this.assignOrderNumber(order);
    }
    await this.ensureHistory(order);
    return order;
  }

  private async ensureHistory(order: ShopOrder) {
    const existing = order.events?.length
      ? [...order.events]
      : await this.events.find({
          where: { order: { id: order.id } },
          order: { created_at: 'ASC' },
        });
    if (existing.length) {
      order.events = existing;
      return;
    }
    const rows = backfillPlan(order);
    const saved = [];
    for (const row of rows) {
      saved.push(
        await this.events.save(
          this.events.create({
            order: { id: order.id } as ShopOrder,
            status: row.status,
            label: row.label,
            note: row.note,
            actor_role: 'system',
            created_at: new Date(row.created_at),
          }),
        ),
      );
    }
    order.events = saved;
  }

  private async appendEvent(
    order: ShopOrder,
    input: {
      status: string;
      label: string;
      note?: string | null;
      location?: string | null;
      tracking_id?: string | null;
      carrier?: string | null;
      actor?: OrderActor;
    },
  ) {
    const saved = await this.events.save(
      this.events.create({
        order: { id: order.id } as ShopOrder,
        status: input.status,
        label: input.label,
        note: input.note || null,
        location: input.location || null,
        tracking_id: input.tracking_id || null,
        carrier: input.carrier || null,
        actor_role: input.actor?.role || null,
        actor_id: input.actor?.id || null,
      }),
    );
    order.events = [...(order.events || []), saved];
    return saved;
  }

  private paymentLabel(order: ShopOrder) {
    if (order.payment_status && order.payment_status !== 'unpaid') return order.payment_status;
    return wasCharged(order) ? 'paid' : 'unpaid';
  }

  private toView(order: ShopOrder, email?: string, firstName?: string, lastName?: string, staff = false) {
    const status = canonicalStatus(order.status);
    const timeline = [...(order.events || [])]
      .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
      .map((event) => ({
        id: event.id,
        status: canonicalStatus(event.status),
        label: event.label,
        note: event.note || null,
        location: event.location || null,
        tracking_id: event.tracking_id || null,
        carrier: event.carrier || null,
        actor_role: event.actor_role || null,
        at: event.created_at,
      }));
    const cancel = cancellationDecision(order);
    const partial = partialCancelDecision(order, staff);
    const returns = returnDecision(order);
    const refund = refundDecision(order);
    const address = addressDecision(order, staff);
    return {
      id: order.id,
      order_number: order.order_number,
      user_id: order.user_id,
      status,
      status_label: labelFor(status),
      payment_status: this.paymentLabel(order),
      refund_status: order.refund_status || 'none',
      refund_status_label: labelFor(order.refund_status && order.refund_status !== 'none' ? order.refund_status : 'none'),
      refund_note: order.refund_note || null,
      refunded_amount: money(Number(order.refunded_amount || 0)),
      refund_reference: order.refund_reference || null,
      paid_amount: money(Number(order.paid_amount || 0)),
      cancelled_amount: money(Number(order.cancelled_amount || 0)),
      total: order.total,
      shipping_name: order.shipping_name,
      phone: order.phone,
      address: order.address,
      city: order.city,
      pincode: order.pincode,
      razorpay_order_id: order.razorpay_order_id,
      razorpay_payment_id: order.razorpay_payment_id,
      tracking_id: order.tracking_id || null,
      carrier: order.carrier || null,
      cancel_reason: order.cancel_reason || null,
      cancelled_at: order.cancelled_at || null,
      delivered_at: order.delivered_at || null,
      return_reason: order.return_reason || null,
      return_requested_at: order.return_requested_at || null,
      created_at: order.created_at,
      updated_at: order.updated_at,
      customer_email: email || null,
      customer_name: `${firstName || ''} ${lastName || ''}`.trim() || null,
      items: (order.items || []).map((item) => ({
        id: item.id,
        product_id: item.product_id,
        name: item.name,
        image_url: item.image_url,
        price: item.price,
        quantity: item.quantity,
        cancelled_quantity: Number(item.cancelled_quantity || 0),
        active_quantity: item.quantity - Number(item.cancelled_quantity || 0),
      })),
      journey: buildJourney(status, timeline.map((event) => ({ status: event.status, created_at: event.at }))),
      timeline,
      actions: {
        can_cancel: cancel.allowed,
        cancel_block_reason: cancel.reason,
        can_cancel_items: partial.allowed,
        can_request_return: returns.allowed,
        return_block_reason: returns.reason,
        can_refund: refund.allowed,
        refund_block_reason: refund.reason,
        refundable_amount: refund.refundable_amount,
        can_change_address: address.allowed,
        address_block_reason: address.reason,
        can_set_refund_status: staff && wasCharged(order),
        next_statuses: nextStatuses(status),
      },
    };
  }
}

export function createApiKeyMaterial() {
  const secret = randomBytes(24).toString('hex');
  return `zk_${secret}`;
}
