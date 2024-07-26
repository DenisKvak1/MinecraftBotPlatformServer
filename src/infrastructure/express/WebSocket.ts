import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import { WebSocketClientsController } from './module/WebSocketClientsController';
import { ApplyWSBotEvents } from './module/ApplyWSBotEvents';
import { IClientManagerService } from '../../core/service/ClientManagerService';
import { IInventoryService } from '../../core/service/InventoryService';
import { IWindowService } from '../../core/service/WindowService';
import { IChatService } from '../../core/service/ChatService';
import { ICaptchaService } from '../../core/service/CaptchaService';
import { IncomingMessage } from 'node:http';
import { websocketAccountController } from '../controller/WebSocketAccountService';
import { webSocketClientManagerController } from '../controller/WebSocketClientManagerController';
import { webSocketChatServiceController } from '../controller/WebSocketChatService';
import { websocketClickerBotController } from '../controller/WebSocketClickerBotController';
import { websocketFoodController } from '../controller/WebSocketFoodBotController';
import { websocketFarmController } from '../controller/WebSocketFarmBotController';
import { websocketHeadBotController } from '../controller/WebSocketHeadBotController';
import { websocketInventoryBotController } from '../controller/WebSocketInventoryBotController';
import { webSocketWalkBotController } from '../controller/WebSocketWalkBotController';
import { websocketWindowController } from '../controller/WebSocketWindowBotController';
import { UNIVERSAL_COMMAND_LIST } from './types/webSocketBotCommandTypes';
import path from 'path';
import { IFarmService } from '../../core/service/FarmService';

export class App {
	private express = express()
	private server = http.createServer(this.express);
	private wss = new WebSocket.Server({ server: this.server });
	private routes: Record<UNIVERSAL_COMMAND_LIST, (message: IncomingMessage)=> void>;

	constructor(
		private webSocketController: WebSocketClientsController,
		private clientManagerService: IClientManagerService,
		private inventoryService: IInventoryService,
		private windowService: IWindowService,
		private chatService: IChatService,
		private captchaService: ICaptchaService,
		private farmService: IFarmService
	) {
		this.init();
	}

	private async init() {
		const eventSubscribe = await ApplyWSBotEvents(
			this.webSocketController,
			this.clientManagerService,
			this.inventoryService,
			this.windowService,
			this.chatService,
			this.captchaService,
			this.farmService
		)
		this.initRoutes()
		this.initStatic()

		this.wss.on('connection', (ws: WebSocket) => {
			this.webSocketController.addClient(ws)
			this.setupRoutes(ws)
		})
		this.wss.on('close', (ws: WebSocket) => {
			this.webSocketController.deleteClient(ws)
		})
	}

	private initRoutes(){
		this.routes = {
			[UNIVERSAL_COMMAND_LIST.GET_FARM_STATUS]: (message: IncomingMessage)=> websocketFarmController.getFarmStatus(message as any),
			[UNIVERSAL_COMMAND_LIST.CREATE_BOT]: (message: IncomingMessage) => websocketAccountController.createBot(message as any),
			[UNIVERSAL_COMMAND_LIST.DELETE_BOT]: (message: IncomingMessage) => websocketAccountController.deleteBot(message as any),
			[UNIVERSAL_COMMAND_LIST.GET_BOT_ID]: (message: IncomingMessage) => websocketAccountController.getByID(message as any),
			[UNIVERSAL_COMMAND_LIST.GET_BOT_NAME]: (message: IncomingMessage)=>websocketAccountController.getByName(message as any),
			[UNIVERSAL_COMMAND_LIST.GET_BOTS]: (message: IncomingMessage) => websocketAccountController.getBots(message as any),
			[UNIVERSAL_COMMAND_LIST.UPDATE_BOT_OPTIONS]: (message: IncomingMessage) => websocketAccountController.updateOptions(message as any),
			[UNIVERSAL_COMMAND_LIST.CONNECT_DISCONNECT_BOT]: (message: IncomingMessage) => webSocketClientManagerController.turnConnectBot(message as any),
			[UNIVERSAL_COMMAND_LIST.SEND_CHAT_MESSAGE]: (message: IncomingMessage) => webSocketChatServiceController.sendMessage(message as any),
			[UNIVERSAL_COMMAND_LIST.ATTACK]: (message: IncomingMessage) => websocketClickerBotController.attack(message as any),
			[UNIVERSAL_COMMAND_LIST.TOGGLE_CLICKER]: (message: IncomingMessage) => websocketClickerBotController.toggleAutoClicker(message as any),
			[UNIVERSAL_COMMAND_LIST.TOGGLE_FOOD]: (message: IncomingMessage) => websocketFoodController.toggleAutoFood(message as any),
			[UNIVERSAL_COMMAND_LIST.TOGGLE_FARM]: (message: IncomingMessage) => websocketFarmController.toggleAutoFarm(message as any),
			[UNIVERSAL_COMMAND_LIST.ROTATE_HEAD]: (message: IncomingMessage) => websocketHeadBotController.moveHead(message as any),
			[UNIVERSAL_COMMAND_LIST.SET_HOTBAR_SLOT]: (message: IncomingMessage) => websocketInventoryBotController.setHotBarSlot(message as any),
			[UNIVERSAL_COMMAND_LIST.DROP_SLOT]: (message: IncomingMessage) => websocketInventoryBotController.dropSlot(message as any),
			[UNIVERSAL_COMMAND_LIST.DROP_ALL_SLOT]: (message: IncomingMessage) => websocketInventoryBotController.dropAllSlots(message as any),
			[UNIVERSAL_COMMAND_LIST.GOTO]: (message: IncomingMessage) => webSocketWalkBotController.goto(message as any),
			[UNIVERSAL_COMMAND_LIST.MOVEMENT_BOT]: (message: IncomingMessage) => webSocketWalkBotController.move(message as any),
			[UNIVERSAL_COMMAND_LIST.JUMP_BOT]: (message: IncomingMessage) => webSocketWalkBotController.jump(message as any),
			[UNIVERSAL_COMMAND_LIST.CLICK_WINDOW]: (message: IncomingMessage) => websocketWindowController.click(message as any),
			[UNIVERSAL_COMMAND_LIST.GET_CURRENT_WINDOW]: (message: IncomingMessage)=> websocketWindowController.getCurrentWindow(message as any),
			[UNIVERSAL_COMMAND_LIST.GET_INVENTORY_SLOTS]: (message: IncomingMessage) => websocketInventoryBotController.getSlots(message as any),
			[UNIVERSAL_COMMAND_LIST.ACTIVATE_SLOT]: (message: IncomingMessage)=> websocketInventoryBotController.activateSlot(message as any)
		};
	}

	initStatic(){
		this.express.use(express.static(path.join(process.cwd(), 'static')));
	}

	private setupRoutes(ws: WebSocket) {
		ws.on('message', (data)=>{
			const jsonData = JSON.parse(data.toString())
			this.routes[jsonData.command](jsonData)
		})
	}

	start(port: number){
		this.server.listen(port,'0.0.0.0',()=> {
			console.log(`webSocket client start on ${port}`)
		});
	}
}
