import { ClientBotRepository } from '../../../core/repository/ClientBotRepository/clientBotRepository';
import { Observable, Subscribe } from '../../../../env/helpers/observable';
import { IAutoBuyService } from '../../../core/service/AutoBuy';
import { GeneralizedItem, toggle, toggleInfo } from '../../../../env/types';
import { Bot, Player } from 'mineflayer';
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
import { reportTranspileErrors } from 'ts-loader/dist/instances';
import { profile } from 'winston';
import { unsubscribe } from 'node:diagnostics_channel';
import { getRandomInRange } from '../../../../env/helpers/randomGenerator';


export class AutoBuyService implements IAutoBuyService {
	private idCounter: number = 1;
	private massAbIds: Record<string, {
		botsIds: string[],
		stopped: Record<string, boolean>,
		profilesAccounts: Record<string, IClientBot>,
		profiles: Record<string, abProfile>
		subscribes: Record<string, Subscribe[]>,
		state: Record<string, {
			itemForSale: number
		}>
		flags: Record<string, {
			isNeedInventorySell: boolean,
			isNeedCalibration: boolean,
		}>,
	}> = {};

	$ab = new Observable<{ id: string; action: toggle }>();

	constructor(
		private repository: ClientBotRepository,
		private chatService: IChatService,
		private windowService: IWindowService,
	) {
	}

	async startAutoBuySystem(botIds: string[]): Promise<number> {
		const massAutoBuyId = this.idCounter;
		this.idCounter++;

		this.massAbIds[massAutoBuyId] = {
			botsIds: [],
			profiles: {},
			profilesAccounts: {},
			subscribes: {},
			stopped: {},
			flags: {},
			state: {},
		};

		const operations = botIds.map(async botId => {
			await this.addToAutoBuySystem(massAutoBuyId, botId);
		});
		await Promise.all(operations);

		return massAutoBuyId;
	}

	async stopAutoBuySystem(massId: number): Promise<void> {
		this.massAbIds[massId].botsIds.forEach((id) => {
			this.clearSubscribes(this.massAbIds[massId].subscribes[id]);
		});
		delete this.massAbIds[massId];
	}

	async addToAutoBuySystem(massId: number, botId: string) {
		this.$ab.next({ id: botId, action: 'START' });

		const { profile, profileAccount } = await this.massAutoBuyFirstInit(botId);

		const isOkInit = await this.autoBuyProccessInit(massId, botId, profile, profileAccount);
		if (!isOkInit) {
			this.$ab.next({ id: botId, action: 'STOP' });
			this.massAbIds[massId].botsIds.filter((id) => id !== botId);
			return;
		}
		const { sellSubscribe, buyLoggerSubscribe, updatePrice, paySubscribe } = isOkInit;

		this.massAbIds[massId].subscribes[botId] = [
			nodeIntervalToSubscribe(updatePrice),
			nodeIntervalToSubscribe(sellSubscribe), buyLoggerSubscribe,
			paySubscribe,
		];
		this.massAbIds[massId].botsIds.push(botId);
		this.massAbIds[massId].profiles[botId] = profile;
		this.massAbIds[massId].profilesAccounts[botId] = profileAccount;
		this.massAbIds[massId].flags[botId] = { isNeedInventorySell: false, isNeedCalibration: false };
		this.massAbIds[massId].state[botId] = { itemForSale: 0};
		this.bindCloseAh(profileAccount, massId);

		const interval = this.startAsyncInterval(async () => {
			const profile = this.massAbIds[massId].profiles[botId];
			const profileAccount = this.massAbIds[massId].profilesAccounts[botId];
			const bot = profileAccount._bot;
			await this.updateAuction(profileAccount, profile);
			await this.proccesBuyCycle(bot, profile, profileAccount);
			if (this.massAbIds[massId].flags[botId].isNeedInventorySell) {
				if (await this.sellInventory(bot, profile) > 0) {
					await this.openAuction(bot);
				}
				this.massAbIds[massId].flags[botId].isNeedInventorySell = false;
			}
			if (this.massAbIds[massId].flags[botId].isNeedCalibration) {
				const newProfile = await this.callicalibrationPriceProfile(bot, profile);
				const oldProfile = this.massAbIds[massId].profiles[botId];
				this.massAbIds[massId].profiles[botId] = this.smoothNewProfile(oldProfile, newProfile);
				this.massAbIds[massId].profilesAccounts[botId]._bot.chat('/ah');
				await syncTimeout(600);
				if (profile.name === 'holyworld') await windowsService.click(botId, 53, 1);
				await syncTimeout(600);
				this.massAbIds[massId].flags[botId].isNeedCalibration = false;
			}
			await syncTimeout(400);
		}, 0);
		this.massAbIds[massId].subscribes[botId].push(interval);
	}

