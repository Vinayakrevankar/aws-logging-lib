import { createLogger, format, transports } from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Custom format to mimic pino-lambda output for CloudWatch
const lambdaFormat = format.printf(({ level, message, lambdaContext }) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    requestId: lambdaContext.awsRequestId,
    level: level.replace(/\u001b\[.*?m/g, ''),
    message: message,
    ...lambdaContext
  });
});

// Create a logger instance
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    lambdaFormat
  ),
  transports: [
    new transports.Console()
  ]
});

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
}

export { logger, initLogger };
