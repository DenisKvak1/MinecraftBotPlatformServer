import { IInventoryService } from '../../core/service/InventoryService';
import { ClientBotRepository } from '../../core/repository/ClientBotRepository/clientBotRepository';
import { botInRAMRepository } from '../database/repository/inRAMBotDateBase';
import { InventoryUpdateDTO } from '../../core/service/ClientBot';
import { Subscribe } from '../../../env/helpers/observable';
import { ToGeneralizedItems } from '../../../env/helpers/ToGeneralizedItem';

export class InventoryService implements IInventoryService {
	constructor(
		private repository: ClientBotRepository,
	) {
	}

	async dropSlot(id: string, slot: number): Promise<void> {
		const bot = this.repository.getById(id)._bot;
		const item = bot.inventory.slots[slot];
		if (!item) return;

		await bot.tossStack(item);
	}

	setHotBarSlot(id: string, slot: number): void {
		const bot = this.repository.getById(id)._bot;
		bot.setQuickBarSlot(slot);
	}

	dropAll(id: string): void {
		const bot = this.repository.getById(id)._bot;
		const inventory = bot.inventory.items();

		inventory.forEach((item, index) => {
			setTimeout(()=> bot.tossStack(item), 100)
		});
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

	useSlot(id: string, slotID: number): void {
		const bot = this.repository.getById(id)._bot
		bot.setQuickBarSlot(slotID)
		bot.activateItem()
	}
}

export const inventoryService = new InventoryService(botInRAMRepository);