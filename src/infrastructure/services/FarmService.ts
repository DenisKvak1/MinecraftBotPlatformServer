import { IFarmService } from '../../core/service/FarmService';
import { ClientBotRepository } from '../../core/repository/ClientBotRepository/clientBotRepository';
import { IFoodService } from '../../core/service/FoodService';
import { IClickerService } from '../../core/service/ClickerService';
import { botInRAMRepository } from '../database/repository/inRAMBotDateBase';
import { foodService } from './FoodService';
import { clickerService } from './ClickerService';
import { logger } from '../logger/Logger';
import { Observable } from '../../../env/helpers/observable';
import { toggle, toggleInfo } from '../../../env/types';

export class FarmService implements IFarmService{
	private farmMap = new Map<string, boolean>();
	$farm = new Observable<{id: string, action: toggle}>()

	constructor(
		private foodService: IFoodService,
		private clickerService: IClickerService,
	) {}

	startFarm(id: string): void {
		this.clickerService.startAttackClicker(id, 700)
		this.foodService.startAutoFood(id)
		this.farmMap.set(id, true);

		logger.info(`${id}: Запустил автофарм`)
		this.$farm.next({id, action: 'START'})
	}

	stopFarm(id: string): void {
		this.clickerService.stopAttackClicker(id)
		this.foodService.stopAutoFeed(id)
		this.farmMap.set(id,  false)
		this.farmMap.delete(id)

		logger.info(`${id}: Остановил автофарм`)
		this.$farm.next({id, action: 'STOP'})
	}

	getFarmState(id: string): toggleInfo {
		if (this.farmMap.has(id)) {
			return 'ON'
		} else {
			return 'OFF'
		}
	}
}
export const farmService = new FarmService(foodService, clickerService)