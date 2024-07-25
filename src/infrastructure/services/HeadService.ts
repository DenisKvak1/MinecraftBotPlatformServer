import { IHeadService } from '../../core/service/HeadService';
import { ClientBotRepository } from '../../core/repository/ClientBotRepository/clientBotRepository';
import { botInRAMRepository } from '../database/repository/inRAMBotDateBase';
import { Bot } from 'mineflayer';

export type HeadRotateDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

export class HeadService implements IHeadService {
	private interval = 90;
	private angle = 6;
	private upRotateInterval: Map<string, NodeJS.Timeout> = new Map();
	private downRotateInterval: Map<string, NodeJS.Timeout> = new Map();
	private rightRotateInterval: Map<string, NodeJS.Timeout> = new Map();
	private leftRotateInterval: Map<string, NodeJS.Timeout> = new Map();

	constructor(
		private repository: ClientBotRepository,
	) {
	}

	private rotate(bot: Bot, direction: HeadRotateDirection, angle: number): void {
		let yaw = bot.entity.yaw;
		let pitch = bot.entity.pitch;
		const angleInRadians = angle * Math.PI / 180;


		switch (direction) {
			case 'LEFT':
				yaw -= angleInRadians;
				break;
			case 'RIGHT':
				yaw += angleInRadians;
				break;
			case 'UP':
				pitch += angleInRadians;
				break;
			case 'DOWN':
				pitch -= angleInRadians;
				break;
		}
		bot.look(yaw, pitch, false);
	}

	private stopRotateDirection(id: string, direction: HeadRotateDirection): void {
		switch (direction) {
			case 'LEFT':
				const interval = this.leftRotateInterval.get(id);
				if (!interval) return;
				clearInterval(interval);
				this.leftRotateInterval.delete(id);
				break;
			case 'RIGHT':
				const interval2 = this.rightRotateInterval.get(id);
				if (!interval2) return;
				clearInterval(interval2);
				this.rightRotateInterval.delete(id);
				break;
			case 'UP':
				const interval3 = this.upRotateInterval.get(id);
				if (!interval3) return;
				clearInterval(interval3);
				this.upRotateInterval.delete(id);
				break;
			case 'DOWN':
				const interval4 = this.downRotateInterval.get(id);
				if (!interval4) return;
				clearInterval(interval4);
				this.downRotateInterval.delete(id);
				break;
		}
	}

	private startRotate(id: string, direction: HeadRotateDirection) {
		const bot = this.repository.getById(id)._bot
		return setInterval(() => {
			this.rotate(bot, direction, this.angle);
		}, 100);
	}

	startUpRotate(id: string): void {
		const interval = this.startRotate(id, 'UP');
		if (this.upRotateInterval.get(id)) clearInterval(this.upRotateInterval.get(id));

		this.upRotateInterval.set(id, interval);
	}

	startDownRotate(id: string): void {
		const interval = this.startRotate(id, 'DOWN');
		if (this.downRotateInterval.get(id)) clearInterval(this.downRotateInterval.get(id));

		this.downRotateInterval.set(id, interval);
	}

	startLeftRotate(id: string): void {
		const interval = this.startRotate(id, 'LEFT');
		if (this.leftRotateInterval.get(id)) clearInterval(this.leftRotateInterval.get(id));

		this.leftRotateInterval.set(id, interval);
	}

	startRightRotate(id: string): void {
		const interval = this.startRotate(id, 'RIGHT');
		if (this.rightRotateInterval.get(id)) clearInterval(this.rightRotateInterval.get(id));

		this.rightRotateInterval.set(id, interval);
	}

	stopRotateUp(id: string): void {
		this.stopRotateDirection(id, 'UP');
	}

	stopRotateDown(id: string): void {
		this.stopRotateDirection(id, 'DOWN');
	}

	stopRotateRight(id: string): void {
		this.stopRotateDirection(id, 'RIGHT');
	}

	stopRotateLeft(id: string): void {
		this.stopRotateDirection(id, 'LEFT');
	}

	stopRotate(id: string) {
		this.stopRotateDirection(id, 'UP');
		this.stopRotateDirection(id, 'DOWN');
		this.stopRotateDirection(id, 'RIGHT');
		this.stopRotateDirection(id, 'LEFT');
	}
}
export const headService = new HeadService(botInRAMRepository)