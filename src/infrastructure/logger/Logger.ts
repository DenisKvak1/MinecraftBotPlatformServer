import { winstonLogger, minecraftBotInfoLogger } from './index';
import { config } from '../../core/config';
import { windowsService } from '../services/WindowService';
import winston from 'winston';

export enum ErrorLevels {
	INFO = 'info',
	WARN = 'warn',
	ERROR = 'error',
	DEBUG = 'debug'
}

export class Logger {
	constructor(private logger: winston.Logger) {}

	info(message: string){
		if (!config.logger) return
		this.logger.info(message);
	}

	warn(message: string){
		if (!config.logger) return
		this.logger.warn(message);
	}

	error(message: string){
		if (!config.logger) return
		this.logger.error(message);
	}
}
export const logger = new Logger(winstonLogger)
export const buyLogger = new Logger(minecraftBotInfoLogger)