import { IFarmService } from '../../core/service/FarmService';
import { IClientManagerService } from '../../core/service/ClientManagerService';
import { webSocketClients, WebSocketClientsController } from '../express/module/WebSocketClientsController';
import {
	IncomingAttackMessage,
	IncomingToggleClickerMessage,
	IncomingToggleFarmMessage,
	OutgoingReplayMessage,
} from '../../../env/types';
import { checkNotOnlineBot } from '../express/helper/checkOnline';
import { returnWSError, returnWSOk } from '../express/helper/returnWSOk';
import { IClickerService } from '../../core/service/ClickerService';
import { clickerService } from '../services/ClickerService';
import { clientManagerService } from '../services/ClientManagerService';

export class WebSocketClickerBotController {
	constructor(
		private clickerService: IClickerService,
		private clientManager: IClientManagerService,
		private wsClients: WebSocketClientsController,
	) {
	}

	async attack(message: IncomingAttackMessage) {
		try {
			const botID = message.botID;

			const noneOnline = await checkNotOnlineBot(botID, message, this.clientManager);
			if (noneOnline) return this.wsClients.broadcast<OutgoingReplayMessage>(noneOnline);

			this.clickerService.attack(botID)

			returnWSOk(message, this.wsClients);
		} catch (e) {
			returnWSError(message, e.errorMessage, this.wsClients);
		}
	}

	async toggleAutoClicker(message: IncomingToggleClickerMessage) {
		try {
			const botID = message.botID;
			const { action, type, interval } = message.data;

			const noneOnline = await checkNotOnlineBot(botID, message, this.clientManager);
			if (noneOnline) return this.wsClients.broadcast<OutgoingReplayMessage>(noneOnline);

			if (type === 'ATTACK') {
				if (action === 'START') {
					this.clickerService.startAttackClicker(botID, interval);
				}
				if (action === 'STOP') {
					this.clickerService.stopAttackClicker(botID);
				}
			}

			if (type === 'USEITEM') {
				if (action === 'START') {
					this.clickerService.startUseItemClicker(botID, interval);
				}
				if (action === 'STOP') {
					this.clickerService.stopUseItemClicker(botID);
				}
			}

			returnWSOk(message, this.wsClients);
		} catch (e) {
			returnWSError(message, e.errorMessage, this.wsClients);
		}
	}
}
export const websocketClickerBotController = new WebSocketClickerBotController(clickerService, clientManagerService, webSocketClients)