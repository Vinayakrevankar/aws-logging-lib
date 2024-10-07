import { logger, initLogger } from './logger.mjs';

  initLogger({} || event, {} || context );
  logger.debug('A log message', { data: 'Some data' });

