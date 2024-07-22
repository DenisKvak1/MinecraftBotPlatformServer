import { IFarmService } from '../../core/service/FarmService';
import { ClientBotRepository } from '../../core/repository/ClientBotRepository/clientBotRepository';
import { IFoodService } from '../../core/service/FoodService';
import { IClickerService } from '../../core/service/ClickerService';
import { botInRAMRepository } from '../database/repository/inRAMBotDateBase';
import { foodService } from './FoodService';
import { clickerService } from './ClickerService';

export class FarmService implements IFarmService{
	private farmMap = new Map<string, boolean>();

	constructor(
		private repository: ClientBotRepository,
		private foodService: IFoodService,
		private clickerService: IClickerService,
	) {}
	startFarm(id: string): void {
		this.clickerService.startAttackClicker(id, 700)
		this.foodService.startAutoFood(id)
		this.farmMap.set(id, true);
	}

	stopFarm(id: string): void {
		this.clickerService.stopAttackClicker(id)
		this.foodService.stopAutoFeed(id)
		this.farmMap.set(id,  false)
		this.farmMap.delete(id)
	}
}
export const farmService = new FarmService(botInRAMRepository, foodService, clickerService)