import { ClientBotRepository } from '../../../core/repository/ClientBotRepository/clientBotRepository';
import { IObservable, Observable, Subscribe } from '../../../../env/helpers/observable';
import { IAutoBuyService } from '../../../core/service/AutoBuy';
import { GeneralizedItem, toggle, toggleInfo } from '../../../../env/types';
import { Bot, Player } from 'mineflayer';
import { abItemCfg, abProfile, getProfileAutobuy } from './abConfig';
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
import { reportTranspileErrors } from 'ts-loader/dist/instances';
import { profile } from 'winston';
import { unsubscribe } from 'node:diagnostics_channel';
import { getRandomInRange } from '../../../../env/helpers/randomGenerator';
import { Window } from 'prismarine-windows';
import { Item } from 'prismarine-item';
import { runAsync } from '../../../../env/helpers/runAsync';

export class AutoBuyService implements IAutoBuyService {
	private idCounter: number = 1;
	private massAbIds: Record<string, {
		botsIds: string[],
		stopped: Record<string, boolean>,
		profilesAccounts: Record<string, IClientBot>,
		profile: abProfile
		subscribesBot: Record<string, Subscribe[]>,
		state: Record<string, {
			itemForSale: number
		}>
		botFlags: Record<string, {
			isNeedResellItems: boolean,
			stopped: boolean
		}>,
		flags: {
			isNeedCalibration: boolean
		},
		subscribes: Subscribe[]
	}> = {};

	$ab = new Observable<{ id: string; action: toggle }>();

	constructor(
		private repository: ClientBotRepository,
		private chatService: IChatService,
		private windowService: IWindowService,
	) {
	}

	async startAutoBuySystem(botIds: string[]): Promise<number> {
		if (botIds.length < 0) throw new Error('BotsIds length is 0');
		const massId = this.idCounter;
		this.idCounter++;

		this.massAbIds[massId] = {
			botsIds: [],
			profile: null,
			profilesAccounts: {},
			subscribesBot: {},
			stopped: {},
			botFlags: {},
			flags: {
				isNeedCalibration: false,
			},
			state: {},
			subscribes: [],
		};

		let updatePrice: NodeJS.Timeout;
		const profile = getProfileAutobuy(this.repository.getById(botIds[0]).accountModel.server);
		if (profile.percentMode && profile.callibrationPriceInterval) {
			updatePrice = setInterval(async () => {
				this.massAbIds[massId].flags.isNeedCalibration = true;
			}, profile.callibrationPriceInterval);
		}
		this.massAbIds[massId].subscribes.push(nodeIntervalToSubscribe(updatePrice));

		const operations = botIds.map(async botId => {
			await this.addToAutoBuySystem(massId, botId);
		});
		await Promise.all(operations);

		const interval = this.startAsyncInterval(async () => {
			const bots = this.massAbIds[massId].botsIds;
			for (const botId of bots) {
				if (this.massAbIds[massId].botFlags[botId].stopped) continue;
				if (!this.massAbIds[massId].botsIds.includes(botId)) return;
				const profile = this.massAbIds[massId].profile;
				const profileAccount = this.massAbIds[massId].profilesAccounts[botId];
				const bot = profileAccount._bot;
				const itemForSale = this.massAbIds[massId].state[botId].itemForSale;
				const isSellUnderLimit = itemForSale >= profile.itemForSaleLimit;
				const deltaForSale = profile.itemForSaleLimit - itemForSale;

				this.updateAuction(profileAccount, profile);
				this.onAuctionWindowUpdate(profileAccount).then(async () => {
					if (!this.massAbIds[massId].botsIds.includes(botId)) return;
					if (this.massAbIds[massId].botFlags[botId].stopped) return;
					await this.proccesBuyCycle(profileAccount._bot, profile, profileAccount);
				});

				const countItemToSell = this.isNeedInventorySell(bot, profile);
				if ((countItemToSell >= 2 || (countItemToSell > 0 && deltaForSale < 2)) && !isSellUnderLimit) {
					this.massAbIds[massId].botFlags[botId].stopped = true;
					runAsync(async () => {
						await syncTimeout(1000);
						await this.sellInventory(bot, profile, profile.itemForSaleLimit - itemForSale);
						await this.openAuction(bot);
						this.massAbIds[massId].botFlags[botId].stopped = false;
					});
				}
				if (this.massAbIds[massId].botFlags[botId].isNeedResellItems) {
					this.massAbIds[massId].botFlags[botId].stopped = true;
					runAsync(async () => {
						await syncTimeout(1000);
						await this.resellItems(bot, profile);
						await this.openAuction(profileAccount._bot);
						this.massAbIds[massId].botFlags[botId].isNeedResellItems = false;
						this.massAbIds[massId].botFlags[botId].stopped = false;
					});
				}
				if (this.massAbIds[massId].flags.isNeedCalibration && this.massAbIds[massId].botsIds[0] === botId) {
					this.massAbIds[massId].botFlags[botId].stopped = true;
					runAsync(async () => {
						await syncTimeout(1000);
						const newProfile = await this.callicalibrationPriceProfile(bot, profile);
						const oldProfile = this.massAbIds[massId].profile;
						this.massAbIds[massId].profile = this.smoothNewProfile(oldProfile, newProfile, { max: 1.55, min: 0.5 });
						await this.openAuction(this.massAbIds[massId].profilesAccounts[botId]._bot);
						await syncTimeout(600);
						if (profile.name === 'holyworld') await windowsService.click(botId, 53, 1);
						await syncTimeout(600);
						this.massAbIds[massId].flags.isNeedCalibration = false;
						this.massAbIds[massId].botFlags[botId].stopped = false;
					});
				}

				await syncTimeout((profile.interval / (bots.length * 4 / 5)));
			}
		}, 0);
		this.massAbIds[massId].subscribes.push(interval);
		return massId;
	}

