import { IClientManagerService } from '../../core/service/ClientManagerService';
import { webSocketClients, WebSocketClientsController } from '../express/module/WebSocketClientsController';
import { IHeadService } from '../../core/service/HeadService';
import { IncomingRotateHeadMessage, OutgoingReplayMessage } from '../../../env/types';
import { checkNotOnlineBot } from '../express/helper/checkOnline';
import { returnWSError, returnWSOk } from '../express/helper/returnWSOk';
import { headService } from '../services/HeadService';
import { clientManagerService } from '../services/ClientManagerService';

export class WebSocketHeadBotController {
	constructor(
		private headService: IHeadService,
		private clientManager: IClientManagerService,
		private wsClients: WebSocketClientsController,
	) {}

	async moveHead(message: IncomingRotateHeadMessage){
		try {
			const botID = message.botID;
			const { action, direction } = message.data;

			const noneOnline = await checkNotOnlineBot(botID, message, this.clientManager)
			if (noneOnline) return this.wsClients.broadcast<OutgoingReplayMessage>(noneOnline)

			switch (direction) {
				case 'UP':
					if (action === 'START') {
						this.headService.startUpRotate(botID)
					} else if (action === 'STOP') {
						this.headService.stopRotateUp(botID)
					}
					break;
				case 'DOWN':
					if (action === 'START') {
						this.headService.startDownRotate(botID)
					} else if (action === 'STOP') {
						this.headService.stopRotateDown(botID)
					}
					break;
				case 'LEFT':
					if (action === 'START') {
						this.headService.startLeftRotate(botID)
					} else if (action === 'STOP') {
						this.headService.stopRotateLeft(botID)
					}
					break;
				case 'RIGHT':
					if (action === 'START') {
						this.headService.startRightRotate(botID)
					} else if (action === 'STOP') {
						this.headService.stopRotateRight(botID)
					}
					break;
			}

			returnWSOk(message, this.wsClients)
		} catch (e){
			returnWSError(message, e.errorMessage, this.wsClients)
		}
	}
}
export const websocketHeadBotController = new WebSocketHeadBotController(headService, clientManagerService, webSocketClients)