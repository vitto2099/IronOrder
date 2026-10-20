/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  // Node
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  // App
  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),

  // Session
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory', 'database'] as const),

  // Seeders & Initial Provisioning (Opcionais)
  SEED_ADMIN_EMAIL: Env.schema.string.optional({ format: 'email' }),
  SEED_ADMIN_PASSWORD: Env.schema.string.optional(),
  SEED_ADMIN_NAME: Env.schema.string.optional(),
  SEED_MANAGER_EMAIL: Env.schema.string.optional({ format: 'email' }),
  SEED_MANAGER_PASSWORD: Env.schema.string.optional(),
  SEED_WAITER_EMAIL: Env.schema.string.optional({ format: 'email' }),
  SEED_WAITER_PASSWORD: Env.schema.string.optional(),
  SEED_KITCHEN_EMAIL: Env.schema.string.optional({ format: 'email' }),
  SEED_KITCHEN_PASSWORD: Env.schema.string.optional(),
  SEED_CASHIER_EMAIL: Env.schema.string.optional({ format: 'email' }),
  SEED_CASHIER_PASSWORD: Env.schema.string.optional(),
})
