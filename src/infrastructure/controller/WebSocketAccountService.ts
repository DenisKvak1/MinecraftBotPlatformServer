import { IClientManagerService } from '../../core/service/ClientManagerService';
import { webSocketClients, WebSocketClientsController } from '../express/module/WebSocketClientsController';
import { accountService, AccountService } from '../../core/service/AccountService';
import { returnWSError, returnWSOk } from '../express/helper/returnWSOk';
import { clientManagerService } from '../services/ClientManagerService';
import {
	IncomingCreateBotMessage,
	IncomingDeleteBotMessage,
	IncomingGetBotInfoIDMessage,
	IncomingGetBotInfoNameMessage, IncomingGetBotsMessage, IncomingUpdateBotOptionsMessage,
	OutgoingCreateBotReplayMessage,
	OutgoingGetBotInfoMessage,
	OutgoingGetBotsInfoMessage, OutgoingReplayMessage, STATUS,
} from '../express/types/webSocketBotCommandTypes';

export class WebSocketAccountServiceController {
	constructor(
		private accountService: AccountService,
		private clientManager: IClientManagerService,
		private wsClients: WebSocketClientsController,
	) {
	}

	async createBot(message: IncomingCreateBotMessage) {
		try {
			const botID = message.botID;
			const data = message.data;

			const account = await this.accountService.create(data);

			return this.wsClients.broadcast<OutgoingCreateBotReplayMessage>({
				command: message.command,
				botID,
				status: STATUS.SUCCESS,
				data: {
					account,
				},
			});
		} catch (e) {
			returnWSError(message, e.message, this.wsClients);
		}
	}

	async deleteBot(message: IncomingDeleteBotMessage) {
		try {
			const botID = message.botID;

			if (!await this.accountService.getByID(botID)) {
				return this.wsClients.broadcast<OutgoingReplayMessage>({
					command: message.command,
					botID,
					status: STATUS.ERROR,
					errorMessage: 'Такого бота нету',
				});
			}

			await this.accountService.delete(botID);

			returnWSOk(message, this.wsClients);
		} catch (e) {
			returnWSError(message, e.message, this.wsClients);
		}
	}

	async getByID(message: IncomingGetBotInfoIDMessage) {
		try {
			const id = message.data.id;
			const account = await this.accountService.getByID(id);

			if (!account) {
				return this.wsClients.broadcast<OutgoingReplayMessage>({
					command: message.command,
					botID: message.botID,
					status: STATUS.ERROR,
					errorMessage: 'Бот не найден',
				});
			}

			return this.wsClients.broadcast<OutgoingGetBotInfoMessage>({
				command: message.command,
				botID: message.botID,
				status: STATUS.SUCCESS,
				data: {
					account,
				},
			});
		} catch (e) {
			returnWSError(message, e.message, this.wsClients);
		}
	}

	async getByName(message: IncomingGetBotInfoNameMessage) {
		try {
			const name = message.data.name;
			const account = await this.accountService.getByName(name);

			if (!account) {
				return this.wsClients.broadcast<OutgoingReplayMessage>({
					command: message.command,
					botID: message.botID,
					status: STATUS.ERROR,
					errorMessage: 'Бот не найден',
				});
			}

			return this.wsClients.broadcast<OutgoingGetBotInfoMessage>({
				command: message.command,
				botID: message.botID,
				status: STATUS.SUCCESS,
				data: {
					account,
				},
			});
		} catch (e) {
			returnWSError(message, e.message, this.wsClients);
		}
	}


	async getBots(message: IncomingGetBotsMessage) {
		try {
			const accounts = await this.accountService.getAll();

			return this.wsClients.broadcast<OutgoingGetBotsInfoMessage>({
				command: message.command,
				botID: message.botID,
				status: STATUS.SUCCESS,
				data: {
					accounts,
				},
			});
		} catch (e) {
			returnWSError(message, e.message, this.wsClients);
		}
	}

	async updateOptions(message: IncomingUpdateBotOptionsMessage) {
		try {
			const botID = message.botID;
			const updateDTO = message.data;

			await this.accountService.update(botID, updateDTO);

			returnWSOk(message, this.wsClients);
		} catch (e) {
			returnWSError(message, e.message, this.wsClients);
		}
	}
}

export const websocketAccountController = new WebSocketAccountServiceController(accountService, clientManagerService, webSocketClients);