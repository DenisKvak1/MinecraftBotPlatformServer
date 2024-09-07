import { ClientBotRepository } from '../../../core/repository/ClientBotRepository/clientBotRepository';
import { Observable, Subscribe } from '../../../../env/helpers/observable';
import { IAutoBuyService } from '../../../core/service/AutoBuy';
import { GeneralizedItem, toggle, toggleInfo } from '../../../../env/types';
import { Bot } from 'mineflayer';
import { abProfile, getProfileAutobuy } from './abConfig';
import { IClientBot } from '../../../core/service/ClientBot';
import { botInRAMRepository } from '../../database/repository/inRAMBotDateBase';
import { buyLogger, logger } from '../../logger/Logger';
import { ToGeneralizedItem, ToGeneralizedItems } from '../../../../env/helpers/ToGeneralizedItem';
import { syncTimeout } from '../../../../env/helpers/syncTimeout';
import { IChatService } from '../../../core/service/ChatService';
import { IWindowService } from '../../../core/service/WindowService';
import { windowsService } from '../WindowService';
import { chatService } from '../ChatService';
import { nodeIntervalToSubscribe } from '../../../../env/helpers/NodeTimeoutToSubscribe';
import { calculateAverage } from '../../../../env/helpers/СalculateAverage';


export class AutoBuyService implements IAutoBuyService {
	private abIntervals: Map<string, { interval: { id: NodeJS.Timeout, stop: () => void } }> = new Map();
	private idCounter: number = 1;
	private massAbIds: Record<string, {
		botsIds: string[],
		stopped: boolean,
		profilesAccounts: Record<string, IClientBot>,
		profiles: Record<string, abProfile>
		interval?: { id: NodeJS.Timeout, stop: () => void },
		subscribes: Record<string, Subscribe[]>
	}> = {};

	$ab = new Observable<{ id: string; action: toggle }>();

	constructor(
		private repository: ClientBotRepository,
		private chatService: IChatService,
		private windowService: IWindowService,
	) {
	}

	async startAutoBuySystem(botIds: string[]): Promise<string> {
		const massAutoBuyId = this.idCounter.toString()
		this.idCounter++;

		this.massAbIds[massAutoBuyId] = {
			botsIds: [],
			profiles: {},
			profilesAccounts: {},
			subscribes: {},
			stopped: false
		};

		const operations = botIds.map(async botId => {
			await this.addToAutoBuySystem(massAutoBuyId, botId)
		});
		await Promise.all(operations);

		const interval = this.startAsyncInterval(async () => {
			if (this.massAbIds[massAutoBuyId].stopped) return;
			const bots = this.massAbIds[massAutoBuyId].botsIds
			for (const id of bots) {
				if(!this.massAbIds[massAutoBuyId].botsIds.includes(id)) return

				const profile = this.massAbIds[massAutoBuyId].profiles[id];
				const profileAccount = this.massAbIds[massAutoBuyId].profilesAccounts[id]
				await this.updateAuction(profileAccount._bot, profile);
				setTimeout(() => {
					if(!this.massAbIds[massAutoBuyId].botsIds.includes(id)) return
					this.proccesBuyCycle(profileAccount._bot, profile, profileAccount);
				}, profile.interval);

				await syncTimeout(profile.interval / bots.length * 3 / 5);
			}
		}, 0);


		this.massAbIds[massAutoBuyId].interval = interval
		return massAutoBuyId
	}

	async stopAutoBuySystem(massId: string): Promise<void> {
		this.massAbIds[massId].botsIds.forEach((id)=>{
			this.clearSubscribes(this.massAbIds[massId].subscribes[id])
		})
		delete this.massAbIds[massId]
	}

