import dotenv from 'dotenv';
import path from 'path';

// Load root .env
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  webPort: parseInt(process.env.WEB_PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_auctionos_jwt_token_key_change_in_production_min32chars',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://auctionos:auctionos_secret_password@localhost:5432/auctionos_db?schema=public',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379'
};
