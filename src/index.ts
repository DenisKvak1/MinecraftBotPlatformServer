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
import { ChatController } from './infrastructure/chatController/ChatController';
import { clickerService } from './infrastructure/services/ClickerService';
import { getRawAsset } from 'node:sea';
import { syncTimeout } from '../env/helpers/syncTimeout';
import { inMemoryAccountRepository } from './infrastructure/database/repository/inMemoryAccountRepository';
import { botInRAMRepository } from './infrastructure/database/repository/inRAMBotDateBase';
import { getRandomInRange } from '../env/helpers/randomGenerator';

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

setTimeout(()=> {
	(async function f(){
		const id1 = (await accountService.getByName('Zancerio65')).id
		const id2 = (await accountService.getByName('Zancerio66')).id
		const id3 = (await accountService.getByName('Zancerio67')).id
		const id4 = (await accountService.getByName('Zancerio68')).id
		const id5 = (await accountService.getByName('Zancerio75')).id

		const bot = botInRAMRepository.getById(id1)._bot

		// console.log(bot.scoreboard['1']['itemsMap']['§2'].displayName.extra[2].text.replace(',', ''))
		// bot.on('scoreUpdated', (scoreboard, item:any)=>{
		// 	console.log(`${item.name} ХП: ${item.value}`)
		// })


		const bots = [id1, id2, id3, id4, id5]
		bots.forEach(async (id)=>{
			clientManagerService.connect(id)
			await syncTimeout(3000)
			chatService.sendMessage(id, '/lite')
			await syncTimeout(1000)
			await windowsService.click(id, 4)
			await syncTimeout(1500)
			await windowsService.click(id, getRandomInRange(38, 45))
			await syncTimeout(1500)
		})

		await syncTimeout(8000)
		try {
			await autoBuyService.startAutoBuySystem(bots)
		} catch (e){

		}
	})()

}, 0)