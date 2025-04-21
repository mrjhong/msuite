import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 5000,
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  },
  secretKeyCrypt: process.env.CRYPTO_SECRET,
  jwtSecret: process.env.JWT_SECRET,
};