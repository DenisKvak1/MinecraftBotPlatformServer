import { IInventoryService } from '../../core/service/InventoryService';
import { ClientBotRepository } from '../../core/repository/ClientBotRepository/clientBotRepository';
import { botInRAMRepository } from '../database/repository/inRAMBotDateBase';
import { InventoryUpdateDTO } from '../../core/service/ClientBot';
import { Subscribe } from '../../../env/helpers/observable';
import { ToGeneralizedItems } from '../../../env/helpers/ToGeneralizedItem';
import { logger } from '../logger/Logger';
import { syncTimeout } from '../../../env/helpers/syncTimeout';
import { Bot } from 'mineflayer';

export class InventoryService implements IInventoryService {
	constructor(
		private repository: ClientBotRepository,
	) {
	}

	async dropSlot(id: string | Bot , slot: number): Promise<void> {
		logger.info(`${id}: Попытка выкинуть предмет с индексом ${slot}`)
		let bot:Bot
		if(typeof id === 'string') {
			bot = this.repository.getById(id)._bot;
		} else {
			bot = id
		}

		const item = bot.inventory.slots[slot];
		if(bot.currentWindow) {
			item.slot = (bot.currentWindow.slots.length - 45) + item.slot
		}
		if (!item) return;

		try {
			await bot.tossStack(item);
		} catch (e) {
			logger.warn(`${id}: Ошибка при выкидывании предмета с индексом ${slot}: ${e.message}`)
		}
	}

	setHotBarSlot(id: string, slot: number): void {
		logger.info(`${id}: Выбрал стот хотбара с индексом ${slot}`)
		const bot = this.repository.getById(id)._bot;
		bot.setQuickBarSlot(slot);
	}

	async dropAll(id: string): Promise<void> {
		const bot = this.repository.getById(id)._bot;
		const inventory = bot.inventory.slots;
		logger.info(`${id}: Выкинул все предметы из инвентаря`)

		for (const item of inventory) {
			if(!item) continue;
			await syncTimeout(400)
			await this.dropSlot(bot, item.slot)
		}
	}

	getSlots(id: string) {
		const bot = this.repository.getById(id)._bot;
		return {
			slots: ToGeneralizedItems(bot.inventory.slots),
			selectedSlot: bot.quickBarSlot
		}
	}

	onUpdateSlot(id: string, callback: (dto: InventoryUpdateDTO) => void): Subscribe {
		return this.repository.getById(id)?.$inventoryUpdate.subscribe((dto) => {
			callback(dto);
		});
	}

	async activate(id: string): Promise<void> {
		const bot = this.repository.getById(id)._bot
		await bot.activateItem()
	}

	useSlot(id: string, slotID: number): void {
		const bot = this.repository.getById(id)._bot
		logger.info(`${id}: Активирован предмет в слоте с индексом ${slotID}`)

		bot.setQuickBarSlot(slotID)
		bot.activateItem()
	}
}

export const inventoryService = new InventoryService(botInRAMRepository);