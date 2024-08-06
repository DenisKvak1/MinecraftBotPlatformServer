import { accountService } from './core/service/AccountService';
import { clientManagerService } from './infrastructure/services/ClientManagerService';
import { App } from './infrastructure/express/WebSocket';
import { webSocketClients } from './infrastructure/express/module/WebSocketClientsController';
import { inventoryService } from './infrastructure/services/InventoryService';
import { windowsService } from './infrastructure/services/WindowService';
import { chatService } from './infrastructure/services/ChatService';
import { farmService } from './infrastructure/services/FarmService';
import { logger } from './infrastructure/logger/Logger';
import { autoBuyService } from './infrastructure/services/AutoBuy/AutoBuyService';
import { captchaService } from './infrastructure/services/CaptchaService/CaptchaService';
import { botInRAMRepository } from './infrastructure/database/repository/inRAMBotDateBase';
import { foodService } from './infrastructure/services/FoodService';
import { ChatController } from './infrastructure/chatController/ChatController';

try {
	const app = new App(
		webSocketClients,
		clientManagerService,
		inventoryService,
		windowsService,
		chatService,
		captchaService,
		farmService,
		autoBuyService
	);
	app.start(3000);

	const chatController = new ChatController(clientManagerService, chatService, accountService)
	chatController.start()
} catch (e) {
	logger.error(e.message)
}


process.on('uncaughtException', (reason)=>{
	logger.error(reason.message)
})

accountService.getByName('jukMayski103').then(async (data)=>{
	const id = data.id
	ab(id, 1000)
})
// accountService.getByName('Zancerio45').then(async (data)=>{
// 	const id = data.id
// 	ab(id, 1200)
// })
// accountService.getByName('Zancerio55').then(async (data)=>{
// 	const id = data.id
// 	ab(id, 1500)
// })
// accountService.getByName('Zancerio65').then(async (data)=>{
// 	const id = data.id
// 	ab(id, 2000)
// })
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
	await windowsService.click(id, 4)
	await new Promise<void>((r)=> setTimeout(()=> r(), 1500))
	await windowsService.click(id, 35)
	setTimeout(()=>{
		botInRAMRepository.getById(id)._bot.setControlState('sneak', true)
		foodService.startAutoFood(id)
		chatService.sendMessage(id, '/ah')
		setTimeout(()=> windowsService.click(id, 53, 1), 300)
		setTimeout(()=> autoBuyService.startAutoBuy(id), 600)
	}, intrval)
}