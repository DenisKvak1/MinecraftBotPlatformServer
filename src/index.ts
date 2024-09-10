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
import { ChatLSController } from './infrastructure/chatController/ChatLSController';
import { botScriptsService } from './infrastructure/services/BotScriptService';
import { BOT_SCRIPT_ACTIONS } from './core/service/BotScriptService/types';
import { syncTimeout } from '../env/helpers/syncTimeout';
import { getRandomInRange } from '../env/helpers/randomGenerator';
import { botInRAMRepository } from './infrastructure/database/repository/inRAMBotDateBase';
import { ToGeneralizedItem } from '../env/helpers/ToGeneralizedItem';

try {
	const app = new App(
		webSocketClients,
		clientManagerService,
		inventoryService,
		windowsService,
		chatService,
		captchaService,
		farmService,
		autoBuyService,
	);
	app.start(3000);

	const chatController = new ChatLSController(clientManagerService, chatService, accountService);
	chatController.start();
} catch (e) {
	logger.error(e.message);
}

process.on('uncaughtException', (reason) => {
	logger.error(reason.message);
});


// botScriptsService.save('lite', [
// 	{
// 		command: BOT_SCRIPT_ACTIONS.CONNECT,
// 	},
// 	{
// 		command: BOT_SCRIPT_ACTIONS.SLEEP,
// 		value: {
// 			sleepTimeout: 4000,
// 		},
// 	},
// 	{
// 		command: BOT_SCRIPT_ACTIONS.SEND_CHAT_ESSAGE,
// 		value: {
// 			message: '/lite',
// 		},
// 	},
// 	{
// 		command: BOT_SCRIPT_ACTIONS.SLEEP,
// 		value: {
// 			sleepTimeout: 1000,
// 		},
// 	},
// 	{
// 		command: BOT_SCRIPT_ACTIONS.CLICK_WINDOW,
// 		value: {
// 			slotIndex: 4,
// 		},
// 	},
// 	{
// 		command: BOT_SCRIPT_ACTIONS.SLEEP,
// 		value: {
// 			sleepTimeout: 1000,
// 		},
// 	},
// 	{
// 		command: BOT_SCRIPT_ACTIONS.CLICK_WINDOW,
// 		value: {
// 			slotIndex: 44,
// 		},
// 	},
// ]).then(async (script) => {
// 	await botScriptsService.run(script.id, (await accountService.getByName('Fles1hPop')).id);
// });


setTimeout(() => {
	(async function f() {
		const id1 = (await accountService.getByName('ImpPlant11')).id;
		const id2 = (await accountService.getByName('CaesarJ22')).id;
		const id3 = (await accountService.getByName('Dreadlight33')).id;
		const id4 = (await accountService.getByName('Chinaplate44')).id;
		const id5 = (await accountService.getByName('Assaultive50')).id;

		const bots = [id1, id2, id3, id4, id5];
		bots.forEach(async (id, index) => {
			botScriptsService.runByName(`lite ${index + 1}`, id);
		});

		await syncTimeout(15000);
		try {
			await autoBuyService.startAutoBuySystem(bots);
		} catch (e) {
			console.log(e.message);
		}
	})();
}, 0);