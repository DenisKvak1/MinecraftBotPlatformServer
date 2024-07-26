import { winstonLogger } from './index';

export enum ErrorLevels {
	INFO = 'info',
	WARN = 'warn',
	ERROR = 'error',
	DEBUG = 'debug'
}

export class Logger {
	info(message: string){
		winstonLogger.info(message);
	}

	warn(message: string){
		winstonLogger.warn(message);
	}

	error(message: string){
		winstonLogger.error(message);
	}
}
export const logger = new Logger()