	async stopAutoBuySystem(massId: number): Promise<void> {
		this.massAbIds[massId].botsIds.forEach((id) => {
			this.clearSubscribes(this.massAbIds[massId].subscribesBot[id]);
		});
		this.clearSubscribes(this.massAbIds[massId].subscribes);
		delete this.massAbIds[massId];
	}

	async addToAutoBuySystem(massId: number, botId: string) {
		this.$ab.next({ id: botId, action: 'START' });

		if (this.getAutoBuyState(botId) === 'ON') {
			this.$ab.next({ id: botId, action: 'STOP' });
			this.massAbIds[massId].botsIds.filter((id) => id !== botId);
			return;
		}

		this.massAbIds[massId].botFlags[botId] = {
			stopped: true,
			isNeedResellItems: false,
		};

		const profileAccount = this.repository.getById(botId);
		let profile = this.massAbIds[massId].profile ?? await this.startCallibration(profileAccount);

		this.bindCloseAh(profileAccount, massId);

		const initSubscribes = await this.autoBuyProccessInit(massId, botId, profile, profileAccount);
		this.massAbIds[massId].botsIds.push(botId);
		if (!this.massAbIds[massId].profile) {
			this.massAbIds[massId].profile = profile;
		}
		this.massAbIds[massId].profilesAccounts[botId] = profileAccount;
		this.massAbIds[massId].state[botId] = { itemForSale: await this.countItemForSale(profileAccount._bot, profile.name) };
		this.massAbIds[massId].subscribesBot[botId] = [...initSubscribes];

		await syncTimeout(1000);
		await this.openAuction(profileAccount._bot);
		this.massAbIds[massId].botFlags[botId].stopped = false;
	}

	async deleteMassAutoBuyBot(massId: number, botId: string) {
		if (!this.massAbIds[massId]?.botsIds.includes(botId)) return;
		this.clearSubscribes(this.massAbIds[massId].subscribesBot[botId]);
		this.massAbIds[massId].botsIds = this.massAbIds[massId].botsIds.filter((id) => id !== botId);
		delete this.massAbIds[massId].profilesAccounts[botId];
		delete this.massAbIds[massId].subscribesBot[botId];
		await syncTimeout(1000);
		this.windowService.closeWindow(botId);
		this.$ab.next({ id: botId, action: 'STOP' });
	}

