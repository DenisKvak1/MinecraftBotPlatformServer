import { IClientManagerService } from '../../../core/service/ClientManagerService';
import { webSocketClients, WebSocketClientsController } from '../../express/module/WebSocketClientsController';
import { returnWSError, returnWSOk } from '../../express/helper/returnWSOk';
import { checkNotOnlineBot } from '../../express/helper/checkOnline';
import { IFarmService } from '../../../core/service/FarmService';
import { farmService } from '../../services/FarmService';
import { clientManagerService } from '../../services/ClientManagerService';
import { IncomingToggleFarmMessage, OutgoingReplayMessage } from '../../express/types/webSocketBotCommandTypes';

export class WebSocketFarmBotController {
	constructor(
		private farmService: IFarmService,
		private clientManager: IClientManagerService,
		private wsClients: WebSocketClientsController,
	) {
	}

	async toggleAutoFarm(message: IncomingToggleFarmMessage) {
		try {
			const botID = message.botID;
			const action = message.data.action;

			const noneOnline = await checkNotOnlineBot(botID, message, this.clientManager);
			if (noneOnline) return this.wsClients.broadcast<OutgoingReplayMessage>(noneOnline);

			if (action === 'START') {
				this.farmService.startFarm(botID);
			}
			if (action === 'STOP') {
				this.farmService.stopFarm(botID);
			}

			returnWSOk(message, this.wsClients);
		} catch (e) {
			returnWSError(message, e.message, this.wsClients);
		}
	}
}
export const websocketFarmController = new WebSocketFarmBotController(farmService, clientManagerService, webSocketClients)