import { IWindowService } from '../../core/service/WindowService';
import { webSocketClients, WebSocketClientsController } from '../express/module/WebSocketClientsController';
import { IncomingClickWindowMessage, OutgoingReplayMessage, STATUS } from '../../../env/types';
import { checkNotOnlineBot } from '../express/helper/checkOnline';
import { IClientManagerService } from '../../core/service/ClientManagerService';
import { returnWSError, returnWSOk } from '../express/helper/returnWSOk';
import { windowsService } from '../services/WindowService';
import { clientManagerService } from '../services/ClientManagerService';

export class WebSocketWindowBotController {
	constructor(
		private windowService: IWindowService,
		private clientManager: IClientManagerService,
		private wsClients: WebSocketClientsController,
	) {
	}

	async click(message: IncomingClickWindowMessage) {
		try {
			const slotIndex = message.data.slotIndex;
			const { botID } = message;

			const noneOnline = await checkNotOnlineBot(botID, message, this.clientManager);
			if (noneOnline) return this.wsClients.broadcast<OutgoingReplayMessage>(noneOnline);

			const countSlot = this.windowService.getCurrentWindow(botID).slots.length - 1;
			if (slotIndex < 0 || slotIndex > countSlot) {
				return this.wsClients.broadcast<OutgoingReplayMessage>({
					command: message.command,
					botID,
					status: STATUS.ERROR,
					errorMessage: 'Индекс слота за пределаи 0-54',
				});
			}

			await this.windowService.click(botID, slotIndex);
			returnWSOk(message, this.wsClients);
		} catch (e) {
			returnWSError(message, e.errorMessage, this.wsClients);
		}
	}
}

export const websocketWindowController = new WebSocketWindowBotController(windowsService, clientManagerService, webSocketClients);