	private clearSubscribes(subscribes: Subscribe[]) {
		subscribes.forEach((subsc) => subsc.unsubscribe());
	}

	private async callicalibrationPriceProfile(bot: Bot, profile: abProfile): Promise<abProfile> {
		buyLogger.info('Калибровка запущенна');
		const newProfile = JSON.parse(JSON.stringify(profile));

		for (const abKey in profile.info) {
			const abInfo = profile.info[abKey];

			if (!abInfo.searchName) continue;

			bot.chat(`/ah search ${abInfo.searchName}`);
			await syncTimeout(1000);

			if (!this.checkRepresentativenessOfCalibrationSample(bot, abInfo.minCountToCalibrate)) continue;
			const priceData = await this.checkMinprice(bot, profile);
			if (!priceData) continue;
			const newPrice = (priceData.averagePrice / 100) * (100 - (abInfo?.percentDown || profile.defaultpercentDown));
			const oldPrice = newProfile.info[abKey].price;

			newProfile.info[abKey].price = Math.floor(newPrice);
			newProfile.info[abKey].sellPrice = Math.floor(priceData.minPrice * 0.99);

			await syncTimeout(600);
		}

		buyLogger.info('Калибровка законченна');
		return newProfile;
	}

	private checkRepresentativenessOfCalibrationSample(bot: Bot, minValue?: number): boolean {
		let window = bot.currentWindow;
		if (!window) return;

		if (!window.slots[0]) return;
		const items = window.slots.slice(0, 44);
		const filterItems = items.filter((item) => item !== null);
		return filterItems.length > (minValue || 10);
	}

	private async checkMinprice(bot: Bot, profile: abProfile) {
		let window = bot.currentWindow;
		if (!window) return;

		if (!window.slots[0]) return;
		const items = window.slots.slice(0, 44);
		const filterItems = items.filter((item) => item !== null);
		const prices = filterItems.map((item) => this.extractPrice(ToGeneralizedItem(item).customLoreHTML, profile.priceRegex) / item.count);
		const minPrices = [...prices].sort((a, b) => a - b).slice(0, 3);

		const minPrice = Math.floor(minPrices[0]);
		const averagePrice = Math.floor(calculateAverage(minPrices));


		return { averagePrice, minPrice };
	}

	private async startCallibration(profileAccount: IClientBot) {
		let oldProfile = getProfileAutobuy(profileAccount.accountModel.server);
		let resultProfile = oldProfile;
		if (oldProfile?.percentMode) {
			const newProfile = await this.callicalibrationPriceProfile(profileAccount._bot, oldProfile);
			resultProfile = this.smoothNewProfile(oldProfile, newProfile, { max: 3, min: 0.1 });
		}

		return resultProfile;
	}


	private smoothNewProfile(oldProfile: abProfile, newProfile: abProfile, options: { min: number, max: number }) {
		const smoothProfileItems = { ...newProfile };

		for (const key in oldProfile.info) {
			const temp = newProfile.info[key].price / oldProfile.info[key].price;
			if (temp > options.max || temp < options.min) smoothProfileItems.info[key] = oldProfile.info[key];
		}

		return smoothProfileItems;
	}

	private async autoBuyProccessInit(massId: number, botId: string, profile: abProfile, profileAccount: IClientBot): Promise<Subscribe[]> {
		const bot = profileAccount?._bot;

		let resellItemSub;

		const onJoin = (player: Player) => {
			if (player.username !== profile.savingBalanceAccount) return;
			this.pay(profile, profileAccount._bot);
		};
		profileAccount._bot.on('playerJoined', onJoin);
		const paySubscribe = {
			unsubscribe: () => {
				profileAccount._bot?.off('playerJoined', onJoin);
			},
		};

		if (profile.resell.hasResellButton) {
			resellItemSub = setInterval(async () => {
				this.massAbIds[massId].botFlags[botId].isNeedResellItems = true;
			}, profile.resell.interval);
		}

		const buyItemSubscribe = this.onBuyItem(profileAccount, profile);
		const externalItemBuySubscribe = this.onExternalBuyItem(profileAccount, profile, massId, botId);
		const sellItemSubscribe = this.onSellItem(profileAccount, profile, massId, botId);

		return [
			buyItemSubscribe,
			paySubscribe, sellItemSubscribe, externalItemBuySubscribe,
			nodeIntervalToSubscribe(resellItemSub),
		];
	}

