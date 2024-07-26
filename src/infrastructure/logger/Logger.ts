import { winstonLogger } from './index';
import { config } from '../../core/config';

export enum ErrorLevels {
	INFO = 'info',
	WARN = 'warn',
	ERROR = 'error',
	DEBUG = 'debug'
}

export class Logger {
	info(message: string){
		if (!config.logger) return
		winstonLogger.info(message);
	}

	warn(message: string){
		if (!config.logger) return
		winstonLogger.warn(message);
	}

	error(message: string){
		if (!config.logger) return
		winstonLogger.error(message);
	}
}
export const logger = new Logger()