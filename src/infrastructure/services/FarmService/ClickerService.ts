import { IClickerService } from '../../../core/service/ClickerService';
import { ClientBotRepository } from '../../../core/repository/ClientBotRepository/clientBotRepository';
import { botInRAMRepository } from '../../database/repository/inRAMBotDateBase';
import { clearInterval } from 'node:timers';
import { logger } from '../../logger/Logger';
import { config } from '../../../core/config';
import { Entity } from 'prismarine-entity'
import { block } from 'sharp';
import { toggleInfo } from '../../../../env/types';

export class ClickerService implements IClickerService {
	private attackIntervals: Map<string, NodeJS.Timeout> = new Map();
	private useIntervals: Map<string, NodeJS.Timeout> = new Map();

	constructor(
		private repository: ClientBotRepository,
	) {
	}

	startAttackClicker(id: string, interval: number): void {
		const bot = this.repository.getById(id)._bot;
		logger.info(`${id}: Запустил кликер атаки с интервалом ${interval}`)

		const intervalID = setInterval(async () => {
			let nearestMob: Entity | undefined


			if (config.autoAIM){
				nearestMob = bot.nearestEntity(entity => {
					if (
						entity.type !== "mob" &&
						(entity.type as any) !== 'animal' &&
						entity.type !== "hostile"
						|| entity.kind === "Drops"
						|| entity.kind === 'Vehicles'
					) return false;

					const viewDistance = 4;
					if (bot.entity.position.distanceTo(entity.position) > viewDistance) return false;

					return true
				});
			}

			let currentMob = bot.entityAtCursor();
			if (!currentMob) {
				if (config.autoAIM){
					if (nearestMob) {
						const pos = nearestMob.position
						await bot.lookAt(pos)
						currentMob = nearestMob
					} else {
						return  bot.swingArm('right')
					}
				} else {
					return  bot.swingArm('right')
				}
			} else {
				if (
					currentMob.type !== "mob" &&
					(currentMob.type as any) !== 'animal'
					&& currentMob.type !== "hostile"
					|| currentMob.kind === "Drops"
					|| currentMob.kind === 'Vehicles'
				) return bot.swingArm('right')
			}

			bot.attack(currentMob)
		}, interval);
		if (this.attackIntervals.get(id)) clearInterval(this.attackIntervals.get(id))

		this.attackIntervals.set(id, intervalID);
	}

	startUseItemClicker(id: string, interval: number): void {
		const bot = this.repository.getById(id)._bot;
		logger.info(`${id}: Запустил кликер использавание предмтов с интервалом ${interval}`)

		const intervalID = setInterval(async () => {
			const block = bot.blockAtCursor(4)
			if (block) await bot.activateBlock(block)
			bot.activateItem()
		}, interval);
		if (this.useIntervals.get(id)) clearInterval(this.useIntervals.get(id))

		this.useIntervals.set(id, intervalID);
	}

	stopAttackClicker(id: string): void {
		clearInterval(this.attackIntervals.get(id))
		this.attackIntervals.delete(id);
		logger.info(`${id}: Остановил кликер атаки`)
	}

	stopUseItemClicker(id: string): void {
		clearInterval(this.useIntervals.get(id))
		this.useIntervals.delete(id);
		logger.info(`${id}: Остановил кликер использавание предметов`)
	}

	attack(id: string): void {
		const bot = this.repository.getById(id)._bot;
		const entity = bot.entityAtCursor(4)
		if (!entity) return
		if (
			entity.type !==  "mob" &&
			entity.type !== "hostile" &&
			entity.type !== "player"
		) return;

		bot.attack(entity)
	}

	getAttackClickerStatus(id: string): toggleInfo {
		if (this.attackIntervals.has(id)) {
			return 'ON'
		} else {
			return 'OFF'
		}
	}

	getUseItemClickerStatus(id: string): toggleInfo {
		if (this.useIntervals.has(id)) {
			return 'ON'
		} else {
			return 'OFF'
		}
	}
}
export const clickerService = new ClickerService(botInRAMRepository)