	private async proccesBuyCycle(bot: Bot, profile: abProfile, profileAccount: IClientBot) {
		try {
			const searchInfo = this.searchItemToBuy(bot, profile);
			if (searchInfo) {
				const { slotIndex, targetItem } = searchInfo;

				if (profile.buyDelay) await syncTimeout(profile.buyDelay);

				if (profile.shift) {
					if (!this.isItemCopies(ToGeneralizedItem(bot.currentWindow.slots[slotIndex]), targetItem, profile)) {
						return logger.warn('Предмет подменился, охрана отменила покупку');
					}
					bot.clickWindow(slotIndex, 0, 1);
				} else {
					await this.buyClick(bot, slotIndex);
					await syncTimeout(200);

					this.saveBuy(bot, targetItem, profile);
					this.bindReserveUndo(bot);
				}
				// this.sellOnUpdate(bot, profileAccount, profile);
			}
		} catch (e) {
			logger.error(e.message);
		}
	}

	getAutoBuyState(id: string): toggleInfo {
		for (const massId in this.massAbIds) {
			if (this.massAbIds[massId].botsIds.includes(id)) return 'ON';
		}
		return 'OFF';
	}

	getAutoBuySystemState(id: number): toggleInfo {
		if (this.massAbIds[id]) return 'ON';
		return 'OFF';
	}

	private async sendMoneyOnSaveAccount(money: number, bot: Bot, profile: abProfile) {
		if (!bot.players[profile.savingBalanceAccount]) return;
		bot.chat(`/pay ${profile.savingBalanceAccount} ${money}`);
		await syncTimeout(300);
		bot.chat(`/pay ${profile.savingBalanceAccount} ${money}`);
		buyLogger.info(`Баланс ${profile.savingBalanceAccount} пополнен на ${money}`);
	}

	private async countItemForSale(bot: Bot, name: string): Promise<number> {
		switch (name) {
			case 'spookytime': {
				const promise = new Promise<number>(async (resolve, reject) => {
					await syncTimeout(1000);
					const slots = bot.currentWindow.slots.slice(0, 44);
					const itemForSale = slots.filter(item => item !== null).length;
					resolve(itemForSale);
				});
				bot.chat(`/ah ${bot.username}`);

				return promise;
			}
		}
		return undefined;
	}

	private async getBotBalance(bot: Bot, name: string) {
		switch (name) {
			case 'holyworld': {
				return bot.scoreboard['1']['itemsMap']['§2'].displayName.extra[2].text.replaceAll(',', '');
			}
			case 'spookytime': {
				const promise = new Promise<number>((resolve, reject) => {
					const timeout = setTimeout(() => {
						bot.off('messagestr', onMsg);
						reject('баланс не показан');
					}, 3000);
					const onMsg = (msg: string) => {
						if (!msg.includes('Ваш баланс')) return;
						clearTimeout(timeout);
						bot.off('messagestr', onMsg);
						let getBalance = msg.split(' ');
						let splitedBalance = getBalance[3];
						let clearBalance = splitedBalance.replace(/[$,]/g, '');
						let numBalance = Number(clearBalance);
						resolve(numBalance);
					};
					bot.on('messagestr', onMsg);
				});
				bot.chat('/balance');

				return promise;
			}
		}
		return undefined;
	}

