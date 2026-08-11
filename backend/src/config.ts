import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'samsam-guling-dev-secret',
  databaseUrl: process.env.DATABASE_URL ?? 'file:data/warung.db',
  databaseAuthToken: process.env.DATABASE_AUTH_TOKEN,
  authDisabled: process.env.AUTH_DISABLED === 'true',
};
