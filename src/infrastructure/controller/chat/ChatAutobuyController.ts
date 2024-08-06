import { IChatService } from '../../../core/service/ChatService';
import { IAutoBuyService } from '../../../core/service/AutoBuy';
import { IWindowService } from '../../../core/service/WindowService';
import { windowsService } from '../../services/WindowService';
import { ChatController } from '../../chatController/ChatController';
import { clientManagerService } from '../../services/ClientManagerService';
import { chatService } from '../../services/ChatService';
import { accountService } from '../../../core/service/AccountService';
import { autoBuyService } from '../../services/AutoBuy/AutoBuyService';

export class WebSocketAutoBuyController {
	constructor(
		private abService: IAutoBuyService,
		private windowService: IWindowService,
		private chatService: IChatService,
	) {}

	async turnOffAutoBuy(botID: string){
		try {
			this.abService.stopAutoBuy(botID)
			windowsService.closeWindow(botID)
		} catch (e){

		}
	}

	async turnOnAutoBuy(botID: string) {
		try {
			this.chatService.sendMessage(botID, '/ah')
			await new Promise<void>((r)=> setTimeout(()=> r(), 200))
			await this.windowService.click(botID, 53, 1)
			await new Promise<void>((r)=> setTimeout(()=> r(), 200))
			this.abService.startAutoBuy(botID)
		} catch (e) {

		}
	}
}
export const chatAutoBuyController = new WebSocketAutoBuyController(autoBuyService, windowsService, chatService)