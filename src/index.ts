import { accountService } from './core/service/AccountService';
import { clientManagerService } from './infrastructure/services/ClientManagerService';
import { App } from './infrastructure/express/WebSocket';
import { webSocketClients } from './infrastructure/express/module/WebSocketClientsController';
import { inventoryService } from './infrastructure/services/InventoryService';
import { windowsService } from './infrastructure/services/WindowService';
import { chatService } from './infrastructure/services/ChatService';
import { captchaService } from './infrastructure/services/CaptchaService';
import { farmService } from './infrastructure/services/FarmService';
import { websocketHeadBotController } from './infrastructure/controller/WebSocketHeadBotController';
import { UNIVERSAL_COMMAND_LIST } from './infrastructure/express/types/webSocketBotCommandTypes';
import { logger } from './infrastructure/logger/Logger';
import { autoBuyService } from './infrastructure/services/AutoBuyService';

try {
	const app = new App(
		webSocketClients,
		clientManagerService,
		inventoryService,
		windowsService,
		chatService,
		captchaService,
		farmService
	);
	app.start(3000);
} catch (e) {
	logger.error(e.message)
}

process.on('uncaughtException', (reason)=>{
	logger.error(reason.message)
})

accountService.getByName('Zancerio45').then(async (data)=>{
	const id = data.id
	ab(id, 1000)
})
// accountService.getByName('Zancerio45').then(async (data)=>{
// 	const id = data.id
// 	ab(id, 1200)
// })
accountService.getByName('Zancerio55').then(async (data)=>{
	const id = data.id
	ab(id, 1500)
})
accountService.getByName('Zancerio65').then(async (data)=>{
	const id = data.id
	ab(id, 2000)
})
// accountService.getByName('Zancerio65').then(async (data)=>{
// 	const id = data.id
// 	ab(id, 1900)
// })
// accountService.getByName('Zancerio75').then(async (data)=>{
// 	const id = data.id
// 	ab(id, 2100)
// })
async function ab(id: string, intrval: number = 1000){
	clientManagerService.connect(id)
	await new Promise<void>((r)=> setTimeout(()=> r(), 4000))
	inventoryService.useSlot(id, 0)
	await new Promise<void>((r)=> setTimeout(()=> r(), 1500))
	await windowsService.click(id, 12)
	await new Promise<void>((r)=> setTimeout(()=> r(), 1500))
	await windowsService.click(id, 3)
	await new Promise<void>((r)=> setTimeout(()=> r(), 1500))
	await windowsService.click(id, 20)
	setTimeout(()=>{
		autoBuyService.startAutoBuy(id)
	}, intrval)
}