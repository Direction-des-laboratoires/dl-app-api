/* eslint-disable prettier/prettier */
export default () => ({
  port:
    process.env.NODE_ENV == 'production'
      ? process.env.PROD_PORT
      : process.env.DEV_PORT,
  dbUrl:
    process.env.NODE_ENV == 'production'
      ? process.env.PROD_DB_URL
      : process.env.DEV_DB_URL,
  privateKey: process.env.PRIVATE_KEY,
  publicKey: process.env.PUBLIC_KEY,
  promobileSmsUrl: process.env.PROMOBILE_SMS_URL,
  promobileSmsAccessKey: process.env.PROMOBILE_SMS_ACCESS_KEY,
  promobileSmsFrom: process.env.PROMOBILE_SMS_FROM,
  // Configuration Mail
  MAIL_HOST: process.env.MAIL_HOST,
  MAIL_PORT: parseInt(process.env.MAIL_PORT || '587', 10),
  MAIL_SECURE: process.env.MAIL_SECURE || false,
  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASSWORD: process.env.MAIL_PASSWORD,
  MAIL_FROM: process.env.MAIL_FROM,
  // Configuration Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:4200',
});
