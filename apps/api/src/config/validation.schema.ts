import * as Joi from 'joi';

/**
 * Environment variables validation schema
 * Ensures all required variables are present and valid
 */
export const validationSchema = Joi.object({
  // Environment
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  // Database
  DATABASE_URL: Joi.string().required(),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('8h'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // API
  API_PORT: Joi.number().default(3001),
  API_PREFIX: Joi.string().default('api/v1'),
  API_CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
});

/**
 * Validation options for ConfigModule
 */
export const validationOptions = {
  abortEarly: false, // Show all errors at once
  allowUnknown: true, // Allow unknown env variables
};