	private async pay(profile: abProfile, bot: Bot) {
		if (profile.savingBalanceAccount) {
			if (!bot.players[profile.savingBalanceAccount]) return;
			const balance = await this.getBotBalance(bot, profile.name);
			if (balance >= profile.targetBalance * 1.2) {
				await this.sendMoneyOnSaveAccount(Math.floor(balance - profile.targetBalance), bot, profile);
			}
		}
	}

	private isNeedInventorySell(bot: Bot, profile: abProfile) {
		let count = 0;
		const slots = bot.inventory.slots;

		for (let index = 0; index < slots.length; index++) {
			const sItem = slots[index];
			if (!sItem) continue;

			const item = ToGeneralizedItem(sItem);
			const price = this.checkSellItem(profile, item, index);
			if (price) {
				count++;
			}
		}


		return count;
	}

	private async sellInventory(bot: Bot, profile: abProfile, limit: number) {
		const slots = bot.inventory.slots;
		let salled = 0;
		if (bot?.currentWindow) bot.closeWindow(bot?.currentWindow);

		await this.restackItems(bot, profile);
		for (let index = 0; index < slots.length; index++) {
			if (salled >= limit) break;
			const sItem = slots[index];
			if (!sItem) continue;

			const item = ToGeneralizedItem(sItem);
			const price = this.checkSellItem(profile, item, index);
			if (!price) continue;

			let sellIndex = index;
			if (sItem.slot < 36) {
				const emptySlots = bot.inventory.slots
					.map((x, i) => !x ? i : null)
					.filter(x => x !== null && x >= 36 && x <= 44);

				const availableToReplaceSlots = bot.inventory.slots
					.filter(x => x !== null && x.slot >= 36 && x.slot <= 44 && !this.checkSellItem(profile, ToGeneralizedItem(x), index) && x.name !== sItem.name)
					.map((x) => x.slot);

				if (emptySlots.length === 0 && availableToReplaceSlots.length === 0) continue;

				if (emptySlots.length !== 0) {
					const targetPlace = emptySlots.pop();
					console.log(item.slot, targetPlace);
					bot.clickWindow(item.slot, 0, 0);
					await syncTimeout(500);
					bot.clickWindow(targetPlace, 0, 0);
					await syncTimeout(300);
					sellIndex = targetPlace;
				} else {
					const prevSlot = item.slot;
					const targetPlace = availableToReplaceSlots.pop();
					bot.clickWindow(item.slot, 0, 0);
					await syncTimeout(500);
					bot.clickWindow(targetPlace, 0, 0);
					await syncTimeout(500);
					bot.clickWindow(prevSlot, 0, 0);
					await syncTimeout(500);
					sellIndex = targetPlace;
				}
			}

			await this.sellItem(bot, item, profile, price, sellIndex);
			await syncTimeout(2000);
			salled++;
		}
	}


	private async restackItems(bot: Bot, profile: abProfile) {
		logger.info(`${bot.username} restack`);
		const slots = bot.inventory.slots;
		const itemSlots = slots.filter(x => x !== null && profile.info[this.getItemName(ToGeneralizedItem(x), profile)]);
		const emptySlots = slots.map((x, i) => !x ? i : null).filter(x => x !== null && x >= 9 && x <= 44);

		for (const item of itemSlots) {
			const stack: Item[] = [item];

			while (stack.length > 0) {
				const item = stack.pop();
				const itemName = this.getItemName(ToGeneralizedItem(item), profile);
				while (
					item.count >= 3 &&
					profile.info[itemName].sellPrice * item.count > profile.defaultMaxSellPrice
					&& emptySlots.length > 0
					) {
					const targetPlace = emptySlots.pop();
					await bot.clickWindow(item.slot, 1, 0);
					await syncTimeout(500);
					await bot.clickWindow(targetPlace, 0, 0);
					await syncTimeout(500);
					if (bot.inventory.slots[targetPlace]) stack.push(bot.inventory.slots[targetPlace]);
					await syncTimeout(300);
				}
			}
		}
	}

