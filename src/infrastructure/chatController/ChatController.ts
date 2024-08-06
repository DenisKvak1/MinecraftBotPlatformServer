import { clientManagerService, ClientManagerService } from '../services/ClientManagerService';
import { accountService, AccountService } from '../../core/service/AccountService';
import { chatService, ChatService } from '../services/ChatService';
import { IChatService } from '../../core/service/ChatService';
import { Subscribe } from '../../../env/helpers/observable';
import { chatAutoBuyController } from '../controller/chat/ChatAutobuyController';
import { chatInventoryController } from '../controller/chat/ChatInventoryController';
import exp from 'node:constants';

export class ChatController {
	constructor(
		private clientManager: ClientManagerService,
		private chatService: IChatService,
		private accountService: AccountService
	) {
	}

	start(){
		const chatRoutes = {
			'/сус вкл': (botID: string)=> chatAutoBuyController.turnOnAutoBuy(botID),
			'/сус выкл': (botID: string)=> chatAutoBuyController.turnOffAutoBuy(botID),
			'/drop all': (botID: string)=> chatInventoryController.dropAllSlots(botID)
		}

		this.clientManager.$connect.subscribe(async (eventData)=>{
			const id = eventData.id
			this.chatService.onPersonalMessage(id, async (message, username)=>{
				const account = await this.accountService.getByID(id)
				if(!account.whiteList.includes(username)) return
				if(chatRoutes[message]) chatRoutes[message](id)
			})
		})
	}
}
