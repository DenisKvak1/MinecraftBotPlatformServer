import { IClientManagerService } from '../../core/service/ClientManagerService';
import { webSocketClients, WebSocketClientsController } from '../express/module/WebSocketClientsController';
import { IFoodService } from '../../core/service/FoodService';
import { returnWSError, returnWSOk } from '../express/helper/returnWSOk';
import { checkNotOnlineBot } from '../express/helper/checkOnline';
import { IFarmService } from '../../core/service/FarmService';
import { farmService } from '../services/FarmService';
import { clientManagerService } from '../services/ClientManagerService';
import {
	IncomingGetFarmState,
	IncomingToggleFarmMessage,
	IncomingToggleFoodMessage, OutgoingBotFarmStatusMessage, OutgoingGetFarmStatusMessage,
	OutgoingReplayMessage, STATUS, UNIVERSAL_COMMAND_LIST,
} from '../express/types/webSocketBotCommandTypes';

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

	async getFarmStatus(message: IncomingGetFarmState) {
		try {
			const botID = message.botID;


			const status = this.farmService.getFarmState(botID)

			this.wsClients.broadcast<OutgoingGetFarmStatusMessage>({
				command: UNIVERSAL_COMMAND_LIST.GET_FARM_STATUS,
				botID,
				status: STATUS.SUCCESS,
				data: {
					status: status
				}
			})
		}	catch (e) {
			returnWSError(message, e.message, this.wsClients);
		}
	}
}
export const websocketFarmController = new WebSocketFarmBotController(farmService, clientManagerService, webSocketClients)