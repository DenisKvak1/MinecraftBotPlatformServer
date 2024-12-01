import { IClientManagerService } from '../../../core/service/ClientManagerService';
import { webSocketClients, WebSocketClientsController } from '../../express/module/WebSocketClientsController';
import { IAutoBuyService } from '../../../core/service/AutoBuy';
import { IncomingToggleFarmMessage, OutgoingReplayMessage } from '../../express/types/webSocketBotCommandTypes';
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
				if(this.abService.getAutoBuySystemState(1) == "OFF"){
					this.abService.startAutoBuySystem([botID])
				} else {
					this.abService.addToAutoBuySystem(1, botID)
				}
			}
			
			if (action === 'STOP') {
				this.abService.deleteMassAutoBuyBot(1, botID);
			}

			returnWSOk(message, this.wsClients);
		} catch (e) {
			returnWSError(message, e.message, this.wsClients);
		}
	}
}
export const websocketAutoBuyController = new WebSocketAutoBuyController(autoBuyService, clientManagerService, webSocketClients)