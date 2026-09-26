// src/components/razorpay/razorpay.service.ts
import { Injectable } from '@nestjs/common';
import Razorpay from 'razorpay';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { ConfigService } from '@nestjs/config';
import { addDays } from 'date-fns';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PaymentService {
  private razorpay: Razorpay;

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private configService: ConfigService,
  ) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  async createOrder(amount: number, currency: string = 'INR') {
    const options = {
      amount: amount * 100, // Amount in paise
      currency,
      receipt: `receipt_order_${Date.now()}`,
    };
    return this.razorpay.orders.create(options);
  }

  async verifyPayment(req: any, paymentDetails: any) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      paymentDetails;

    const generatedSignature = this.generateSignature(
      razorpay_order_id,
      razorpay_payment_id,
    );
    if (generatedSignature === razorpay_signature) {
      // Payment verified, update the subscription
      const subscription = await this.subscriptionRepository.findOne({
        where: { order_id: razorpay_order_id },
      });
      if (!subscription) {
        return { success: false, message: 'Subscription not found' };
      }
      await this.userRepository.save({
        id: req.user.id,
        subscription_id: subscription.id,
        subscription_plan: subscription.plan_key,
        is_paid: true,
      });
      const endDate = this.calculateEndDate(
        subscription.start_date,
        subscription.plan_type,
      );

      // Update the subscription
      let obj = {
        id: subscription.id,
        is_paid: true,
        end_date: endDate,
      };
      await this.subscriptionRepository.save(obj);
      return { success: true };
    } else {
      return { success: false, message: 'Invalid signature' };
    }
  }

  calculateEndDate(startDate: Date, planType: string) {
    const start = new Date(startDate);
    if (planType === 'month') {
      // Add 30 days to the start date to handle the month duration
      return addDays(start, 30);
    } else if (planType === 'year') {
      // Add 365 days to the start date for a year duration
      return addDays(start, 365);
    } else {
      throw new Error('Invalid plan type');
    }
  }

  private generateSignature(orderId: string, paymentId: string) {
    const crypto = require('crypto');
    return crypto
      .createHmac(
        'sha256',
        this.configService.get<string>('RAZORPAY_KEY_SECRET'),
      )
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
  }
}