	async addToAutoBuySystem(massId: string, botId: string){
		const { profile, profileAccount } = await this.massAutoBuyFirstInit(botId)
		const isOkInit = await this.autoBuyProccessInit(botId, profile, profileAccount);
		if (!isOkInit) return;
		const { sellSubscribe, buyLoggerSubscribe, updatePrice, $updatePrice, $stopSetPrice } = isOkInit;
		const subscribe1 = $updatePrice.subscribe(() => {
			this.massAbIds[massId].stopped = true;
		});
		const subscribe2 = $stopSetPrice.subscribe(async (newProfile) => {
			this.massAbIds[massId].profiles[botId] = newProfile;
			this.massAbIds[massId].profilesAccounts[botId]._bot.chat('/ah');
			await syncTimeout(600);
			if (profile.name === 'holyworld') await windowsService.click(botId, 53, 1);
			await syncTimeout(600);
			this.massAbIds[massId].stopped = false
		});

		this.massAbIds[massId].subscribes[botId] = [subscribe1, subscribe2, nodeIntervalToSubscribe(updatePrice), nodeIntervalToSubscribe(sellSubscribe), buyLoggerSubscribe]
		this.massAbIds[massId].botsIds.push(botId)
		this.massAbIds[massId].profiles[botId] = profile;
		this.massAbIds[massId].profilesAccounts[botId] = profileAccount;
		this.bindCloseAh(profileAccount, true, massId)
	}

	async deleteMassAutoBuyBot(massId: string, botId: string) {
		this.clearSubscribes(this.massAbIds[massId].subscribes[botId])
		this.massAbIds[massId].botsIds = this.massAbIds[massId].botsIds.filter((id)=> id !== botId)
		delete this.massAbIds[massId].profiles[botId]
		delete this.massAbIds[massId].profilesAccounts[botId]
		delete this.massAbIds[massId].subscribes[botId]
		await syncTimeout(2000)
		this.windowService.closeWindow(botId)
	}

	async startAutoBuy(id: string): Promise<void> {
		const profileAccount = this.repository.getById(id);
		let profile = getProfileAutobuy(profileAccount.accountModel.server);
		let isStopped = false;

		const isOkInit = await this.autoBuyProccessInit(id, profile, profileAccount);
		if (!isOkInit) return;
		const { sellSubscribe, buyLoggerSubscribe, updatePrice, $updatePrice, $stopSetPrice } = isOkInit;
		const bot = profileAccount._bot;

		profile =  await this.setBuyPrice(bot, profile)

		$updatePrice.subscribe(() => {
			isStopped = true;
		});
		$stopSetPrice.subscribe(async (newProfile) => {
			profile = newProfile;
			bot.chat('/ah');
			await syncTimeout(600);
			isStopped = false;
		});

		const interval = this.startAsyncInterval(async () => {
			if (isStopped) return;
			await this.updateAuction(bot, profile);
			await syncTimeout(profile.interval);
			await this.proccesBuyCycle(bot, profile, profileAccount);
		}, 0);

		this.bindCloseAh(profileAccount);
		this.setOnCloseSubscribe(id, interval, sellSubscribe, buyLoggerSubscribe, updatePrice);
	}

	private clearSubscribes(subscribes: Subscribe[]){
		subscribes.forEach((subsc)=> subsc.unsubscribe())
	}

	private async setBuyPrice(bot: Bot, profile: abProfile): Promise<abProfile> {
		const newProfile = { ...profile };

		for (const abKey in profile.info) {
			const abInfo = profile.info[abKey];

			if (!abInfo.searchName) continue;
			const priceData = await this.checkMinprice(abInfo?.searchName, bot, profile);
			if (!priceData) continue;
			newProfile.info[abKey].price = (priceData.averagePrice / 100) * (100 - abInfo?.procentDown || profile.defaultProcentDown);
			newProfile.info[abKey].sellprice = Math.floor(priceData.minPrice * 0.99);
			await syncTimeout(500);
		}

		return newProfile;
	}


	private async checkMinprice(name: string, bot: Bot, profile: abProfile) {
		bot.chat(`/ah search ${name}`);
		await syncTimeout(1000);

		let window = bot.currentWindow;
		if (!window) return;

		window = bot.currentWindow;
		if (!window) return;

		if (!window.slots[0]) return;
		const items = window.slots.slice(0, 44)
		const filterItems = items.filter((item)=> item !==null)
		const prices = filterItems.map((item)=> this.extractPrice(ToGeneralizedItem(item).customLoreHTML, profile.priceRegex) / item.count)
		const minPrices = [...prices].sort((a, b)=> a - b).slice(0, 3)

		const minPrice = Math.floor(minPrices[0])
		const averagePrice = Math.floor(calculateAverage(minPrices))


		return { averagePrice, minPrice };
	}

