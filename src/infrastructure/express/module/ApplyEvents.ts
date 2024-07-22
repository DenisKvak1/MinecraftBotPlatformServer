import { ICaptchaService } from '../../../core/service/CaptchaService';
import { IChatService } from '../../../core/service/ChatService';
import { IWindowService } from '../../../core/service/WindowService';
import { IInventoryService } from '../../../core/service/InventoryService';
import { IClientManagerService } from '../../../core/service/ClientManagerService';
import { WebSocketClientsController } from './WebSocketClientsController';
import {
	OUTGHOING_COMMAND_LIST,
	OutgoingBotDamageMessage, OutgoingBotDeathMessage,
	OutgoingCaptchaMessage,
	OutgoingChatBotMessage,
	OutgoingConnecingBotMessage,
	OutgoingInventoryUpdateBotMessage,
	OutgoingOpenWindowBotMessage,
} from '../../../../env/types';
import { Subscribe } from '../../../../env/helpers/observable';


export async function ApplyEvents(
	webSocketController: WebSocketClientsController,
	clientManagerService: IClientManagerService,
	inventoryService: IInventoryService,
	windowService: IWindowService,
	chatService: IChatService,
	captchaService: ICaptchaService,
) {
	const subscribeMap = new Map<string, Subscribe[]>();

	const connectSubscribe=  clientManagerService.$connect.subscribe((connectData) => {
		webSocketController.broadcast<OutgoingConnecingBotMessage>({
			command: OUTGHOING_COMMAND_LIST.CONNECTING_BOT,
			id: connectData.id,
			state: 'CONNECTED',
		});

		const onSpawnSubscribe = clientManagerService.onSpawn(connectData.id, () => {
			webSocketController.broadcast<OutgoingConnecingBotMessage>({
				command: OUTGHOING_COMMAND_LIST.CONNECTING_BOT,
				id: connectData.id,
				state: 'SPAWN',
			});
		});

		const onDisconnectSubscribe = clientManagerService.onDisconnect(connectData.id, () => {
			webSocketController.broadcast<OutgoingConnecingBotMessage>({
				command: OUTGHOING_COMMAND_LIST.CONNECTING_BOT,
				id: connectData.id,
				state: 'DISCONNECTED',
			});
		});

		const onUpdateSlotInventorySubscribe = inventoryService.onUpdateSlot(connectData.id, (dto)=>{
			webSocketController.broadcast<OutgoingInventoryUpdateBotMessage>({
				command: OUTGHOING_COMMAND_LIST.INVENTORY_UPDATE,
				id: connectData.id,
				index: dto.itemSlot,
				item: dto.newItem ? {
					name: dto.newItem.name,
					quantity: dto.newItem.count
				} : null
			})
		})

		const onOpenWindowSubscribe = windowService.onOpenWindow(connectData.id, (items)=>{
			webSocketController.broadcast<OutgoingOpenWindowBotMessage>({
				command: OUTGHOING_COMMAND_LIST.OPEN_WINDOW,
				id: connectData.id,
				items
			})
		})

		const onChatMessageSubscribe = chatService.onChatMessage(connectData.id, (message)=>{
			webSocketController.broadcast<OutgoingChatBotMessage>({
				command: OUTGHOING_COMMAND_LIST.CHAT_MESSAGE,
				id: connectData.id,
				message
			})
		})

		const onCaptchaSubscribe =  captchaService.onCaptcha(connectData.id, (imageBuffer)=>{
			webSocketController.broadcast<OutgoingCaptchaMessage>({
				command: OUTGHOING_COMMAND_LIST.LOAD_CAPTCHA,
				id: connectData.id,
				imageBuffer
			})
		})

		const onDamageSubscribe =  clientManagerService.onDamage(connectData.id, ()=>{
			webSocketController.broadcast<OutgoingBotDamageMessage>({
				command: OUTGHOING_COMMAND_LIST.DAMAGE,
				id: connectData.id
			})
		})

		const onDeathSubscribe =  clientManagerService.onDeath(connectData.id, ()=>{
			webSocketController.broadcast<OutgoingBotDeathMessage>({
				command: OUTGHOING_COMMAND_LIST.DEATH,
				id: connectData.id
			})
		})

		subscribeMap.set(connectData.id, [
			onSpawnSubscribe, onDisconnectSubscribe,
			onUpdateSlotInventorySubscribe, onOpenWindowSubscribe,
			onChatMessageSubscribe, onCaptchaSubscribe,
			onDamageSubscribe, onDeathSubscribe
		])
	});

	const unConnectSubscribe = clientManagerService.$disconnect.subscribe((disconnectData)=> {
		subscribeMap.get(disconnectData.id)?.forEach((subscribe)=> {
			subscribe.unsubscribe()
		})
		subscribeMap.delete(disconnectData.id)
	})

	return {
		unsubscribe: ()=>{
			connectSubscribe.unsubscribe()
			unConnectSubscribe.unsubscribe()
		}
	} as Subscribe;
}