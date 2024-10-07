import { createLogger, format, transports } from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Custom format to mimic pino-lambda output for CloudWatch
const lambdaFormat = format.printf(({ level, message, lambdaContext, data }) => {

  return JSON.stringify({
    ...lambdaContext,
    timestamp: new Date().toISOString(),
    requestId: lambdaContext.awsRequestId,
    level: level.replace(/\u001b\[.*?m/g, ''),
    message: message,
    data: data,
    
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

  buildErrorLogEntry() {
    return this.logger.error(this.logEntry);
  }
}


// Function to initialize the logger with the Lambda context
function initLogger(event, context) {
  // Extract AWS request ID and any other relevant information
  const xCorrelationId = event.headers && event.headers['x-correlation-id'] || uuidv4();
  logger.defaultMeta = { 
    lambdaContext: {
      correlationId: xCorrelationId,
      awsRequestId: context.awsRequestId,
      apiRequestId: event.requestContext?.requestId,
    }
  };
  return new LogBuilder(logger, { lambdaContext: logger.defaultMeta.lambdaContext });
}

export { logger, initLogger, LogBuilder };
