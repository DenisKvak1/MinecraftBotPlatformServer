import { ClientBotRepository } from '../../../core/repository/ClientBotRepository/clientBotRepository';
import { Observable } from '../../../../env/helpers/observable';
import { IAutoBuyService } from '../../../core/service/AutoBuy';
import { GeneralizedItem, toggle, toggleInfo } from '../../../../env/types';
import { Bot } from 'mineflayer';
import { abProfile, getProfileAutobuy } from './abConfig';
import { IClientBot } from '../../../core/service/ClientBot';
import { botInRAMRepository } from '../../database/repository/inRAMBotDateBase';
import { logger } from '../../logger/Logger';
import { ToGeneralizedItem, ToGeneralizedItems } from '../../../../env/helpers/ToGeneralizedItem';
import { getRandomInRange } from '../../../../env/helpers/randomGenerator';
import { PromiseTimeout } from '../../../../env/helpers/promiseTimeout';


export class AutoBuyService implements IAutoBuyService {
	private abIntervals: Map<string, { interval: { id: NodeJS.Timeout, stop: () => void } }> = new Map();
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

		this.$ab.next({ id, action: 'START' });
		await PromiseTimeout(1000)
		if (!bot.currentWindow) return;
		const interval = this.startAsyncInterval(async () => {
			try {
				bot.clickWindow(profile.updateIndex, 0, 0);
				await PromiseTimeout(profile.interval + getRandomInRange(-40, 100))

				setTimeout(()=> this.inventorySell(bot, profile), 500)
				const searchInfo = this.searchItemToBuy(bot, profile);
				if (!searchInfo) return;
				const { slotIndex, targetItem } = searchInfo;

				if (profile.shift) {
					bot.clickWindow(slotIndex, 0, 1);
				} else {
					await this.buyClick(bot, slotIndex);
					await PromiseTimeout(250)

					this.checkErrorSelectItem(bot, targetItem, profile);
					this.sellOnUpdate(bot, profileAccount, profile, targetItem);
					this.bindReserveUndo(bot);
				}
			} catch (e) {

			}
		}, 0);
		this.abIntervals.set(id, { interval });
		this.bindCloseAh(profileAccount);
	}

	stopAutoBuy(id: string): void {
		const data = this.abIntervals.get(id);
		if(!data) return
		data.interval.stop();
		this.abIntervals.delete(id);
		this.$ab.next({ id, action: 'STOP' });
	}

	getAutoBuyState(id: string): toggleInfo {
		const data = this.abIntervals.get(id);
		return data ? 'ON' : 'OFF';
	}


	private inventorySell(bot: Bot, profile: abProfile){
		bot.inventory.slots.forEach((sItem, index)=>{
			if(!sItem) return;
			const item = ToGeneralizedItem(sItem)
			const price = this.checkSellItem(profile, item, index)
			if(!price) return
			this.sellItem(bot, item, price, index)
		})
	}

	private bindReserveUndo(bot: Bot) {
		setTimeout(() => {
			if (bot.currentWindow.slots[0]?.name === 'green_stained_glass_pane') {
				bot.clickWindow(8, 0, 0);
			}
		}, 2000);
	}

	private checkErrorSelectItem(bot: Bot, targetItem: GeneralizedItem, profile: abProfile): void {
		const selectItem = ToGeneralizedItem(bot.currentWindow.slots[13]);
		const name = targetItem.customName || targetItem?.displayName;

		if (this.isItemCopies(selectItem, targetItem, profile)) {
			bot.clickWindow(0, 0, 0);
			logger.info(`Попытался купить предмет ${name} в количестве ${targetItem?.count}`);
		} else {
			if (bot.currentWindow.slots[0]?.name !== 'green_stained_glass_pane') return;
			logger.warn(`Отклонил неправильно выбранный предмет ${name} в количестве ${targetItem?.count}`);
			bot.clickWindow(8, 0, 0);
		}
	}

	private searchItemToBuy(bot: Bot, profile: abProfile) {
		let slotIndex: number;
		let targetItem: GeneralizedItem;
		ToGeneralizedItems(bot.currentWindow.slots).forEach((item, index) => {
			if (index > 53) return;
			const valid = this.onNewItem(profile, item);
			if (valid) {
				targetItem = item;
				slotIndex = index;
			}
		});
		if (!slotIndex && slotIndex !== 0) return;

		return { slotIndex, targetItem };
	}

	private sellOnUpdate(bot: Bot, profileAccount: IClientBot, profile: abProfile, targetItem: GeneralizedItem) {
		profileAccount.$inventoryUpdate.once((inventory) => {
			if(!inventory.newItem) return;
			const price = this.checkSellItem(profile, inventory.newItem, inventory.itemSlot)
			if(!price) return
			this.sellItem(bot, inventory.newItem, price, inventory.itemSlot)
		});
	}

	private checkSellItem(profile:abProfile, item: GeneralizedItem, index: number){
		const name = item?.customName || item?.displayName;
		const price = profile.info[name]?.sellprice;
		const count = item?.count;
		if (item?.count !== item.stackSize && (item?.count < profile.info[name]?.seellcount || !profile.info[name]?.seellcount)) return;
		if (item.name !== item.name) return
		if (!this.checkAutoBuy(name, profile)) return
		if (!profile.info[name]?.sellprice) return

		if ((index - 36) < 0 || (index - 36) > 9) return
		return price * count
	}

	private sellItem(bot:Bot, item: GeneralizedItem, price: number, slotIndex: number){
		const name = item?.customName || item?.displayName;
		bot.setQuickBarSlot(slotIndex - 36);
		bot.chat(`/ah sell ${price}`);
		logger.info(`Попытался выставить предмет ${name} на продаже в количестве ${item.count} по цене за штуку ${price}`);
	}

	private startAsyncInterval(callback: () => Promise<void>, interval: number): {
		id: NodeJS.Timeout,
		stop: () => void
	} {
		let timeoutId: NodeJS.Timeout;
		let stop = false;

		async function executeCallback() {
			if (stop) return;
			await callback();
			timeoutId = setTimeout(executeCallback, interval);
		}

		executeCallback();

		return {
			id: timeoutId,
			stop: () => {
				stop = true;
				clearTimeout(timeoutId);
			},
		};
	}


	private onNewItem(profile: abProfile, item: GeneralizedItem | null) {
		if (!item) return false;
		if (item.renamed) return false
		if (!this.checkAutoBuy(item.customName || item.displayName, profile)) return false;
		const price = this.extractPrice(item?.customLoreHTML, profile.priceRegex);
		if ((price / item?.count) > profile.info[item?.customName || item?.displayName]?.price) return false;

		const name = item?.customName || item?.displayName;
		logger.info(`Нашел предмет для покупки с именем ${name} в количестве ${item?.count} при цене за штуку: ${price}`);
		return true;
	}

	private checkAutoBuy(name: string, profile: abProfile) {
		for (const item in profile.info) {
			if (item === name) return true;
		}
		return false;
	}

	private bindCloseAh(clientBot: IClientBot) {
		clientBot.$window.once((eventData) => {
			this.stopAutoBuy(clientBot.accountModel.id);
		}, (eventData) => eventData.action === 'CLOSE');

		clientBot.$disconnect.once((eventData) => {
			this.stopAutoBuy(clientBot.accountModel.id);
		});
	}

	private isItemCopies(selectItem: GeneralizedItem, targetItem: GeneralizedItem, profile: abProfile) {
		const selectitemName = selectItem?.customName || selectItem?.displayName;
		const selectitemPrice = this.extractPrice(selectItem?.customLoreHTML, profile.priceRegex);
		const targetName = targetItem?.customName || targetItem?.displayName;
		const targetPrice = this.extractPrice(targetItem?.customLoreHTML, profile.priceRegex);

		return selectitemName === targetName && selectitemPrice === targetPrice;
	}

	private extractPrice(text: string, priceRegex: string): number | null {
		if (!text) return 9999999999;
		const regExp = new RegExp(priceRegex);
		const match = text.match(regExp);
		const price = match ? match[1].replace(/\s/g, '') : null;

		return +price;
	}

	private async buyClick(bot: Bot, slotIndex: number) {
		await bot.clickWindow(slotIndex, 0, 0);
	}
}

export const autoBuyService = new AutoBuyService(botInRAMRepository);
