import { IFoodService } from '../../../core/service/FoodService';
import { webSocketClients, WebSocketClientsController } from '../../express/module/WebSocketClientsController';
import { IFarmService } from '../../../core/service/FarmService';
import { IAutoBuyService } from '../../../core/service/AutoBuy';
import {
	BotFunctions,
	IncomingGetBotFunctionsStateMessage,
	OutgoingGetBotFunctionStatusReplayMessage,
	STATUS,
	UNIVERSAL_COMMAND_LIST,
} from '../../express/types/webSocketBotCommandTypes';
import { returnWSError } from '../../express/helper/returnWSOk';
import { IClickerService } from '../../../core/service/ClickerService';
import { aborted } from 'node:util';
import { autoBuyService } from '../../services/AutoBuy/AutoBuyService';
import { farmService } from '../../services/FarmService/FarmService';
import { foodService } from '../../services/FarmService/FoodService';
import { clickerService } from '../../services/FarmService/ClickerService';

export class WebSocketFunctionsBotController {
	constructor(
		private abService: IAutoBuyService,
		private farmService: IFarmService,
		private foodService: IFoodService,
		private clickerService: IClickerService,
		private wsClients: WebSocketClientsController,
	) {
	}

	getFunctionsStatus(message: IncomingGetBotFunctionsStateMessage) {
		try {
			const botID = message.botID;


			const abStatus = this.abService.getAutoBuyState(botID);
			const farmStatus = this.farmService.getFarmState(botID);
			const autoClickerAttackStatus = this.clickerService.getAttackClickerStatus(botID)
			const autoClickerUseItemStatus = this.clickerService.getAttackClickerStatus(botID)
			const foodStatus = this.foodService.getAutoFoodStatus(botID);


			this.wsClients.broadcast<OutgoingGetBotFunctionStatusReplayMessage>({
				command: UNIVERSAL_COMMAND_LIST.GET_BOT_FUNCTIONS_STATUS,
				botID,
				status: STATUS.SUCCESS,
				data: {
					functionsStatus: {
						[BotFunctions.AUTO_BUY]: abStatus,
						[BotFunctions.AUTO_FARM]: farmStatus,
						[BotFunctions.AUTO_FOOD]: foodStatus,
						[BotFunctions.AUTO_CLICKER_ATTACK]: autoClickerAttackStatus,
						[BotFunctions.AUTO_CLICKER_USE]: autoClickerUseItemStatus
					}
				},
			});
		} catch (e) {
			returnWSError(message, e.message, this.wsClients);
		}
	}
}
export const webSocketFunctionsBotController = new WebSocketFunctionsBotController(
	autoBuyService,
	farmService,
	foodService,
	clickerService,
	webSocketClients
)