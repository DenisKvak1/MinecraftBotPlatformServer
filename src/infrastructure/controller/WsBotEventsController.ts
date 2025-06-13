import { ICaptchaService } from '../../core/service/CaptchaService';
import { IChatService } from '../../core/service/ChatService';
import { IWindowService } from '../../core/service/WindowService';
import { IInventoryService } from '../../core/service/InventoryService';
import { IClientManagerService } from '../../core/service/ClientManagerService';
import { webSocketClients, WebSocketClientsController } from '../express/module/WebSocketClientsController';
import { Subscribe } from '../../../env/helpers/observable';
import {
	BotFunctions, IncomingSubscribeOnBotEventsMessage, IncomingUnSubscribeOnBotEventsMessage,
	OUTGHOING_COMMAND_LIST,
	OutgoingActionWindowBotMessage,
	OutgoingBotDamageMessage,
	OutgoingBotDeathMessage,
	OutgoingBotFunctionsStatusMessage,
	OutgoingCaptchaMessage,
	OutgoingChatBotMessage,
	OutgoingConnectingBotMessage, OutgoingExperienceEvent,
	OutgoingInventoryUpdateBotMessage,
} from '../express/types/webSocketBotCommandTypes';
import { IFarmService } from '../../core/service/FarmService';
import { IAutoBuyService } from '../../core/service/AutoBuy';
import { BatchProccess } from '../../../env/helpers/BatchProccess';
import { GeneralizedItem } from '../../../env/types';
import { returnWSError, returnWSOk } from '../express/helper/returnWSOk';
import WebSocket from 'ws';
import { inventoryService } from '../services/InventoryService';
import { clientManagerService } from '../services/ClientManagerService';
import { windowsService } from '../services/WindowService';
import { chatService } from '../services/ChatService';
import { captchaService } from '../services/CaptchaService/CaptchaService';
import { farmService } from '../services/FarmService/FarmService';
import { autoBuyService } from '../services/AutoBuy/AutoBuyService';


export class WsBotEventsController {
	private subscribeBotEventMap = new Map<string, Subscribe[]>();
	private subscribeWSBotEventMap = new Map<string, WebSocket[]>();


	constructor(
		private webSocketController: WebSocketClientsController,
		private clientManagerService: IClientManagerService,
		private inventoryService: IInventoryService,
		private windowService: IWindowService,
		private chatService: IChatService,
		private captchaService: ICaptchaService,
		private farmService: IFarmService,
		private ABService: IAutoBuyService
	) {
		this.applyEvents()
	}

	public subscribe(request: IncomingSubscribeOnBotEventsMessage, ws: WebSocket) {
		try {
			const  botId = request.botID;
			if (!this.subscribeWSBotEventMap.get(botId)) this.subscribeWSBotEventMap.set(botId, []);
			this.subscribeWSBotEventMap.get(botId)?.push(ws)

			return returnWSOk(request, this.webSocketController)
		} catch (e) {
			returnWSError(request, e.message, this.webSocketController)
		}
	}

	public unSubscribe(request: IncomingUnSubscribeOnBotEventsMessage, ws: WebSocket) {
		try {
			const  botId = request.botID;
			if (!this.subscribeWSBotEventMap.get(botId)) this.subscribeWSBotEventMap.set(botId, []);
			const webSockets = this.subscribeWSBotEventMap.get(botId) as WebSocket[];
			this.subscribeWSBotEventMap.set(botId, webSockets.filter(x => x !== ws))

			return returnWSOk(request, this.webSocketController)
		} catch (e) {
			returnWSError(request, e.message, this.webSocketController)
		}
	}

