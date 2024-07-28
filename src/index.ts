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