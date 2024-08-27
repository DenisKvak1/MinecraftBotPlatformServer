import { IBotScriptService } from '../../../core/service/BotScriptService/BotScriptService';
import {
	IncomingDeleteScriptMessage, IncomingGetScriptsMessage,
	IncomingSaveScriptMessage, OutgoingGetScripts,
	OutgoingSaveScript,
	STATUS,
	UNIVERSAL_COMMAND_LIST,
} from '../../express/types/webSocketBotCommandTypes';
import { returnWSError, returnWSOk } from '../../express/helper/returnWSOk';
import { webSocketClients, WebSocketClientsController } from '../../express/module/WebSocketClientsController';
import { botScriptsService } from '../../services/BotScriptService';
import { clientManagerService } from '../../services/ClientManagerService';
import { IClientManagerService } from '../../../core/service/ClientManagerService';

export class WebSocketBotScriptsController {
	constructor(
		private botScriptService: IBotScriptService,
		private clientManagerService: IClientManagerService,
		private wsClients: WebSocketClientsController,
	) {
	}

	async saveScript(message: IncomingSaveScriptMessage) {
		try {
			const { actions, name } = message.data;

			const script = await this.botScriptService.save(name, actions);

			this.wsClients.broadcast<OutgoingSaveScript>({
				botID: '',
				status: STATUS.SUCCESS,
				command: UNIVERSAL_COMMAND_LIST.SAVE_SCRIPT,
				data: {
					script,
				},
			});
		} catch (e) {
			returnWSError(message, e.message, this.wsClients);
		}
	}

	async deleteScript(message: IncomingDeleteScriptMessage) {
		try {
			const { scriptId } = message.data;

			await this.botScriptService.delete(scriptId);

			returnWSOk(message, this.wsClients);
		} catch (e) {
			returnWSError(message, e.message, this.wsClients);
		}
	}

	async getAllScripts(message: IncomingGetScriptsMessage) {
		try {
			const scripts = await this.botScriptService.getAll();

			this.wsClients.broadcast<OutgoingGetScripts>({
				botID: '',
				status: STATUS.SUCCESS,
				command: UNIVERSAL_COMMAND_LIST.GET_SCRIPTS,
				data: {
					scripts: scripts,
				},
			});
		} catch (e) {
			returnWSError(message, e.message, this.wsClients);
		}
	}
}

export const websocketBotScripts = new WebSocketBotScriptsController(
	botScriptsService,
	clientManagerService,
	webSocketClients,
);