	private applyEvents() {
		const connectSubscribe = this.clientManagerService.$connect.subscribe((connectData) => {
			const updateWindowBatch = new BatchProccess<GeneralizedItem>((items) => {
				const websockets = this.subscribeWSBotEventMap.get(connectData.id);
				if (!websockets) return
				websockets.forEach((ws) => {
					this.webSocketController.send<OutgoingActionWindowBotMessage>(ws, {
						id: connectData.id,
						command: OUTGHOING_COMMAND_LIST.WINDOW,
						action: 'UPDATE',
						items: items,
					})
				})
			}, 100)

			this.webSocketController.broadcast<OutgoingConnectingBotMessage>({
				command: OUTGHOING_COMMAND_LIST.CONNECTING_BOT,
				id: connectData.id,
				state: 'CONNECT',
			});

			const onSpawnSubscribe = this.clientManagerService.onSpawn(connectData.id, () => {
				this.webSocketController.broadcast<OutgoingConnectingBotMessage>({
					command: OUTGHOING_COMMAND_LIST.CONNECTING_BOT,
					id: connectData.id,
					state: 'SPAWN',
				});
			});

			const onDisconnectSubscribe = this.clientManagerService.onDisconnect(connectData.id, () => {
				this.webSocketController.broadcast<OutgoingConnectingBotMessage>({
					command: OUTGHOING_COMMAND_LIST.CONNECTING_BOT,
					id: connectData.id,
					state: 'DISCONNECT'
				});
			});

			const onUpdateSlotInventorySubscribe = this.inventoryService.onUpdateSlot(connectData.id, (dto) => {
				const websockets = this.subscribeWSBotEventMap.get(connectData.id);
				if (!websockets) return
				websockets.forEach((ws) => {
					this.webSocketController.send<OutgoingInventoryUpdateBotMessage>(ws, {
						command: OUTGHOING_COMMAND_LIST.INVENTORY_UPDATE,
						id: connectData.id,
						index: dto.itemSlot,
						item: dto.newItem ? dto.newItem : null
					})
				})
			})

			const onABSubscribe = this.ABService.$ab.subscribe((data) => {
				const websockets = this.subscribeWSBotEventMap.get(connectData.id);
				if (!websockets) return
				websockets.forEach((ws) => {
					this.webSocketController.send<OutgoingBotFunctionsStatusMessage>(ws, {
						command: OUTGHOING_COMMAND_LIST.BOT_FUNCTIONS_ACTION,
						type: BotFunctions.AUTO_BUY,
						id: data.id,
						action: data.action
					})
				})
			})

			const onWindowEventSubscribe = this.windowService.onWindowEvent(connectData.id, (windowEvent) => {
				if (windowEvent.action === 'UPDATE') return updateWindowBatch.push(windowEvent.newItem)
				if (windowEvent.action === "OPEN") updateWindowBatch.undo()
				if (windowEvent.action === "CLOSE") updateWindowBatch.undo()

				const websockets = this.subscribeWSBotEventMap.get(connectData.id);
				if (!websockets) return
				websockets.forEach((ws) => {
					this.webSocketController.send<OutgoingActionWindowBotMessage>(ws, {
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
			})

			const onExperienceSubscribe = this.inventoryService.onExperienceUpdate(connectData.id, (message) => {
				const websockets = this.subscribeWSBotEventMap.get(connectData.id);
				if (!websockets) return
				websockets.forEach((ws) => {
					this.webSocketController.send<OutgoingExperienceEvent>(ws, {
						command: OUTGHOING_COMMAND_LIST.EXPERIENCE,
						botID: connectData.id,
						data: message
					})
				})
			})

			const onChatMessageSubscribe = this.chatService.onChatMessage(connectData.id, (message) => {
				const websockets = this.subscribeWSBotEventMap.get(connectData.id);
				if (!websockets) return
				websockets.forEach((ws) => {
					this.webSocketController.send<OutgoingChatBotMessage>(ws, {
						command: OUTGHOING_COMMAND_LIST.CHAT_MESSAGE,
						id: connectData.id,
						message
					})
				})
			})

			const onCaptchaSubscribe = this.captchaService.onCaptcha(connectData.id, (imageBuffer) => {
				const websockets = this.subscribeWSBotEventMap.get(connectData.id);
				if (!websockets) return;
				websockets.forEach((ws) => {
					this.webSocketController.send<OutgoingCaptchaMessage>(ws, {
						command: OUTGHOING_COMMAND_LIST.LOAD_CAPTCHA,
						id: connectData.id,
						imageBuffer
					});
				});
			});

			const onDamageSubscribe = this.clientManagerService.onDamage(connectData.id, () => {
				const websockets = this.subscribeWSBotEventMap.get(connectData.id);
				if (!websockets) return;
				websockets.forEach((ws) => {
					this.webSocketController.send<OutgoingBotDamageMessage>(ws, {
						command: OUTGHOING_COMMAND_LIST.DAMAGE,
						id: connectData.id
					});
				});
			});

			const onDeathSubscribe = this.clientManagerService.onDeath(connectData.id, () => {
				const websockets = this.subscribeWSBotEventMap.get(connectData.id);
				if (!websockets) return;
				websockets.forEach((ws) => {
					this.webSocketController.send<OutgoingBotDeathMessage>(ws, {
						command: OUTGHOING_COMMAND_LIST.DEATH,
						id: connectData.id
					});
				});
			});

			const onFarmSubscribe = this.farmService.$farm.subscribe((data) => {
				const websockets = this.subscribeWSBotEventMap.get(data.id);
				if (!websockets) return;
				websockets.forEach((ws) => {
					this.webSocketController.send<OutgoingBotFunctionsStatusMessage>(ws, {
						command: OUTGHOING_COMMAND_LIST.BOT_FUNCTIONS_ACTION,
						type: BotFunctions.AUTO_FARM,
						id: data.id,
						action: data.action
					});
				});
			});

			this.subscribeBotEventMap.set(connectData.id, [
				onExperienceSubscribe,
				onSpawnSubscribe, onDisconnectSubscribe,
				onUpdateSlotInventorySubscribe, onWindowEventSubscribe,
				onChatMessageSubscribe, onCaptchaSubscribe,
				onDamageSubscribe, onDeathSubscribe,
				onABSubscribe, onFarmSubscribe
			])
		});
		const unConnectSubscribe = this.clientManagerService.$disconnect.subscribe((disconnectData) => {
			this.subscribeBotEventMap.get(disconnectData.id)?.forEach((subscribe) => {
				subscribe.unsubscribe()
			})
			this.subscribeBotEventMap.delete(disconnectData.id)
		})



		return {
			unsubscribe: () => {
				connectSubscribe.unsubscribe()
				unConnectSubscribe.unsubscribe()
			}
		} as Subscribe;
	}
}
export const wsBotEventsController = new WsBotEventsController(
	webSocketClients,
	clientManagerService,
	inventoryService,
	windowsService,
	chatService,
	captchaService,
	farmService,
	autoBuyService
)