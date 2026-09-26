import { Injectable } from '@nestjs/common';

@Injectable()
export class PlanService {
  private readonly plans = [
    {
      plan_name: 'Free',
      plan_description: 'Get started with digital business cards.',
      original_monthly_price: 0,
      discounted_monthly_price: 0,
      original_yearly_price: 0,
      discounted_yearly_price: 0,
      allowed_users: 1,
      allowed_cards: 1,
      plan_key: 'FREE',
    },
    {
      plan_name: 'Business',
      plan_description: 'Customize, brand, and analyze your cards.',
      original_monthly_price: 100,
      discounted_monthly_price: 60,
      original_yearly_price: 100 * 12,
      discounted_yearly_price: 60 * 10,
      allowed_users: 30,
      allowed_cards: 30,
      plan_key: 'BUSINESS',
    },
    // {
    //   plan_name: 'Enterprise',
    //   plan_description:
    //     'Customize, brand, and manage unlimited cards and users.',
    //   original_monthly_price: 250,
    //   discounted_monthly_price: 200,
    //   original_yearly_price: 250 * 12,  // Original yearly is 12 months of original monthly price
    //   discounted_yearly_price: 200 * 10,  // 10 months of discounted monthly price
    //   allowed_users: -1,
    //   allowed_cards: -1,
    //   plan_key: 'ENTERPRISE',
    // },
    {
      plan_name: 'Enterprise',
      plan_description:
        'Customize, manage unlimited cards and users.',
      original_monthly_price: -1,
      discounted_monthly_price: -1,
      original_yearly_price: -1, // Original yearly is 12 months of original monthly price
      discounted_yearly_price: -1, // 10 months of discounted monthly price
      allowed_users: -1,
      allowed_cards: -1,
      plan_key: 'ENTERPRISE',
    },
  ];

  private readonly planOptions = [
    { name: 'Design unique digital business cards' },
    { name: 'Add your photo, contact details, logo, links, and more' },
    { name: 'Share your cards without limits' },
    { name: 'Track and manage your connections' },
    { name: 'Access detailed card analytics' },
    { name: 'Generate custom QR codes' },
    { name: 'Sync your cards across all devices' },
  ];

  getPlans() {
    return this.plans.map((plan) => ({
      ...plan,
      options: this.planOptions,
    }));
  }
}