	private bindReserveUndo(bot: Bot) {
		setTimeout(() => {
			if (bot.currentWindow.slots[0]?.name === 'lime_stained_glass_pane') {
				bot.clickWindow(8, 0, 0);
			}
		}, 2000);
	}

	private saveBuy(bot: Bot, targetItem: GeneralizedItem, profile: abProfile): void {
		const selectItem = ToGeneralizedItem(bot.currentWindow.slots[13]);
		const name = this.getItemName(targetItem, profile);

		if (this.isItemCopies(selectItem, targetItem, profile)) {
			bot.clickWindow(0, 0, 0);
			logger.info(`Попытался купить предмет ${name} в количестве ${targetItem?.count}`);
		} else if (bot.currentWindow.slots[0]?.name === 'lime_stained_glass_pane') {
			logger.warn(`Отклонил неправильно выбранный предмет ${name} в количестве ${targetItem?.count}`);
			bot.clickWindow(8, 0, 0);
		} else {
			logger.warn(`Холик залагал ${name}`);
		}
	}

	private onBuyItem(profileAccount: IClientBot, profileAb: abProfile) {
		return this.chatService.onChatMessage(profileAccount.accountModel.id, (msg) => {
			if (!msg.includes('Вы успешно купили')) return;
			buyLogger.info(`${profileAccount.accountModel.nickname}: ${msg}`);
		});
	}

	private onSellItem(profileAccount: IClientBot, profileAb: abProfile, massId: number, botId: string) {
		return this.chatService.onChatMessage(profileAccount.accountModel.id, (msg) => {
			if (!msg.includes('выставлен на продажу')) return;
			this.massAbIds[massId].state[botId].itemForSale++;
		});
	}

	private onExternalBuyItem(profileAccount: IClientBot, profileAb: abProfile, massId: number, botId: string) {
		return this.chatService.onChatMessage(profileAccount.accountModel.id, (msg) => {
			if (!msg.includes('У Вас купили')) return;
			buyLogger.info(msg);
			this.pay(profileAb, profileAccount._bot);
			this.massAbIds[massId].state[botId].itemForSale--;
		});
	}

	private updateAuction(profileAccount: IClientBot, profile: abProfile) {
		profileAccount._bot.clickWindow(profile.updateIndex, 0, 1);
	}