	async deleteMassAutoBuyBot(massId: number, botId: string) {
		if (!this.massAbIds[massId]?.botsIds.includes(botId)) return;
		this.clearSubscribes(this.massAbIds[massId].subscribes[botId]);
		this.massAbIds[massId].botsIds = this.massAbIds[massId].botsIds.filter((id) => id !== botId);
		delete this.massAbIds[massId].profiles[botId];
		delete this.massAbIds[massId].profilesAccounts[botId];
		delete this.massAbIds[massId].subscribes[botId];
		await syncTimeout(1000);
		this.windowService.closeWindow(botId);
		this.$ab.next({ id: botId, action: 'STOP' });
	}

	private clearSubscribes(subscribes: Subscribe[]) {
		subscribes.forEach((subsc) => subsc.unsubscribe());
	}

	private async callicalibrationPriceProfile(bot: Bot, profile: abProfile): Promise<abProfile> {
		buyLogger.info('Калибровка запущенна');
		const newProfile = { ...profile };

		for (const abKey in profile.info) {
			const abInfo = profile.info[abKey];

			if (!abInfo.searchName) continue;
			const priceData = await this.checkMinprice(abInfo?.searchName, bot, profile);
			if (!priceData) continue;
			const newPrice = (priceData.averagePrice / 100) * (100 - abInfo?.procentDown || profile.defaultProcentDown);
			const oldPrice = newProfile.info[abKey].price;

			newProfile.info[abKey].price = newPrice;
			newProfile.info[abKey].sellprice = Math.floor(priceData.minPrice * 0.99);

			await syncTimeout(500);
		}

		buyLogger.info('Калибровка законченна');
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
		const items = window.slots.slice(0, 44);
		const filterItems = items.filter((item) => item !== null);
		const prices = filterItems.map((item) => this.extractPrice(ToGeneralizedItem(item).customLoreHTML, profile.priceRegex) / item.count);
		const minPrices = [...prices].sort((a, b) => a - b).slice(0, 3);

		const minPrice = Math.floor(minPrices[0]);
		const averagePrice = Math.floor(calculateAverage(minPrices));


		return { averagePrice, minPrice };
	}

	private async massAutoBuyFirstInit(id: string) {
		const profileAccount = this.repository.getById(id);
		let profile = getProfileAutobuy(profileAccount.accountModel.server);
		if (profile?.percentMode) profile = await this.callicalibrationPriceProfile(profileAccount._bot, profile);

		await syncTimeout(500);
		profileAccount._bot.chat('/ah');
		await syncTimeout(500);

		return { profile, profileAccount };
	}


	private smoothNewProfile(oldProfile: abProfile, newProfile: abProfile) {
		const smoothProfileItems = { ...newProfile };

		for (const key in oldProfile.info) {
			const temp = newProfile.info[key].price / oldProfile.info[key].price;
			if (temp > 1.7 || temp < 0.4) smoothProfileItems.info[key] = oldProfile.info[key];
		}

		return smoothProfileItems;
	}

	private async autoBuyProccessInit(massId: number, botId: string, profile: abProfile, profileAccount: IClientBot): Promise<{
		sellSubscribe: NodeJS.Timeout,
		updatePrice: NodeJS.Timeout,
		buyLoggerSubscribe: Subscribe,
		paySubscribe: Subscribe
	} | undefined> {
		if (this.getAutoBuyState(botId) === 'ON') return;

		const bot = profileAccount?._bot;
		if (!bot) return;

		let updatePrice;

		const sellSubscribe = setInterval(async () => {
			this.massAbIds[massId].flags[botId].isNeedInventorySell = true;
		}, 60000);


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

		if (profile.percentMode && profile.reloadPriceInterval) {
			updatePrice = setInterval(async () => {
				this.massAbIds[massId].flags[botId].isNeedCalibration = true;
			}, profile.reloadPriceInterval);
		}

		const buyLoggerSubscribe = this.onBuy(profileAccount, profile);

		await syncTimeout(1000);
		if (!bot.currentWindow) return;

		return { sellSubscribe, buyLoggerSubscribe, updatePrice, paySubscribe };
	}

