import { IClientManagerService } from '../../../core/service/ClientManagerService';
import { webSocketClients, WebSocketClientsController } from '../../express/module/WebSocketClientsController';
import { IFoodService } from '../../../core/service/FoodService';
import { returnWSError, returnWSOk } from '../../express/helper/returnWSOk';
import { checkNotOnlineBot } from '../../express/helper/checkOnline';
import { websocketHeadBotController } from './WebSocketHeadBotController';
import { foodService } from '../../services/FoodService';
import { clientManagerService } from '../../services/ClientManagerService';
import { IncomingToggleFoodMessage, OutgoingReplayMessage } from '../../express/types/webSocketBotCommandTypes';

export class WebSocketFoodBotController {
	constructor(
		private foodService: IFoodService,
		private clientManager: IClientManagerService,
		private wsClients: WebSocketClientsController,
	) {
	}

	async toggleAutoFood(message: IncomingToggleFoodMessage) {
		try {
			const botID = message.botID;
			const action = message.data.action;

			const noneOnline = await checkNotOnlineBot(botID, message, this.clientManager);
			if (noneOnline) return this.wsClients.broadcast<OutgoingReplayMessage>(noneOnline);

			if (action === 'START') {
				this.foodService.startAutoFood(botID);
			}
			if (action === 'STOP') {
				this.foodService.stopAutoFeed(botID);
			}

			returnWSOk(message, this.wsClients);
		} catch (e) {
			returnWSError(message, e.message, this.wsClients);
		}
	}
}

export const websocketFoodController = new WebSocketFoodBotController(foodService, clientManagerService, webSocketClients)