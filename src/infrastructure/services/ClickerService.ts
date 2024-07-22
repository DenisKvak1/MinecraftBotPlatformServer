import { IClickerService } from '../../core/service/ClickerService';
import { ClientBotRepository } from '../../core/repository/ClientBotRepository/clientBotRepository';
import { botInRAMRepository } from '../database/repository/inRAMBotDateBase';
import { Vec3 } from 'vec3';
import { clearInterval } from 'node:timers';
export class ClickerService implements IClickerService {
	private attackIntervals: Map<string, NodeJS.Timeout> = new Map();
	private useIntervals: Map<string, NodeJS.Timeout> = new Map();

	constructor(
		private repository: ClientBotRepository,
	) {
	}

	startAttackClicker(id: string, interval: number): void {
		const bot = this.repository.getById(id)._bot;
		const intervalID = setInterval(async () => {
			const nearestMob = bot.nearestEntity(entity => {
				if (entity.type !== "mob" && entity.type !== "hostile" || entity.kind === "Immobile" || entity.kind === "Drops" || entity.kind === 'Vehicles') return false;

				const viewDistance = 4;
				if (bot.entity.position.distanceTo(entity.position) > viewDistance) return false;

				return true
			});

			let currentMob = bot.entityAtCursor();
			if (!currentMob) {
				if (nearestMob) {
					const pos = nearestMob.position
					await bot.lookAt(pos)
					currentMob = nearestMob
				} else {
					return
				}
			} else {
				if (currentMob.type !== "mob" && currentMob.type !== "hostile" || currentMob.kind === "Immobile" || currentMob.kind === "Drops" || currentMob.kind === 'Vehicles') return
			}
			bot.attack(currentMob)
		}, interval);
		if (this.attackIntervals.get(id)) clearInterval(this.attackIntervals.get(id))

		this.attackIntervals.set(id, intervalID);
	}

	startUseItemClicker(id: string, interval: number): void {
		const bot = this.repository.getById(id)._bot;
		const intervalID = setInterval(() => {
			const block = bot.blockAtCursor(4)
			if (block) bot.activateBlock(block)
			bot.activateItem()
		}, interval);
		if (this.useIntervals.get(id)) clearInterval(this.useIntervals.get(id))

		this.useIntervals.set(id, intervalID);
	}

	stopAttackClicker(id: string): void {
		clearInterval(this.attackIntervals.get(id))
		this.attackIntervals.delete(id);
	}

	stopUseItemClicker(id: string): void {
		clearInterval(this.useIntervals.get(id))
		this.useIntervals.delete(id);
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
}
export const clickerService = new ClickerService(botInRAMRepository)