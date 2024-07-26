import { IChatService } from '../../core/service/ChatService';
import { Subscribe } from '../../../env/helpers/observable';
import { ClientBotRepository } from '../../core/repository/ClientBotRepository/clientBotRepository';
import { botInRAMRepository } from '../database/repository/inRAMBotDateBase';
import { logger } from '../logger/Logger';

export class ChatService implements IChatService {
	constructor(
		private repository: ClientBotRepository,
	) {
	}

	onChatMessage(id: string, callback: (message: string) => void): Subscribe {
		return this.repository.getById(id)?.$chat.subscribe((message) => {
			callback(message);
		});
	}

	sendMessage(id: string, message: string): void {
		const bot = this.repository.getById(id)._bot;
		bot.chat(message);
		logger.info(`${id}: Послал сообщение ${message}`)
	}
}
export const chatService = new ChatService(botInRAMRepository)