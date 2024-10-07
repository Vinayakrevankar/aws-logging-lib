import { createLogger, format, transports } from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Custom format to mimic pino-lambda output for CloudWatch
const lambdaFormat = format.printf(({ level, message, data }) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    correlationId: logger.defaultMeta?.correlationId,
    awsRequestId: logger.defaultMeta?.awsRequestId,
    apiRequestId: logger.defaultMeta?.apiRequestId,
    message: message,
    data: data,
    level: level.replace(/\u001b\[.*?m/g, ''),
  });
});

// Create a logger instance
const logger = createLogger({
  level: 'debug', // Set the lowest level to capture all logs
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    lambdaFormat
  ),
  transports: [
    new transports.Console()
  ]
});

// Extend logger with fluent API for log building
class LogBuilder {
  constructor(baseLogger, initialData = {}) {
    this.logger = baseLogger;
    this.logEntry = initialData;
  }

  withMessage(message) {
    this.logEntry.message = message;
    return this;
  }

  withData(data) {
    this.logEntry.data = data;
    return this;
  }

  buildLogEntry(level = 'info') {
    switch (level) {
      case 'info':
        return this.logger.info(this.logEntry);
      case 'debug':
        return this.logger.debug(this.logEntry);
      case 'error':
        return this.logger.error(this.logEntry);
      default:
        return this.logger.info(this.logEntry);
    }
  }

  // Method to handle error objects specifically
  buildError(error) {
    if (error instanceof Error) {
      // Structure the log entry with error-specific details
      const errorDetails = {
        message: error.message,
        stack: error.stack,
        ...this.logEntry.data, // Include any additional data already set
      };

      // Log the error with all details
      this.logger.error({
        ...this.logEntry,
        level: 'error',
        message: this.logEntry.message || 'An error occurred', // Default message if none provided
        data: errorDetails
      });
    } else {
      // Handle cases where 'error' is not an instance of Error
      this.logger.error({
        ...this.logEntry,
        message: 'A non-error object was passed to buildError',
        data: { error }
      });
    }
  }
}

// Function to initialize the logger with the Lambda context
function initLogger(event, context) {
  // Extract AWS request ID and any other relevant information
  const xCorrelationId = event.headers && event.headers['x-correlation-id'] || uuidv4();
  logger.defaultMeta = {
      correlationId: xCorrelationId,
      awsRequestId: context.awsRequestId,
      apiRequestId: event.requestContext?.requestId,
  };
  return new LogBuilder(logger, {});
}

export { logger, initLogger, LogBuilder };