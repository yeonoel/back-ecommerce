export const stripeConfig = {
    apiKey: process.env.STRIPE_API_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
};