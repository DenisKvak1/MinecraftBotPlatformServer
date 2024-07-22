import { IClientManagerService } from '../../core/service/ClientManagerService';
import { webSocketClients, WebSocketClientsController } from '../express/module/WebSocketClientsController';
import { IChatService } from '../../core/service/ChatService';
import { IncomingSendChatMessageMessage, OutgoingReplayMessage } from '../../../env/types';
import { checkNotOnlineBot } from '../express/helper/checkOnline';
import { returnWSError, returnWSOk } from '../express/helper/returnWSOk';
import exp from 'node:constants';
import { clientManagerService } from '../services/ClientManagerService';
import { chatService } from '../services/ChatService';

export class WebSocketChatService {
	constructor(
		private chatService: IChatService,
		private clientManager: IClientManagerService,
		private wsClients: WebSocketClientsController,
	) {}

	async sendMessage(message: IncomingSendChatMessageMessage){
		try {
			const botID = message.botID;
			const chatMessage = message.data.message

			const noneOnline = await checkNotOnlineBot(botID, message, this.clientManager)
			if (noneOnline) return this.wsClients.broadcast<OutgoingReplayMessage>(noneOnline)

			this.chatService.sendMessage(botID, chatMessage)

			returnWSOk(message, this.wsClients)
		} catch (e) {
			returnWSError(message, e.errorMessage, this.wsClients)
		}
	}
}
export const webSocketChatServiceController = new WebSocketChatService(chatService, clientManagerService, webSocketClients)