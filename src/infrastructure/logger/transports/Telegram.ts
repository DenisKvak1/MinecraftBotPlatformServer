import Transport from 'winston-transport';
import { Telegraf, Context } from 'telegraf';
import { config } from '../../../core/config';

export class TelegramTransport extends Transport {
	private telegramBotAPI: string;
	private receiverIdList: string[];
	private bot: Telegraf;

	constructor(telegramBotAPI: string, receiverIdList: string[]) {
		super();

		this.bot = new Telegraf(telegramBotAPI)
		this.receiverIdList = receiverIdList;
		this.telegramBotAPI = telegramBotAPI;
	}

	private sendMessage(chatID: string, message: string) {
		this.bot.telegram.sendMessage(chatID, message);
	}

	private broadcast(message: string) {
		this.receiverIdList.forEach((chatId) => {
			try {
				this.sendMessage(chatId, message);
			} catch (e){

			}
		});
	}

	log(info: any, next: () => void): any {
		this.broadcast(info.message)
		next()
	}
}
