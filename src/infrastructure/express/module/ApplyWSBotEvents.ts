import { ICaptchaService } from '../../../core/service/CaptchaService';
import { IChatService } from '../../../core/service/ChatService';
import { IWindowService } from '../../../core/service/WindowService';
import { IInventoryService } from '../../../core/service/InventoryService';
import { IClientManagerService } from '../../../core/service/ClientManagerService';
import { WebSocketClientsController } from './WebSocketClientsController';
import { Subscribe } from '../../../../env/helpers/observable';
import {
	BotFunctions,
	OUTGHOING_COMMAND_LIST,
	OutgoingActionWindowBotMessage,
	OutgoingBotDamageMessage,
	OutgoingBotDeathMessage,
	OutgoingBotFunctionsStatusMessage,
	OutgoingCaptchaMessage,
	OutgoingChatBotMessage,
	OutgoingConnectingBotMessage, OutgoingExperienceEvent,
	OutgoingInventoryUpdateBotMessage,
} from '../types/webSocketBotCommandTypes';
import { IFarmService } from '../../../core/service/FarmService';
import { IAutoBuyService } from '../../../core/service/AutoBuy';
import { BatchProccess } from '../../../../env/helpers/BatchProccess';
import { GeneralizedItem } from '../../../../env/types';


export async function ApplyWSBotEvents(
	webSocketController: WebSocketClientsController,
	clientManagerService: IClientManagerService,
	inventoryService: IInventoryService,
	windowService: IWindowService,
	chatService: IChatService,
	captchaService: ICaptchaService,
	farmService: IFarmService,
	ABService: IAutoBuyService
) {
	const subscribeMap = new Map<string, Subscribe[]>();


	const connectSubscribe=  clientManagerService.$connect.subscribe((connectData) => {
		const updateWindowBatch = new BatchProccess<GeneralizedItem>((items)=>{
			webSocketController.broadcast<OutgoingActionWindowBotMessage>({
				id: connectData.id,
				command: OUTGHOING_COMMAND_LIST.WINDOW,
				action: 'UPDATE',
				items: items,
			})
		}, 100)

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
				item: dto.newItem ?  dto.newItem : null
			})
		})

		const onABSubscribe = ABService.$ab.subscribe((data)=>{
			webSocketController.broadcast<OutgoingBotFunctionsStatusMessage>({
				command: OUTGHOING_COMMAND_LIST.BOT_FUNCTIONS_ACTION,
				type: BotFunctions.AUTO_BUY,
				id: data.id,
				action: data.action
			})
		})

		const onWindowEventSubscribe = windowService.onWindowEvent(connectData.id, (windowEvent)=>{
			if(windowEvent.action === 'UPDATE') return updateWindowBatch.push(windowEvent.newItem)
			if(windowEvent.action === "OPEN") updateWindowBatch.undo()
			if(windowEvent.action === "CLOSE") updateWindowBatch.undo()

			webSocketController.broadcast<OutgoingActionWindowBotMessage>({
				id: connectData.id,
				command: OUTGHOING_COMMAND_LIST.WINDOW,
				title: windowEvent.title,
				action: windowEvent.action,
				items: windowEvent.items,
				slotIndex: windowEvent.slotIndex,
				newItem: windowEvent.newItem,
				oldItem: windowEvent.oldItem,
			})
		})

		const onExperienceSubscribe = inventoryService.onExperienceUpdate(connectData.id, (message)=>{
			webSocketController.broadcast<OutgoingExperienceEvent>({
				command: OUTGHOING_COMMAND_LIST.EXPERIENCE,
				botID: connectData.id,
				data: message
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
			onExperienceSubscribe,
			onSpawnSubscribe, onDisconnectSubscribe,
			onUpdateSlotInventorySubscribe, onWindowEventSubscribe,
			onChatMessageSubscribe, onCaptchaSubscribe,
			onDamageSubscribe, onDeathSubscribe,
			onABSubscribe
		])
	});
	const unConnectSubscribe = clientManagerService.$disconnect.subscribe((disconnectData)=> {
		subscribeMap.get(disconnectData.id)?.forEach((subscribe)=> {
			subscribe.unsubscribe()
		})
		subscribeMap.delete(disconnectData.id)
	})
	const onFarmSubscribe = farmService.$farm.subscribe((data)=>{
		webSocketController.broadcast<OutgoingBotFunctionsStatusMessage>({
			command: OUTGHOING_COMMAND_LIST.BOT_FUNCTIONS_ACTION,
			type: BotFunctions.AUTO_FARM,
			id: data.id,
			action: data.action
		})
	})


	return {
		unsubscribe: ()=>{
			connectSubscribe.unsubscribe()
			unConnectSubscribe.unsubscribe()
			onFarmSubscribe.unsubscribe()
		}
	} as Subscribe;
}