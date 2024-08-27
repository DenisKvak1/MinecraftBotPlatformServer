import { IChatService } from '../../core/service/ChatService';
import { IClickerService } from '../../core/service/ClickerService';
import { IClientManagerService } from '../../core/service/ClientManagerService';
import { IFarmService } from '../../core/service/FarmService';
import { IFoodService } from '../../core/service/FoodService';
import { IInventoryService } from '../../core/service/InventoryService';
import { IWalkService } from '../../core/service/WalkService';
import { IWindowService } from '../../core/service/WindowService';
import { BotScriptRepository } from '../../core/repository/BotScriptsRepository/BotScriptsRepository';
import { IBotScriptService } from '../../core/service/BotScriptService/BotScriptService';
import {
	AddToMassAutobuyBotAction,
	BOT_SCRIPT_ACTIONS,
	BotAction,
	BotActions,
	BotScript,
	ClickWindowBotAction, DeleteToMassAutobuyBotAction,
	DropSlotBotAction,
	GotoBotAction,
	SendChatMessageBotAction,
	SetHotbarSlotBotAction,
	SleepBotAction, StartMassAutobuyBotAction, StopMassAutobuyBotAction,
	ToggleAttackClickerBotAction,
	ToggleAutobuyBotAction,
	ToggleFarmBotAction,
	ToggleFoodBotAction,
	ToggleUseClickerBotAction,
} from '../../core/service/BotScriptService/types';
import { syncTimeout } from '../../../env/helpers/syncTimeout';
import { IAutoBuyService } from '../../core/service/AutoBuy';
import { inMemoryBotScriptsRepository } from '../database/repository/inMemoryBotScriptsRepository';
import { clientManagerService } from './ClientManagerService';
import { chatService } from './ChatService';
import { clickerService } from './ClickerService';
import { farmService } from './FarmService';
import { foodService } from './FoodService';
import { inventoryService } from './InventoryService';
import { walkService } from './WalkService';
import { windowsService } from './WindowService';
import { autoBuyService } from './AutoBuy/AutoBuyService';
import { getRawAsset } from 'node:sea';
import { accountService, AccountService } from '../../core/service/AccountService';

class BotScriptService implements IBotScriptService {
	private commandFunctions: Record<BOT_SCRIPT_ACTIONS, (botId: string, command: BotAction) => Promise<void>>

	constructor(
		private botScriptsRepository: BotScriptRepository,
		private accountService: AccountService,
		private clientManagerService: IClientManagerService,
		private chatService: IChatService,
		private clickerService: IClickerService,
		private farmService: IFarmService,
		private foodService: IFoodService,
		private inventoryService: IInventoryService,
		private walkService: IWalkService,
		private windowService: IWindowService,
		private autoBuyService: IAutoBuyService,
	) {
		this.init();
	}

