import { IClientManagerService } from '../../../core/service/ClientManagerService';
import { IncomingMessage, OutgoingReplayMessage, STATUS } from '../../../../env/types';
import { WebSocketClientsController } from '../module/WebSocketClientsController';

export async function checkNotOnlineBot(botID: string, message: IncomingMessage, clientManager:IClientManagerService) {
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