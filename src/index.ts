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
import { error } from 'winston';

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
	console.log(e);
	logger.error(e.message);
}

process.on('uncaughtException', (reason) => {
	console.log(reason);
	console.log(reason.stack);
});

setTimeout(() => {
	(async function f() {
		const id1 = 'e557b8ab-e039-4691-bb19-28d9845359d5';
		const id2 = 'ed223076-682b-40c4-be65-1b5abb4868d2';
		const id3 = '5a50a87e-6422-482f-880f-d68d5c2b93af';
		const id4 = '3917181e-8e5b-445b-b411-efededb88ca6';
		const id5 = '83d51642-dedc-4e3b-b215-153260963841';
		const id6 = 'eff2ab9a-3701-4310-a0fe-ecd6a73a82c2';
		const id7 = '485ce6cf-5875-4629-a71f-97cf9264f237';
		const id8 = '41265256-24b3-4233-8a0e-0376b05f2b87';
		const id9 = '8836008a-683f-4c79-bde3-a3584a9e1f87';
		const id10 = 'da483929-c682-4783-87ce-a059b327d3f3';
		// const bots = [id1, id2, id3, id4, id5, id6, id7, id8, id9, id10];
		const bots = [id1, id2, id3, id4, id5, id6, id7, id8, id9, id10];
		for (let i = 0; i < bots.length; i++) {
			const id = bots[i];
			botScriptsService.runByName(`spookey ${i + 1}`, id);
			await syncTimeout(5000);
		}
	})();
}, 0);