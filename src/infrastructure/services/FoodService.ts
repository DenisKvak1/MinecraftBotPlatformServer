import { IFoodService } from '../../core/service/FoodService';
import { ClientBotRepository } from '../../core/repository/ClientBotRepository/clientBotRepository';
import { Bot } from 'mineflayer';
import { botInRAMRepository } from '../database/repository/inRAMBotDateBase';
import { isEdible } from '../../../env/helpers/isEdible';

export class FoodService implements IFoodService {
	private foodIntervals: Map<string, NodeJS.Timeout> = new Map();

	constructor(
		private repository: ClientBotRepository,
	) {
	}

	startAutoFood(id: string): void {
		const bot = this.repository.getById(id)._bot;
		const interval = setInterval(async ()=> {
			const isHunger = this.checkHunger(bot)
			const slot = bot.inventory.slots[45]?.name
			if (isHunger) {
				if (!isEdible(slot)){
					await this.takeFood(bot)
				}
				bot.activateItem(true)
			}
		}, 5000)
		if (this.foodIntervals.get(id)) this.foodIntervals.delete(id)

		this.foodIntervals.set(id,  interval)
	}

	stopAutoFeed(id: string): void{
		const interval = this.foodIntervals.get(id)
		clearInterval(interval)
		this.foodIntervals.delete(id);
	}

	private checkHunger(bot: Bot) {
		const hunger = bot.food; // Получаем текущий уровень голода
		if (hunger < 6) {
			return true
		}
		return false
	};

	private async moveFoodToOffhand(bot: Bot) {
		const slots = bot.inventory.slots;

		for (const item of slots) {
			if (item && isEdible(item.name)) {
				try {
					await bot.equip(item, 'off-hand')
					return true
				} catch (err) {
					return false
				}
			}
		}
		return false
	}

	private async takeFood(bot: Bot): Promise<boolean> {
		const leftHand = bot.inventory.slots[45];
		if (leftHand) {
			const isFood = isEdible(leftHand.name);
			if (isFood) return true;
		}
		const isSuccess = await this.moveFoodToOffhand(bot)
		return isSuccess
	}
}
export const foodService = new FoodService(botInRAMRepository)