	private onAuctionWindowUpdate(profileAccount: IClientBot) {
		return new Promise<void>((resolve, reject) => {
			const timeout = setTimeout(() => {
				logger.error('Timeout: событие не произошло за 1 секунды');
				subscribe.unsubscribe();
				resolve();
			}, 1000);

			const subscribe = profileAccount.$window.once(() => {
				clearTimeout(timeout);
				resolve();
			}, (event) => event.action === 'OPEN');
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
		profileAccount.$inventoryUpdate.once(async (inventory) => {
			if (!inventory.newItem) return;
			const price = this.checkSellItem(profile, inventory.newItem, inventory.itemSlot);
			if (!price) return;
			await this.sellItem(bot, inventory.newItem, profile, price, inventory.itemSlot);
		});
	}

	private checkSellItem(profile: abProfile, item: GeneralizedItem, index: number) {
		const name = this.getItemName(item, profile);
		const price = profile.info[name]?.sellPrice;
		const count = item?.count;
		if (item?.count !== item.stackSize && (item?.count < profile.info[name]?.sellCount || !profile.info[name]?.sellCount)) return;
		if (!this.isItemInAutoBuyList(name, profile)) return;
		if (!profile.info[name]?.sellPrice) return;

		return price * count;
	}

	private async sellItem(bot: Bot, item: GeneralizedItem, profile: abProfile, price: number, slotIndex: number) {
		const name = this.getItemName(item, profile);
		bot.setQuickBarSlot(slotIndex - 36);
		await syncTimeout(800);
		bot.chat(`/ah sell ${price}`);
		logger.info(`Попытался выставить предмет ${name} на продаже в количестве ${item.count} по цене за штуку ${price / item.count}`);
	}

	private getItemName(item: GeneralizedItem, abProfile: abProfile) {
		if (abProfile.serverKeyValueName && item.nbt && item.nbt[abProfile.serverKeyValueName]) {
			return item.nbt[abProfile.serverKeyValueName];
		}
		return item?.customName || item?.displayName;
	}

	private startAsyncInterval(callback: () => Promise<void>, interval: number): {
		id: NodeJS.Timeout,
		unsubscribe: () => void
	} {
		let timeoutId: NodeJS.Timeout;
		let stop = false;

		async function executeCallback() {
			if (stop) return;
			try {
				await callback();
			} catch (e) {
				console.log(e);
			}
			timeoutId = setTimeout(executeCallback, interval);
		}

		executeCallback();

		return {
			id: timeoutId,
			unsubscribe: () => {
				stop = true;
				clearTimeout(timeoutId);
			},
		};
	}


	private onNewItem(profile: abProfile, item: GeneralizedItem | null) {
		if (!item) return false;
		if (item.renamed) return false;
		if (!this.isItemInAutoBuyList(this.getItemName(item, profile), profile)) return false;
		const price = this.extractPrice(item?.customLoreHTML, profile.priceRegex);
		const nickname = this.extractNickname(item?.customLoreHTML, profile.nicknameRegex);
		const name = this.getItemName(item, profile);

		if ((price / item?.count) > profile.info[name]?.price) return false;
		if (profile.blackList.includes(nickname)) {
			buyLogger.info(`АДМИН:${nickname} попытался продать ${name}, за ${price}`);
			return false;
		}
		if (
			item?.count <= 3 && price <= 1000
			&& profile.exception?.includes(name)
		) return false;

		logger.info(`Нашел предмет для покупки с именем ${name} в количестве ${item?.count} при цене за штуку: ${price}`);
		return true;
	}

	private isItemInAutoBuyList(name: string, profile: abProfile) {
		for (const item in profile.info) {
			if (item === name) return true;
		}
		return false;
	}

	private bindCloseAh(clientBot: IClientBot, massId?: number) {
		clientBot.$disconnect.once(() => {
			this.deleteMassAutoBuyBot(massId, clientBot.accountModel.id);
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
		const price = match ? match[1].replace(/,/g, '') : null;
		return +price;
	}

	private extractNickname(text: string, nicknameRegex: string): string | null {
		if (!text) return null;

		const regExp = new RegExp(nicknameRegex);
		const match = text.match(regExp);
		const nickname = match ? match[1].trim() : null;

		return nickname;
	}

	private async buyClick(bot: Bot, slotIndex: number) {
		await bot.clickWindow(slotIndex, 0, 0);
	}

	private async openAuction(bot: Bot, maxRetries = 3, attempt = 1): Promise<void> {
		const promise = new Promise<void>((resolve, reject) => {
			const errorTimeout = setTimeout(() => {
				bot.off('windowOpen', onOpen);

				if (attempt < maxRetries) {
					this.openAuction(bot, maxRetries, attempt + 1)
						.then(resolve)
						.catch(reject);
				} else {
					reject(new Error('Не удалось открыть аук после нескольких попыток.'));
				}
			}, 4000);

			const onOpen = async () => {
				clearTimeout(errorTimeout);
				await syncTimeout(200);
				resolve();
			};

			bot.once('windowOpen', onOpen);
		});

		try {
			bot.chat('/ah');
		} catch (e) {

		}

		return promise;
	}

	private async resellItems(bot: Bot, profile: abProfile) {
		logger.info(`${bot.username} resell`);
		await syncTimeout(800);
		await this.openAuction(bot);
		await syncTimeout(800);
		await bot.clickWindow(46, 0, 0);
		await syncTimeout(800);
		if (bot.currentWindow.slots[0]) await bot.clickWindow(profile.resell.resellButtonIndex, 0, 0);
		await syncTimeout(800);
		if (bot.currentWindow) bot.closeWindow(bot.currentWindow);
	}
}

export const autoBuyService = new AutoBuyService(botInRAMRepository, chatService, windowsService);
