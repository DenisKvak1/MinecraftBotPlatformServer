import { IChatService } from '../../../core/service/ChatService';
import { IClientManagerService } from '../../../core/service/ClientManagerService';
import { webSocketClients, WebSocketClientsController } from '../../express/module/WebSocketClientsController';
import { IAutoBuyService } from '../../../core/service/AutoBuy';
import {
	IncomingGetFarmState,
	IncomingToggleFarmMessage, OutgoingGetABStatusMessage, OutgoingGetFarmStatusMessage,
	OutgoingReplayMessage, STATUS, UNIVERSAL_COMMAND_LIST,
} from '../../express/types/webSocketBotCommandTypes';
import { checkNotOnlineBot } from '../../express/helper/checkOnline';
import { returnWSError, returnWSOk } from '../../express/helper/returnWSOk';
import { clientManagerService } from '../../services/ClientManagerService';
import { autoBuyService } from '../../services/AutoBuy/AutoBuyService';

export class WebSocketAutoBuyController {
	constructor(
		private abService: IAutoBuyService,
		private clientManager: IClientManagerService,
		private wsClients: WebSocketClientsController,
	) {}

	async toggleAutoBuy(message: IncomingToggleFarmMessage) {
		try {
			const botID = message.botID;
			const action = message.data.action;

			const noneOnline = await checkNotOnlineBot(botID, message, this.clientManager);
			if (noneOnline) return this.wsClients.broadcast<OutgoingReplayMessage>(noneOnline);

			if (action === 'START') {
				this.abService.startAutoBuy(botID);
			}
			if (action === 'STOP') {
				this.abService.stopAutoBuy(botID);
			}

			returnWSOk(message, this.wsClients);
		} catch (e) {
			returnWSError(message, e.message, this.wsClients);
		}
	}

	async getAbStatus(message: IncomingGetFarmState) {
		try {
			const botID = message.botID;


			const status = this.abService.getAutoBuyState(botID)

			this.wsClients.broadcast<OutgoingGetABStatusMessage>({
				command: UNIVERSAL_COMMAND_LIST.GET_AB_STATUS,
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
export const websocketAutoBuyController = new WebSocketAutoBuyController(autoBuyService, clientManagerService, webSocketClients)