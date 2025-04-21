import crypto from 'crypto';
import config from '../../config.js';

const algorithm = 'aes-256-cbc';
const secretKey = config.secretKeyCrypt;
const iv = crypto.randomBytes(16);

export const  encrypt = (text) => {
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export const decrypt = (text) => {
  const [ivHex, encrypted] = text.split(':');
  const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(ivHex, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

