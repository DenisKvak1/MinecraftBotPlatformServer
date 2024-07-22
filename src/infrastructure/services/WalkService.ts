import { IWalkService } from '../../core/service/WalkService';
import { ClientBotRepository } from '../../core/repository/ClientBotRepository/clientBotRepository';
import { botInRAMRepository } from '../database/repository/inRAMBotDateBase';

const { GoalNear } = require('mineflayer-pathfinder').goals;
export type MovementDirection = 'BACK' | 'FORWARD' | 'LEFT' | 'RIGHT'

export class WalkService implements IWalkService {

	constructor(
		private repository: ClientBotRepository,
	) {
	}

	forwardStart(id: string): void {
		const bot = this.repository.getById(id)._bot;
		bot.setControlState('forward', true);
	}

	backwardStart(id: string): void {
		const bot = this.repository.getById(id)._bot;
		bot.setControlState('back', true);
	}

	leftStart(id: string): void {
		const bot = this.repository.getById(id)._bot;
		bot.setControlState('left', true);
	}

	rightStart(id: string): void {
		const bot = this.repository.getById(id)._bot;
		bot.setControlState('right', true);
	}

	forwardStop(id: string): void {
		const bot = this.repository.getById(id)._bot;
		bot.setControlState('forward', false);
	}

	backwardStop(id: string): void {
		const bot = this.repository.getById(id)._bot;
		bot.setControlState('back', false);
	}

	leftStop(id: string): void {
		const bot = this.repository.getById(id)._bot;
		bot.setControlState('left', false);
	}

	rightStop(id: string): void {
		const bot = this.repository.getById(id)._bot;
		bot.setControlState('right', false);
	}

	stopMovement(id: string): void {
		const bot = this.repository.getById(id)._bot;
		bot.clearControlStates();
	}

	jump(id: string): Promise<void> {
		return new Promise((resolve) => {
			const bot = this.repository.getById(id)._bot;
			bot.setControlState('jump', true);

			setTimeout(() => {
				bot.setControlState('jump', false);
				resolve();
			}, 500);
		});
	}

	goto(id: string, x: number, y: number, z: number): void {
		const bot = this.repository.getById(id)._bot;
		const goal = new GoalNear(x, y, z, 1);
		bot.pathfinder.setGoal(goal);
	}
}
export const walkService = new WalkService(botInRAMRepository);