	private init() {
		this.commandFunctions = {
			START_MASS_AUTOBUY: async (botId, command: StartMassAutobuyBotAction)=>{
				const ids = []
				await Promise.all(command.value.botsNicknames.map(async (name)=>{
					const id = (await this.accountService.getByID(name)).id
					ids.push(id)
				}))
				await this.autoBuyService.startAutoBuySystem(ids)
			},
			STOP_MASS_AUTOBUY: async (botId, command: StopMassAutobuyBotAction)=>{
				this.autoBuyService.stopAutoBuy(command.value.massId)
			},
			ADD_MASS_AUTOBUY_PLAYER: async (botId, command: AddToMassAutobuyBotAction)=>{
				await this.autoBuyService.addToAutoBuySystem(command.value.massId, botId)
			},
			DELETE_MASS_AUTOBUY_PLAYER: async (botId, command: DeleteToMassAutobuyBotAction)=>{
				await this.autoBuyService.deleteMassAutoBuyBot(command.value.massId, botId)
			},
			ACTIVATE_ITEM: async (botId) => {
				await this.inventoryService.activate(botId);
			},
			ATTACK: async (botID) => {
				this.clickerService.attack(botID);
			},
			CLICK_WINDOW: async (botId, command: ClickWindowBotAction) => {
				await this.windowService.click(botId, command.value.slotIndex);
			},
			CONNECT: async (botId) => {
				this.clientManagerService.connect(botId);
			},
			DISCONNECT: async (botId) => {
				this.clientManagerService.disconnect(botId);
			},
			DROP_SLOT: async (botId, command: DropSlotBotAction) => {
				this.inventoryService.dropSlot(botId, command.value.slotIndex);
			},
			GOTO: async (botId, command: GotoBotAction) => {
				this.walkService.goto(botId, command.value.x, command.value.y, command.value.z);
			},
			SEND_CHAT_MESSAGE: async (botId, command: SendChatMessageBotAction) => {
				this.chatService.sendMessage(botId, command.value.message);
			},
			SET_HOTBOR_SLOT: async (botId, command: SetHotbarSlotBotAction) => {
				this.inventoryService.setHotBarSlot(botId, command.value.slotIndex);
			},
			SLEEP: async (botId, command: SleepBotAction) => {
				await syncTimeout(command.value.sleepTimeout);
			},
			TOGGLE_ATTACK_CLICKER: async (botId, command: ToggleAttackClickerBotAction) => {
				switch (command.value.toggle) {
					case 'START':
						this.clickerService.startAttackClicker(botId, command.value.intervalTimeout);
						break;
					case 'STOP':
						this.clickerService.stopAttackClicker(botId);
				}
			},
			TOGGLE_AUTOBUY: async (botId, command: ToggleAutobuyBotAction) => {
				switch (command.value.toggle) {
					case 'START':
						this.autoBuyService.stopAutoBuy(botId);
						break;
					case 'STOP':
						this.autoBuyService.stopAutoBuy(botId);
				}
			},
			TOGGLE_FARM: async (botId, command: ToggleFarmBotAction) => {
				switch (command.value.toggle) {
					case 'START':
						this.farmService.startFarm(botId);
						break;
					case 'STOP':
						this.farmService.stopFarm(botId);
				}
			},
			TOGGLE_FOOD: async (botId, command: ToggleFoodBotAction) => {
				switch (command.value.toggle) {
					case 'START':
						this.foodService.startAutoFood(botId);
						break;
					case 'STOP':
						this.foodService.stopAutoFeed(botId);
				}
			},
			TOGGLE_USE_CLICKER: async (botId, command: ToggleUseClickerBotAction) => {
				switch (command.value.toggle) {
					case 'START':
						this.clickerService.startUseItemClicker(botId, command.value.intervalTimeout);
						break;
					case 'STOP':
						this.clickerService.stopUseItemClicker(botId);
				}
			},
		};

	}

	async get(id: string): Promise<BotScript> {
		return this.botScriptsRepository.getById(id);
	}

	async getAll(): Promise<BotScript[]> {
		return this.botScriptsRepository.getAll();
	}

	async run(scriptId: string, botId: string): Promise<void> {
		const script = await this.botScriptsRepository.getById(scriptId);
		await this.execute(script, botId);
	}

	async runByName(scriptName: string, botId: string): Promise<void> {
		const script = await this.botScriptsRepository.getByName(scriptName)
		await this.execute(script, botId);
	}

	async save(name: string, botActions: BotActions): Promise<BotScript> {
		const existScript = await this.botScriptsRepository.getByName(name);
		if (!existScript) {
			return await this.botScriptsRepository.create({ name, botActions });
		} else {
			existScript.botActions = botActions;
			this.botScriptsRepository.save(existScript);
			return existScript
		}
	}

	private async execute(script: BotScript, botId: string) {
		for (const action of script.botActions) {
			if (!this.commandFunctions[action.command]) return;
			await this.commandFunctions[action.command](botId, action);
		}
	}

	async delete(id: string): Promise<void> {
		this.botScriptsRepository.delete(id)
	}
}

export const botScriptsService = new BotScriptService(
	inMemoryBotScriptsRepository,
	accountService,
	clientManagerService,
	chatService,
	clickerService,
	farmService,
	foodService,
	inventoryService,
	walkService,
	windowsService,
	autoBuyService,
)
clientManagerService.loadBotScript(botScriptsService)