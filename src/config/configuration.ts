export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  database: {
    host: process.env.BD_HOST,
    port: process.env.BD_PORT || 5432,
    username: process.env.BD_USER,
    password: process.env.BD_PASSWORD,
    name: process.env.BD_NAME,
  },
  security: {
    jwtSecret: process.env.JWT_SECRET,
    otpKey: process.env.OTP_KEY,
    secretKey: process.env.SECRET_KEY,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
});