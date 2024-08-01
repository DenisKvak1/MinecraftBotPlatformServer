import { IAutoBuyService } from '../../core/service/AutoBuy';
import { Observable, Subscribe } from '../../../env/helpers/observable';
import { GeneralizedItem, toggle, toggleInfo } from '../../../env/types';
import { ClientBotRepository } from '../../core/repository/ClientBotRepository/clientBotRepository';
import { abProfile, getProfileAutobuy } from '../autobutConfig/abConfig';
import { botInRAMRepository } from '../database/repository/inRAMBotDateBase';
import { ToGeneralizedItem } from '../../../env/helpers/ToGeneralizedItem';
import { Bot } from 'mineflayer';

export class AutoBuyService implements IAutoBuyService {
	private abIntervals: Map<string, { interval: NodeJS.Timeout, subscribe: Subscribe }> = new Map();
	$ab = new Observable<{ id: string; action: toggle }>();

	constructor(
		private repository: ClientBotRepository,
	) {
	}

	async startAutoBuy(id: string): Promise<void> {
		if (this.getAutoBuyState(id) === 'ON') return;
		const profileAccount = this.repository.getById(id);
		const bot = profileAccount._bot;
		const profile = getProfileAutobuy(profileAccount.accountModel.server);
		let pause = false;

		if (!profile) return;

		this.$ab.next({ id, action: 'START' });
		bot.chat('/ah');
		await new Promise<void>((r) => setTimeout(() => {
			r();
		}, 1000));
		if (!bot.currentWindow) return;

		///// ДЛЯ ЗОЛИКА ПОКА НЕ ПОФИКСИТЬ
		if (profile.name === 'holyworld') {
			bot.clickWindow(53, 1, 0);
		}
		///// ДЛЯ ЗОЛИКА ПОКА НЕ ПОФИКСИТЬ

		const subscribe = profileAccount.$window.subscribe(async (window) => {
			if (pause) return;
			if (window.action === 'CLOSE') return;
			let slotIndex: number;
			let targetItem: GeneralizedItem;

			if (window.action === 'UPDATE') {
				const valid = this.onNewItem(profile, window.newItem);
				if (valid) {
					targetItem = window.newItem;
					slotIndex = window.slotIndex;
				}
			}
			if (window.action === 'OPEN') {
				window.items.forEach((item, index) => {
					const valid = this.onNewItem(profile, item);
					if (valid) {
						targetItem = item;
						slotIndex = index;
					}
				});
			}
			if (!slotIndex && slotIndex !== 0) return;

			pause = true;
			if (profile.shift) {
				bot.clickWindow(slotIndex, 0, 1);
			} else {
				await this.buyClick(bot, slotIndex);
				await new Promise<void>((r) => setTimeout(() => r(), 300));
				const selectItem = ToGeneralizedItem(bot.currentWindow.slots[13]);

				if (this.isItemCopies(selectItem, targetItem, profile)) {
					bot.clickWindow(0, 0, 0);
					console.log('Купил', targetItem.customName || targetItem?.displayName, targetItem.count);
				} else {
					if (bot.currentWindow.slots[0]?.name === 'green_stained_glass_pane') {
						console.log('Отклонил', targetItem?.displayName || targetItem.customName, targetItem.count);
						bot.clickWindow(8, 0, 0);
					}
				}

				profileAccount.$inventoryUpdate.once((inventory) => {
					if (inventory.newItem.count !== inventory.newItem.stackSize) return;
					if (inventory.newItem.name !== targetItem.name) return;
					const name = inventory.newItem.customName || inventory.newItem.displayName;
					if (!this.checkAutoBuy(name, profile)) return;
					if (!profile.info[name]?.sellprice) return;

					if ((inventory.itemSlot - 36) < 0 || (inventory.itemSlot - 36) > 9) return;
					bot.setQuickBarSlot(inventory.itemSlot - 36);
					bot.chat(`/ah sell ${profile.info[name].sellprice * inventory.newItem.count}`);
				});

				setTimeout(() => {
					if (bot.currentWindow.slots[0]?.name === 'green_stained_glass_pane') {
						bot.clickWindow(8, 0, 0);
					}
				}, 2000);
			}
			pause = false;
		});
		const interval = setInterval(async () => {
			if (pause) return;
			try {
				bot.clickWindow(profile.updateIndex, 0, 0);
			} catch (e) {

			}
		}, profile.interval);
		this.abIntervals.set(id, { interval, subscribe });
	}

	stopAutoBuy(id: string): void {
		const bot = this.repository.getById(id)._bot;
		if (bot.currentWindow) bot.closeWindow(bot.currentWindow);
		const data = this.abIntervals.get(id);
		clearInterval(data.interval);
		data.subscribe.unsubscribe();
		this.abIntervals.delete(id);
		this.$ab.next({ id, action: 'STOP' });
	}

	getAutoBuyState(id: string): toggleInfo {
		const data = this.abIntervals.get(id);
		return data ? 'ON' : 'OFF';
	}

	private onNewItem(profile: abProfile, item: GeneralizedItem | null) {
		if (!item) return false;
		if (!this.checkAutoBuy(item.customName || item.displayName, profile)) return;
		const price = this.extractPrice(item?.customLoreHTML, profile.priceRegex);
		if ((price / item.count) > profile.info[item?.customName || item?.displayName]?.price) return false;

		console.log('Предмет подходящий', item?.customName || item?.displayName, item.count, price);
		return true;
	}

	private checkAutoBuy(name: string, profile: abProfile) {
		for (const item in profile.info) {
			if (item === name) return true;
		}
		return false;
	}

	private isItemCopies(selectItem: GeneralizedItem, targetItem: GeneralizedItem, profile: abProfile) {
		const selectitemName = selectItem?.customName || selectItem?.displayName;
		const selectitemPrice = this.extractPrice(selectItem?.customLoreHTML, profile.priceRegex);
		const targetName = targetItem?.customName || targetItem?.displayName;
		const targetPrice = this.extractPrice(targetItem?.customLoreHTML, profile.priceRegex);

		return selectitemName === targetName && selectitemPrice === targetPrice;
	}

	private extractPrice(text: string, priceRegex: RegExp): number | null {
		if (!text) return 9999999999;
		const match = text.match(priceRegex);
		const price = match ? match[1].replace(/\s/g, '') : null;

		return +price;
	}

	private async buyClick(bot: Bot, slotIndex: number) {
		if (bot.currentWindow.title.startsWith('{"extra":[{"color":"black","text":"Аукцион "}')) {
			await bot.clickWindow(slotIndex, 0, 0);
			await new Promise<void>((r) => setTimeout(() => r(), 100)); // БЫЛО 100
			return await this.buyClick(bot, slotIndex);
		} else {
			return;
		}
	}
}

export const autoBuyService = new AutoBuyService(botInRAMRepository);
