import { IClientManagerService } from '../../../core/service/ClientManagerService';
import { WebSocketClientsController } from '../module/WebSocketClientsController';
import { IncomingMessage, OutgoingReplayMessage, STATUS } from '../types/webSocketBotCommandTypes';

export async function checkNotOnlineBot(botID: string, message: IncomingMessage, clientManager:IClientManagerService) {
	if (!botID) {
		return {
			command: message.command,
			botID: message.botID,
			status: STATUS.ERROR,
			errorMessage: "ID бота пуст"
		}
	}

	if(!(await clientManager.isPossibleBot(botID))) {
		return {
			command: message.command,
			botID: message.botID,
			status: STATUS.ERROR,
			errorMessage: "Не корретный ID бота"
		}
	}

	const isOnline = await clientManager.checkOnline(botID)

	if (!isOnline) {
		return {
			command: message.command,
			botID: message.botID,
			status: STATUS.ERROR,
			errorMessage: "Бот оффлайн"
		}
	}

	return null
}