	private async massAutoBuyFirstInit(id: string){
		const profileAccount = this.repository.getById(id);
		let profile = getProfileAutobuy(profileAccount.accountModel.server);
		if (profile?.percentMode) profile = await this.setBuyPrice(profileAccount._bot, profile);

		await syncTimeout(500);
		profileAccount._bot.chat('/ah');
		await syncTimeout(500);

		if (profile.name === 'holyworld') {
			await windowsService.click(id, 53, 1);
		}
		return {profile, profileAccount}
	}

	private async autoBuyProccessInit(id: string, profile: abProfile, profileAccount: IClientBot): Promise<{
		sellSubscribe: NodeJS.Timeout,
		updatePrice: NodeJS.Timeout,
		buyLoggerSubscribe: Subscribe,
		$updatePrice: Observable<undefined>,
		$stopSetPrice: Observable<abProfile>
	} | undefined> {
		if (this.getAutoBuyState(id) === 'ON') return;

		const bot = profileAccount._bot;
		if (!bot) return;

		const $updatePrice = new Observable<undefined>();
		const $stopSetPrice = new Observable<abProfile>();
		let updatePrice;

		const sellSubscribe = setInterval(() => {
			this.inventorySell(bot, profile);
		}, 9000);

		if (profile.percentMode) {
			updatePrice = setInterval(async () => {
				$updatePrice.next();
				await syncTimeout(2000);
				const newProfile = await this.setBuyPrice(bot, profile);
				$stopSetPrice.next(newProfile);
			}, profile.reloadPriceInterval || 99 * 99 * 99 * 99 * 99 * 99 * 99 * 99);
		}

		const buyLoggerSubscribe = this.initBuyLogger(profileAccount);

		this.$ab.next({ id, action: 'START' });
		await syncTimeout(1000);
		if (!bot.currentWindow) return;

		return { sellSubscribe, buyLoggerSubscribe, updatePrice, $updatePrice, $stopSetPrice };
	}

	private async updateAuction(bot: Bot, profile: abProfile) {
		bot.clickWindow(profile.updateIndex, 0, 0);
	}

	private setOnCloseSubscribe(
		id: string,
		interval: {
			id: NodeJS.Timeout,
			stop: () => void
		}, sellSubscribe: NodeJS.Timeout, buyLoggerSubscribe: Subscribe, updatePriceSubscribe: NodeJS.Timeout) {

		const intervalSubscribe = this.getOnCloseSubscribe(interval, sellSubscribe, buyLoggerSubscribe, updatePriceSubscribe);
		this.abIntervals.set(id, { interval: intervalSubscribe });
	}


	private getOnCloseSubscribe(
		interval: {
			id: NodeJS.Timeout,
			stop: () => void
		}, sellSubscribe: NodeJS.Timeout, buyLoggerSubscribe: Subscribe, updatePriceSubscribe: NodeJS.Timeout,
	) {
		return {
			stop: () => {
				interval?.stop();
				clearInterval(sellSubscribe);
				clearInterval(updatePriceSubscribe);
				buyLoggerSubscribe?.unsubscribe();
			},
			id: interval.id,
		};
	}

	private async proccesBuyCycle(bot: Bot, profile: abProfile, profileAccount: IClientBot) {
		try {
			if (profile.name === 'holyworld' && profile.savingBalanceAccount) {
				const balance = this.getBotBalance(bot, profile.name);
				if (balance >= profile.targetBalance * 1.2) {
					this.sendMoneyOnSaveAccount(Math.floor(balance - profile.targetBalance), bot, profile);
				}
			}

			const searchInfo = this.searchItemToBuy(bot, profile);
			if (searchInfo) {
				const { slotIndex, targetItem } = searchInfo;

				if (profile.shift) {
					bot.clickWindow(slotIndex, 0, 1);
				} else {
					await this.buyClick(bot, slotIndex);
					await syncTimeout(200);

					this.saveBuy(bot, targetItem, profile);
					this.sellOnUpdate(bot, profileAccount, profile);
					this.bindReserveUndo(bot);
				}
			}
		} catch (e) {

		}
	}

	stopAutoBuy(id: string): void {
		const data = this.abIntervals.get(id);
		if (!data) return;
		data.interval.stop();
		this.abIntervals.delete(id);
		this.$ab.next({ id, action: 'STOP' });
	}

	getAutoBuyState(id: string): toggleInfo {
		const data = this.abIntervals.get(id);
		return data ? 'ON' : 'OFF';
	}


