import winston from 'winston';

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
		new winston.transports.Console(),
		new winston.transports.File({ filename: 'app.log' })
	]
});
