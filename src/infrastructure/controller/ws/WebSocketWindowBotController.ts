import { IWindowService } from '../../../core/service/WindowService';
import { webSocketClients, WebSocketClientsController } from '../../express/module/WebSocketClientsController';
import { checkNotOnlineBot } from '../../express/helper/checkOnline';
import { IClientManagerService } from '../../../core/service/ClientManagerService';
import { returnWSError, returnWSOk } from '../../express/helper/returnWSOk';
import { windowsService } from '../../services/WindowService';
import { clientManagerService } from '../../services/ClientManagerService';
import {
	IncomingClickWindowMessage,
	IncomingGetCurrentWindow, OutgoingGetCurrentWindowReplayMessage, OutgoingGetSlotsReplayMessage,
	OutgoingReplayMessage,
	STATUS,
} from '../../express/types/webSocketBotCommandTypes';
import { ToGeneralizedItems } from '../../../../env/helpers/ToGeneralizedItem';

export class WebSocketWindowBotController {
	constructor(
		private windowService: IWindowService,
		private clientManager: IClientManagerService,
		private wsClients: WebSocketClientsController,
	) {
	}

	async click(message: IncomingClickWindowMessage) {
		try {
			const {slotIndex, mode} = message.data
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

			await this.windowService.click(botID, slotIndex, mode);
			returnWSOk(message, this.wsClients);
		} catch (e) {
			returnWSError(message, e.message, this.wsClients);
		}
	}

	async getCurrentWindow(message: IncomingGetCurrentWindow){
		try {
			const { botID } = message;

			const noneOnline = await checkNotOnlineBot(botID, message, this.clientManager);
			if (noneOnline) return this.wsClients.broadcast<OutgoingReplayMessage>(noneOnline);


			const currentWindow = this.windowService.getCurrentWindow(botID)
			const slots = ToGeneralizedItems(currentWindow?.slots.slice(0, -36) || [])

			return this.wsClients.broadcast<OutgoingGetCurrentWindowReplayMessage>({
				command: message.command,
				status: STATUS.SUCCESS,
				botID,
				data: {
					slots: slots
				}
			})
		} catch (e){
			returnWSError(message, e.message, this.wsClients);
		}
	}
}

export const websocketWindowController = new WebSocketWindowBotController(windowsService, clientManagerService, webSocketClients);