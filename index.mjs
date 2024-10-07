import { logger, initLogger } from './logger.mjs';

const logBuilder = initLogger({} || event, {} || context);

// Example usage for info and debug logging
logBuilder
  .withMessage("Operation successful")
  .withData({ userId: 123, operation: "update" })
  .buildLogEntry().info; // Log at info level

// Example usage for error logging
logBuilder
  .withMessage("Operation failed")
  .withData({ userId: 123, error: "Invalid input" }).buildErrorLogEntry(); // Log at error level