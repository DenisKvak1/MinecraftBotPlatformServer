import { webSocketClients, WebSocketClientsController } from '../../express/module/WebSocketClientsController';
import { IInventoryService } from '../../../core/service/InventoryService';
import { checkNotOnlineBot } from '../../express/helper/checkOnline';
import { IClientManagerService } from '../../../core/service/ClientManagerService';
import exp from 'node:constants';
import { inventoryService } from '../../services/InventoryService';
import { clientManagerService } from '../../services/ClientManagerService';
import { returnWSError, returnWSOk } from '../../express/helper/returnWSOk';
import {
	IncomingActivateSlotMessage,
	IncomingDropAllSlotMessage, IncomingDropSlotMessage, IncomingGetExp,
	IncomingGetSlotsMessage, IncomingSetHotBarSlotMessage, OutgoingGetExp,
	OutgoingGetSlotsReplayMessage, OutgoingReplayMessage, STATUS,
	UNIVERSAL_COMMAND_LIST,
} from '../../express/types/webSocketBotCommandTypes';

export class WebSocketInventoryBotController {
	constructor(
		private inventoryService: IInventoryService,
		private clientManager: IClientManagerService,
		private wsClients: WebSocketClientsController,
	) {}

	async setHotBarSlot(message: IncomingSetHotBarSlotMessage){
		try {
			const botID = message.botID
			const slotIndex = message.data.slotIndex
			const noneOnline = await checkNotOnlineBot(botID, message, this.clientManager)
			if (noneOnline) return this.wsClients.broadcast<OutgoingReplayMessage>(noneOnline)

			if (slotIndex > 0 || slotIndex > 8){
				return this.wsClients.broadcast<OutgoingReplayMessage>({
					command: message.command,
					botID: message.botID,
					status: STATUS.ERROR,
					errorMessage: "Не корректный индекс слота"
				})
			}

			this.inventoryService.setHotBarSlot(botID, slotIndex)
			returnWSOk(message, this.wsClients)
		} catch (e){
			returnWSError(message, e.message, this.wsClients)
		}
	}

	async dropSlot(message: IncomingDropSlotMessage) {
		try {
			const botID = message.botID
			const slotIndex = message.data.slotIndex
			const noneOnline = await checkNotOnlineBot(botID, message, this.clientManager)
			if (noneOnline) return this.wsClients.broadcast<OutgoingReplayMessage>(noneOnline)


			if (slotIndex < 0 || slotIndex > 45){
				return this.wsClients.broadcast<OutgoingReplayMessage>({
					command: message.command,
					status: STATUS.ERROR,
					botID,
					errorMessage: "Не корретнный индекс слота"
				})
			}

			this.inventoryService.dropSlot(botID, slotIndex)
			returnWSOk(message, this.wsClients)
		} catch (e){
			returnWSError(message, e.message, this.wsClients)
		}
	}

	async dropAllSlots(message: IncomingDropAllSlotMessage) {
		try {
			const botID = message.botID
			const noneOnline = await checkNotOnlineBot(botID, message, this.clientManager)
			if (noneOnline) return this.wsClients.broadcast<OutgoingReplayMessage>(noneOnline)

			this.inventoryService.dropAll(botID)
			returnWSOk(message, this.wsClients)
		} catch (e){
			return this.wsClients.broadcast<OutgoingReplayMessage>({
				command: message.command,
				botID: message.botID,
				status: STATUS.ERROR,
				errorMessage: e.message
			})
		}
	}

	async getSlots(message: IncomingGetSlotsMessage){
		try {
			const botID = message.botID
			const noneOnline = await checkNotOnlineBot(botID, message, this.clientManager)
			if (noneOnline) return this.wsClients.broadcast<OutgoingReplayMessage>(noneOnline)

			const slotsData = this.inventoryService.getSlots(botID)
			return this.wsClients.broadcast<OutgoingGetSlotsReplayMessage>({
				command: message.command,
				status: STATUS.SUCCESS,
				botID,
				data: {
					slots: slotsData.slots,
					selectedSlot: slotsData.selectedSlot
				}
			})
		} catch (e){
			returnWSError(message, e.message, this.wsClients)
		}
	}

	async activateSlot(message: IncomingActivateSlotMessage) {
		try {
			const botID = message.botID
			const slotIndex = message.data.slotIndex
			const noneOnline = await checkNotOnlineBot(botID, message, this.clientManager)
			if (noneOnline) return this.wsClients.broadcast<OutgoingReplayMessage>(noneOnline)

			if (slotIndex < 0 || slotIndex > 8){
				return this.wsClients.broadcast<OutgoingReplayMessage>({
					command: message.command,
					botID: message.botID,
					status: STATUS.ERROR,
					errorMessage: "Не корректный индекс слота"
				})
			}

			this.inventoryService.useSlot(botID, slotIndex)
			returnWSOk(message, this.wsClients)
		} catch (e){
			returnWSError(message, e.message, this.wsClients)
		}
	}

	async getExp(message: IncomingGetExp){
		try {
			const botID = message.botID
			const noneOnline = await checkNotOnlineBot(botID, message, this.clientManager)
			if (noneOnline) return this.wsClients.broadcast<OutgoingReplayMessage>(noneOnline)

			const exp = await this.inventoryService.getExp(botID)
			return this.wsClients.broadcast<OutgoingGetExp>({
				command: message.command,
				status: STATUS.SUCCESS,
				botID,
				data: exp
			})
		} catch (e){
			returnWSError(message, e.message, this.wsClients)
		}
	}
}
export const websocketInventoryBotController = new WebSocketInventoryBotController(inventoryService, clientManagerService, webSocketClients)