	private sendMoneyOnSaveAccount(money: number, bot: Bot, profile: abProfile) {
		bot.chat(`/pay ${profile.savingBalanceAccount} ${money}`);
		buyLogger.info(`Баланс ${profile.savingBalanceAccount} пополнен на ${money}`);
	}

	private getBotBalance(bot: Bot, name: string) {
		switch (name) {
			case 'holyworld': {
				return bot.scoreboard['1']['itemsMap']['§2'].displayName.extra[2].text.replaceAll(',', '');
			}
		}
		return undefined;
	}

	private async inventorySell(bot: Bot, profile: abProfile) {
		for (let index = 0; index < bot.inventory.slots.length; index++) {
			const sItem = bot.inventory.slots[index];
			if (!sItem) continue;

			const item = ToGeneralizedItem(sItem);
			const price = this.checkSellItem(profile, item, index);
			if (!price) continue;

			this.sellItem(bot, item, price, index);
			await new Promise(resolve => setTimeout(resolve, 800));
		}
	}

	private bindReserveUndo(bot: Bot) {
		setTimeout(() => {
			if (bot.currentWindow.slots[0]?.name === 'green_stained_glass_pane') {
				bot.clickWindow(8, 0, 0);
			}
		}, 2000);
	}

	private saveBuy(bot: Bot, targetItem: GeneralizedItem, profile: abProfile): void {
		const selectItem = ToGeneralizedItem(bot.currentWindow.slots[13]);
		const name = targetItem.customName || targetItem?.displayName;

		if (this.isItemCopies(selectItem, targetItem, profile)) {
			bot.clickWindow(0, 0, 0);
			logger.info(`Попытался купить предмет ${name} в количестве ${targetItem?.count}`);
		} else if(bot.currentWindow.slots[0]?.name === 'green_stained_glass_pane') {
			logger.warn(`Отклонил неправильно выбранный предмет ${name} в количестве ${targetItem?.count}`);
			bot.clickWindow(8, 0, 0);
		} else {
			logger.error(`Холик залагал ${name}`)
		}
	}

	private initBuyLogger(profileAccount: IClientBot) {
		return this.chatService.onChatMessage(profileAccount.accountModel.id, (msg) => {
			if (!msg.includes('▶ Вы успешно купили') && !msg.includes(' купил ')) return;
			buyLogger.info(`${profileAccount.accountModel.nickname}: ${msg}`);
		});
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

	private sellOnUpdate(bot: Bot, profileAccount: IClientBot, profile: abProfile) {
		profileAccount.$inventoryUpdate.once((inventory) => {
			if (!inventory.newItem) return;
			const price = this.checkSellItem(profile, inventory.newItem, inventory.itemSlot);
			if (!price) return;
			this.sellItem(bot, inventory.newItem, price, inventory.itemSlot);
		});
	}

	private checkSellItem(profile: abProfile, item: GeneralizedItem, index: number) {
		const name = item?.customName || item?.displayName;
		const price = profile.info[name]?.sellprice;
		const count = item?.count;
		if (item?.count !== item.stackSize && (item?.count < profile.info[name]?.seellcount || !profile.info[name]?.seellcount)) return;
		if (item.name !== item.name) return;
		if (!this.checkAutoBuy(name, profile)) return;
		if (!profile.info[name]?.sellprice) return;

		if ((index - 36) < 0 || (index - 36) > 9) return;
		return price * count;
	}

	private sellItem(bot: Bot, item: GeneralizedItem, price: number, slotIndex: number) {
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
		if (item.renamed) return false;
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

	private bindCloseAh(clientBot: IClientBot, mass?: boolean, massId?: string) {
		clientBot.$window.once((eventData) => {
			if (!this.massAbIds[massId].botsIds.includes(clientBot.accountModel.id)) return
			if(!mass) this.stopAutoBuy(clientBot.accountModel.id);
			else this.deleteMassAutoBuyBot(massId,clientBot.accountModel.id)
		}, (eventData) => eventData.action === 'CLOSE');

		clientBot.$disconnect.once((eventData) => {
			if(!mass) this.stopAutoBuy(clientBot.accountModel.id);
			else this.deleteMassAutoBuyBot(massId, clientBot.accountModel.id)
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

export const autoBuyService = new AutoBuyService(botInRAMRepository, chatService, windowsService);
