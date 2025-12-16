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
});