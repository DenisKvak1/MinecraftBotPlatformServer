import { IClientManagerService } from '../../core/service/ClientManagerService';
import { webSocketClients, WebSocketClientsController } from '../express/module/WebSocketClientsController';
import { IncomingConnectBotMessage, OutgoingReplayMessage, STATUS } from '../../../env/types';
import { returnWSError, returnWSOk } from '../express/helper/returnWSOk';
import { clientManagerService } from '../services/ClientManagerService';

export class WebSocketClientManagerController {
	constructor(
		private clientManager: IClientManagerService,
		private wsClients: WebSocketClientsController,
	) {
	}

	turnConnectBot(message: IncomingConnectBotMessage) {
		try {
			const botID = message.botID;
			const action = message.data.action;

			const isOnline = this.clientManager.checkOnline(botID);
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
				if (isOnline) {
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
			returnWSError(message, e.errorMessage, this.wsClients);
		}
	}
}
export const webSocketClientManagerController = new WebSocketClientManagerController(clientManagerService, webSocketClients)