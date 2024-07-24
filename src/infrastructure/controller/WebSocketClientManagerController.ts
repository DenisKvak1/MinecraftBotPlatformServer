import { IClientManagerService } from '../../core/service/ClientManagerService';
import { webSocketClients, WebSocketClientsController } from '../express/module/WebSocketClientsController';
import { returnWSError, returnWSOk } from '../express/helper/returnWSOk';
import { clientManagerService } from '../services/ClientManagerService';
import { IncomingConnectBotMessage, OutgoingReplayMessage, STATUS } from '../express/types/webSocketBotCommandTypes';

export class WebSocketClientManagerController {
	constructor(
		private clientManager: IClientManagerService,
		private wsClients: WebSocketClientsController,
	) {
	}

	async turnConnectBot(message: IncomingConnectBotMessage) {
		try {
			const botID = message.botID;
			const action = message.data.action;

			const isOnline = await this.clientManager.checkOnline(botID);
			if (action === 'CONNECT') {
				if (isOnline) {
					return this.wsClients.broadcast<OutgoingReplayMessage>({
						command: message.command,
						botID: botID,
						status: STATUS.ERROR,
						errorMessage: 'Бот и так включен',
					});
				}

				this.clientManager.connect(botID);
			}
			if (action === 'DISCONNECT') {
				if (!isOnline) {
					return this.wsClients.broadcast<OutgoingReplayMessage>({
						command: message.command,
						botID: botID,
						status: STATUS.ERROR,
						errorMessage: 'Бот и так выключен',
					});
				}

				this.clientManager.disconnect(botID);
			}


			returnWSOk(message, this.wsClients);
		} catch (e) {
			returnWSError(message, e.message, this.wsClients);
		}
	}
}
export const webSocketClientManagerController = new WebSocketClientManagerController(clientManagerService, webSocketClients)