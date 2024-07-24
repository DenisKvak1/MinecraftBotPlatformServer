import { ICaptchaService } from '../../../core/service/CaptchaService';
import { IChatService } from '../../../core/service/ChatService';
import { IWindowService } from '../../../core/service/WindowService';
import { IInventoryService } from '../../../core/service/InventoryService';
import { IClientManagerService } from '../../../core/service/ClientManagerService';
import { WebSocketClientsController } from './WebSocketClientsController';
import { Subscribe } from '../../../../env/helpers/observable';
import {
	OUTGHOING_COMMAND_LIST, OutgoingActionWindowBotMessage,
	OutgoingBotDamageMessage,
	OutgoingBotDeathMessage, OutgoingCaptchaMessage,
	OutgoingChatBotMessage,
	OutgoingConnectingBotMessage,
	OutgoingInventoryUpdateBotMessage,
} from '../types/webSocketBotCommandTypes';


export async function ApplyWSBotEvents(
	webSocketController: WebSocketClientsController,
	clientManagerService: IClientManagerService,
	inventoryService: IInventoryService,
	windowService: IWindowService,
	chatService: IChatService,
	captchaService: ICaptchaService,
) {
	const subscribeMap = new Map<string, Subscribe[]>();

	const connectSubscribe=  clientManagerService.$connect.subscribe((connectData) => {
		webSocketController.broadcast<OutgoingConnectingBotMessage>({
			command: OUTGHOING_COMMAND_LIST.CONNECTING_BOT,
			id: connectData.id,
			state: 'CONNECT',
		});

		const onSpawnSubscribe = clientManagerService.onSpawn(connectData.id, () => {
			webSocketController.broadcast<OutgoingConnectingBotMessage>({
				command: OUTGHOING_COMMAND_LIST.CONNECTING_BOT,
				id: connectData.id,
				state: 'SPAWN',
			});
		});

		const onDisconnectSubscribe = clientManagerService.onDisconnect(connectData.id, () => {
			webSocketController.broadcast<OutgoingConnectingBotMessage>({
				command: OUTGHOING_COMMAND_LIST.CONNECTING_BOT,
				id: connectData.id,
				state: 'DISCONNECT'
			});
		});

		const onUpdateSlotInventorySubscribe = inventoryService.onUpdateSlot(connectData.id, (dto)=>{
			webSocketController.broadcast<OutgoingInventoryUpdateBotMessage>({
				command: OUTGHOING_COMMAND_LIST.INVENTORY_UPDATE,
				id: connectData.id,
				index: dto.itemSlot,
				item: dto.newItem ? {
					name: dto.newItem.name,
					count: dto.newItem.count
				} : null
			})
		})

		const onOpenWindowSubscribe = windowService.onOpenWindow(connectData.id, (items)=>{
			webSocketController.broadcast<OutgoingActionWindowBotMessage>({
				command: OUTGHOING_COMMAND_LIST.WINDOW,
				action: 'OPEN',
				id: connectData.id,
				items
			})
		})

		const onCloseWindowSubscribe = windowService.onCloseWindow(connectData.id, ()=>{
			webSocketController.broadcast<OutgoingActionWindowBotMessage>({
				command: OUTGHOING_COMMAND_LIST.WINDOW,
				action: 'CLOSE',
				id: connectData.id,
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
			onDamageSubscribe, onDeathSubscribe,
			onCloseWindowSubscribe
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