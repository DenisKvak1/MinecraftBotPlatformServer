import { IWindowService } from '../../core/service/WindowService';
import { ClientBotRepository } from '../../core/repository/ClientBotRepository/clientBotRepository';
import { Item } from 'prismarine-item';
import { Subscribe } from '../../../env/helpers/observable';
import { botInRAMRepository } from '../database/repository/inRAMBotDateBase';
import EventEmitter from 'node:events';
import { Window } from 'prismarine-windows';

export class WindowService implements IWindowService {
	constructor(
		private repository: ClientBotRepository,
	) {}

	onCloseWindow(id: string, callback: ()=> void): Subscribe {
		return this.repository.getById(id)?.$closeWindow.subscribe(()=>{
			callback()
		})
	}

	onOpenWindow(id: string, callback: (slots: (Item | null)[]) => void): Subscribe {
		return this.repository.getById(id)?.$openWindow.subscribe((window)=>{
			callback(window)
		})
	}

	async click(id: string, slot: number): Promise<void> {
		const bot = this.repository.getById(id)._bot
		await bot.clickWindow(slot, 0, 0)
	}

	getCurrentWindow(id: string): Window {
		const bot = this.repository.getById(id)._bot
		return bot.currentWindow
	}
}
export const windowsService = new WindowService(botInRAMRepository)