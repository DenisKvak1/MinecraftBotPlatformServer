import { IWindowService } from '../../core/service/WindowService';
import { ClientBotRepository } from '../../core/repository/ClientBotRepository/clientBotRepository';
import { Subscribe } from '../../../env/helpers/observable';
import { botInRAMRepository } from '../database/repository/inRAMBotDateBase';
import EventEmitter from 'node:events';
import { Window } from 'prismarine-windows';
import { GeneralizedItem } from '../../../env/types';
import { logger } from '../logger/Logger';
import { WindowEvent } from '../../core/service/ClientBot';

export class WindowService implements IWindowService {
	constructor(
		private repository: ClientBotRepository,
	) {}

	onWindowEvent(id: string, callback: (windowEvent: WindowEvent) => void): Subscribe {
		return this.repository.getById(id)?.$window.subscribe((windowEvent)=>{
			callback(windowEvent)
		})
	}

	async click(id: string, slot: number): Promise<void> {
		const bot = this.repository.getById(id)._bot
		await bot.clickWindow(slot, 0, 0)
		logger.info(`${id}: Кликнул в окне по слоту с индексом ${slot}`)
	}

	getCurrentWindow(id: string): Window | null{
		const bot = this.repository.getById(id)._bot
		return bot.currentWindow
	}
}
export const windowsService = new WindowService(botInRAMRepository)