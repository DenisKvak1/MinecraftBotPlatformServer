import { accountService } from './core/service/AccountService';
import { clientManagerService } from './infrastructure/services/ClientManagerService';
import { App } from './infrastructure/express/WebSocket';
import { webSocketClients } from './infrastructure/express/module/WebSocketClientsController';
import { inventoryService } from './infrastructure/services/InventoryService';
import { windowsService } from './infrastructure/services/WindowService';
import { chatService } from './infrastructure/services/ChatService';
import { captchaService } from './infrastructure/services/CaptchaService';
import { UNIVERSAL_COMMAND_LIST } from '../env/types';
import { farmService } from './infrastructure/services/FarmService';
import { websocketHeadBotController } from './infrastructure/controller/WebSocketHeadBotController';

const app = new App(
	webSocketClients,
	clientManagerService,
	inventoryService,
	windowsService,
	chatService,
	captchaService,
);
app.start(3000);

accountService.getByID('Zancerio2').then((data) => {
	clientManagerService.connect(data.id);
});