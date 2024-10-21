import { accountService } from './core/service/AccountService';
import { clientManagerService } from './infrastructure/services/ClientManagerService';
import { App } from './infrastructure/express/WebSocket';
import { webSocketClients } from './infrastructure/express/module/WebSocketClientsController';
import { inventoryService } from './infrastructure/services/InventoryService';
import { windowsService } from './infrastructure/services/WindowService';
import { chatService } from './infrastructure/services/ChatService';
import { farmService } from './infrastructure/services/FarmService/FarmService';
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

// setTimeout(() => {
// 	(async function f() {
// 	const id1 = '9947a397-8b6b-48b2-bdf0-0d2d51b59221'
// 	const id2 = 'a046734f-55d3-49c1-b376-23c98a456618'
// 	const id3 = '05aaef61-4774-4753-bba8-634778f5913e'
// 	// const id4 = '032e79b6-3fa9-465a-a1d5-593fa98a13bf'
// 	// const id5 = "4bbce9ce-d93c-40bc-b192-2f96f368979e"
//
// 	const bots = [id1, id2, id3];
// 	bots.forEach(async (id, index) => {
// 		botScriptsService.runByName(`lite ${index + 1}`, id);
// 	});
//
// 	await syncTimeout(15000);
// 	try {
// 		await autoBuyService.startAutoBuySystem(bots);
// 	} catch (e) {
// 		console.log(e.message);
// 	}
// })();
// }, 0);