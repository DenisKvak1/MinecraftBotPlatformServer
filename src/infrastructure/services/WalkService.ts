import { IWalkService } from '../../core/service/WalkService';
import { ClientBotRepository } from '../../core/repository/ClientBotRepository/clientBotRepository';
import { botInRAMRepository } from '../database/repository/inRAMBotDateBase';
import { logger } from '../logger/Logger';

const { GoalNear } = require('mineflayer-pathfinder').goals;

export type MovementDirection = 'BACK' | 'FORWARD' | 'LEFT' | 'RIGHT'

export class WalkService implements IWalkService {
	constructor(
		private repository: ClientBotRepository,
	) {}

	forwardStart(id: string): void {
		const bot = this.repository.getById(id)._bot;
		bot.setControlState('forward', true);
		logger.info(`${id}: Запустил ходьбу вперед`);
	}

	backwardStart(id: string): void {
		const bot = this.repository.getById(id)._bot;
		bot.setControlState('back', true);
		logger.info(`${id}: Запустил ходьбу назад`);
	}

	leftStart(id: string): void {
		const bot = this.repository.getById(id)._bot;
		bot.setControlState('left', true);
		logger.info(`${id}: Запустил ходьбу влево`);
	}

	rightStart(id: string): void {
		const bot = this.repository.getById(id)._bot;
		bot.setControlState('right', true);
		logger.info(`${id}: Запустил ходьбу вправо`);
	}

	forwardStop(id: string): void {
		const bot = this.repository.getById(id)._bot;
		bot.setControlState('forward', false);
		logger.info(`${id}: Остановил ходьбу вперед`);
	}

	backwardStop(id: string): void {
		const bot = this.repository.getById(id)._bot;
		bot.setControlState('back', false);
		logger.info(`${id}: Остановил ходьбу назад`);
	}

	leftStop(id: string): void {
		const bot = this.repository.getById(id)._bot;
		bot.setControlState('left', false);
		logger.info(`${id}: Остановил ходьбу влево`);
	}

	rightStop(id: string): void {
		const bot = this.repository.getById(id)._bot;
		bot.setControlState('right', false);
		logger.info(`${id}: Остановил ходьбу вправо`);
	}

	stopMovement(id: string): void {
		const bot = this.repository.getById(id)._bot;
		bot.clearControlStates();
		logger.info(`${id}: Остановил все движения`);
	}

	jump(id: string): Promise<void> {
		return new Promise((resolve) => {
			const bot = this.repository.getById(id)._bot;
			bot.setControlState('jump', true);
			logger.info(`${id}: Начал прыжок`);

			setTimeout(() => {
				bot.setControlState('jump', false);
				logger.info(`${id}: Завершил прыжок`);
				resolve();
			}, 500);
		});
	}

	goto(id: string, x: number, y: number, z: number): void {
		const bot = this.repository.getById(id)._bot;
		const goal = new GoalNear(x, y, z, 1);
		bot.pathfinder.setGoal(goal);
		logger.info(`${id}: Идет к точке (${x}, ${y}, ${z})`);
	}
}

export const walkService = new WalkService(botInRAMRepository);