	private async proccesBuyCycle(bot: Bot, profile: abProfile, profileAccount: IClientBot) {
		try {
			const searchInfo = this.searchItemToBuy(bot, profile);
			if (searchInfo) {
				const { slotIndex, targetItem } = searchInfo;

				if (profile.buyDelay) await syncTimeout(profile.buyDelay);

				if (profile.shift) {
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
		await syncTimeout(1000);
		bot.chat(`/pay ${profile.savingBalanceAccount} ${money}`);
		buyLogger.info(`Баланс ${profile.savingBalanceAccount} пополнен на ${money}`);
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
			const balance = await this.getBotBalance(bot, profile.name);
			if (balance >= profile.targetBalance * 1.2) {
				await this.sendMoneyOnSaveAccount(Math.floor(balance - profile.targetBalance), bot, profile);
			}
		}
	}

	private async sellInventory(bot: Bot, profile: abProfile) {
		let count = 0;
		for (let index = 0; index < bot.inventory.slots.length; index++) {
			const sItem = bot.inventory.slots[index];
			if (!sItem) continue;

			const item = ToGeneralizedItem(sItem);
			const price = this.checkSellItem(profile, item, index);
			if (!price) continue;

			await this.sellItem(bot, item, price, index);
			count++;
			await syncTimeout(2000);
		}
		return count;
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
		const name = targetItem.customName || targetItem?.displayName;

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

	private onBuy(profileAccount: IClientBot, profileAb: abProfile) {
		return this.chatService.onChatMessage(profileAccount.accountModel.id, (msg) => {
			if (!msg.includes('Вы успешно купили')) return;
			this.pay(profileAb, profileAccount._bot);
			buyLogger.info(`${profileAccount.accountModel.nickname}: ${msg}`);
		});
	}

	private updateAuction(profileAccount: IClientBot, profile: abProfile) {
		return new Promise<void>(async (resolve, reject) => {
			const timeout = setTimeout(() => {
				logger.error('Timeout: событие не произошло за 3 секунды');
				subscribe.unsubscribe();
				resolve();
			}, 3000);

			const subscribe = profileAccount.$window.once(() => {
				clearTimeout(timeout);
				resolve();
			}, (event) => event.action === 'OPEN');
			await profileAccount._bot.clickWindow(profile.updateIndex, 0, 1);
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
			await this.sellItem(bot, inventory.newItem, price, inventory.itemSlot);
		});
	}

	private checkSellItem(profile: abProfile, item: GeneralizedItem, index: number) {
		const name = item?.customName || item?.displayName;
		const price = profile.info[name]?.sellprice;
		const count = item?.count;
		if (item?.count !== item.stackSize && (item?.count < profile.info[name]?.seellcount || !profile.info[name]?.seellcount)) return;
		if (item.name !== item.name) return;
		if (!this.isItemInAutoBuyList(name, profile)) return;
		if (!profile.info[name]?.sellprice) return;

		if ((index - 36) < 0 || (index - 36) > 9) return;
		return price * count;
	}

	private async sellItem(bot: Bot, item: GeneralizedItem, price: number, slotIndex: number) {
		const name = item?.customName || item?.displayName;
		bot.setQuickBarSlot(slotIndex - 36);
		await syncTimeout(800);
		bot.chat(`/ah sell ${price}`);
		logger.info(`Попытался выставить предмет ${name} на продаже в количестве ${item.count} по цене за штуку ${price / item.count}`);
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
		if (!this.isItemInAutoBuyList(item.customName || item.displayName, profile)) return false;
		const price = this.extractPrice(item?.customLoreHTML, profile.priceRegex);
		const nickname = this.extractNickname(item?.customLoreHTML, profile.nicknameRegex);
		const name = item?.customName || item?.displayName;

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
}

export const autoBuyService = new AutoBuyService(botInRAMRepository, chatService, windowsService);
