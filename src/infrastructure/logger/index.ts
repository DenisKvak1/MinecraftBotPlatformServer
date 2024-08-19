import winston from 'winston';
import { config } from '../../core/config';
import { TelegramTransport } from './transports/Telegram';
import Transport from 'winston-transport';

export const winstonLogger = winston.createLogger({
	levels: winston.config.npm.levels,
	level: 'debug',
	format: winston.format.combine(
		winston.format.timestamp({
			format: 'YYYY-MM-DD HH:mm:ss'
		}),
		winston.format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
	),
	transports: [
		new winston.transports.File({ filename: 'app.log' })
	]
});


const autoBuyTransports: Transport[] = [
	new winston.transports.Console(),
	new winston.transports.File({ filename: 'buy.log' })
]
if(config.telegramBotAPIKey) {
	autoBuyTransports.push(new TelegramTransport(config.telegramBotAPIKey, config.telegramBotIdWhiteList))
}

export const winstonLoggerBuyInBot = winston.createLogger({
	levels: winston.config.npm.levels,
	level: 'debug',
	format: winston.format.combine(
		winston.format.timestamp({
			format: 'YYYY-MM-DD HH:mm:ss'
		}),
		winston.format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
	),
	transports: autoBuyTransports
});