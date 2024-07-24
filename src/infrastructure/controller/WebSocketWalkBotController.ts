import { IWindowService } from '../../core/service/WindowService';
import { webSocketClients, WebSocketClientsController } from '../express/module/WebSocketClientsController';
import { IWalkService } from '../../core/service/WalkService';
import { walkService } from '../services/WalkService';
import { checkNotOnlineBot } from '../express/helper/checkOnline';
import { IClientManagerService } from '../../core/service/ClientManagerService';
import { clientManagerService } from '../services/ClientManagerService';
import { returnWSError, returnWSOk } from '../express/helper/returnWSOk';
import { websocketWindowController } from './WebSocketWindowBotController';
import {
	IncomingClickWindowMessage, IncomingGotoMessage,
	IncomingJumpBotMessage, IncomingMovementBotMessage, OutgoingReplayMessage, STATUS,
	UNIVERSAL_COMMAND_LIST,
} from '../express/types/webSocketBotCommandTypes';

export class WebSocketWindowBotController {
	constructor(
		private walkService: IWalkService,
		private clientManager: IClientManagerService,
		private wsClients: WebSocketClientsController,
	) {
	}

	async move(message: IncomingMovementBotMessage) {
		try {
			const botID = message.botID;
			const { action, direction } = message.data;

			const noneOnline = await checkNotOnlineBot(botID, message, this.clientManager)
			if (noneOnline) return this.wsClients.broadcast<OutgoingReplayMessage>(noneOnline)

			switch (direction) {
				case 'FORWARD':
					if (action === 'START') {
						this.walkService.forwardStart(botID);
					} else if (action === 'STOP') {
						this.walkService.forwardStop(botID);
					}
					break;
				case 'BACK':
					if (action === 'START') {
						this.walkService.backwardStart(botID);
					} else if (action === 'STOP') {
						this.walkService.backwardStop(botID);
					}
					break;
				case 'LEFT':
					if (action === 'START') {
						this.walkService.leftStart(botID);
					} else if (action === 'STOP') {
						this.walkService.leftStop(botID);
					}
					break;
				case 'RIGHT':
					if (action === 'START') {
						this.walkService.rightStart(botID);
					} else if (action === 'STOP') {
						this.walkService.rightStop(botID);
					}
					break;
			}

			returnWSOk(message, this.wsClients)
		} catch (e) {
			returnWSError(message, e.message, this.wsClients)
		}
	}

	async jump(message: IncomingJumpBotMessage) {
		try {
			const botID = message.botID;
			const noneOnline = await checkNotOnlineBot(botID, message, this.clientManager)
			if (noneOnline) return this.wsClients.broadcast<OutgoingReplayMessage>(noneOnline)

			this.walkService.jump(botID)


			returnWSOk(message, this.wsClients)
		} catch (e) {
			returnWSError(message, e.message, this.wsClients)
		}
	}

	async goto(message: IncomingGotoMessage){
		try {
			const botID = message.botID
			const {x, y, z} = message.data

			this.walkService.goto(botID, x,  y,  z)
			returnWSOk(message, this.wsClients)
		} catch (e) {
			returnWSError(message, e.message, this.wsClients)
		}
	}
}
export const webSocketWalkBotController = new WebSocketWindowBotController(walkService, clientManagerService, webSocketClients)