import {ClientBotRepository} from '../../../core/repository/ClientBotRepository/clientBotRepository';
import {Observable, Subscribe} from '../../../../env/helpers/observable';
import {IAutoBuyService} from '../../../core/service/AutoBuy';
import {GeneralizedItem, toggle, toggleInfo} from '../../../../env/types';
import {Bot} from 'mineflayer';
import {abProfile, getProfileAutobuy} from './abConfig';
import {IClientBot} from '../../../core/service/ClientBot';
import {botInRAMRepository} from '../../database/repository/inRAMBotDateBase';
import {buyLogger, logger} from '../../logger/Logger';
import {ToGeneralizedItem, ToGeneralizedItems} from '../../../../env/helpers/ToGeneralizedItem';
import {syncTimeout} from '../../../../env/helpers/syncTimeout';
import {IChatService} from '../../../core/service/ChatService';
import {IWindowService} from '../../../core/service/WindowService';
import {windowsService} from '../WindowService';
import {chatService} from '../ChatService';
import {nodeIntervalToSubscribe} from '../../../../env/helpers/NodeTimeoutToSubscribe';
import {calculateAverage} from '../../../../env/helpers/СalculateAverage';
import {reportTranspileErrors} from 'ts-loader/dist/instances';
import {profile} from 'winston';


export class AutoBuyService implements IAutoBuyService {
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

    async startAutoBuySystem(botIds: string[]): Promise<number> {
        const massAutoBuyId = this.idCounter
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
                if (!this.massAbIds[massAutoBuyId].botsIds.includes(id)) return

                const profile = this.massAbIds[massAutoBuyId].profiles[id];
                const profileAccount = this.massAbIds[massAutoBuyId].profilesAccounts[id]
                await this.updateAuction(profileAccount._bot, profile);
                this.onAuctionWindowUpdate(profileAccount).then(async () => {
                    if (!this.massAbIds[massAutoBuyId].botsIds.includes(id)) return
                    await this.proccesBuyCycle(profileAccount._bot, profile, profileAccount);
                })
                await syncTimeout((profile.interval / (bots.length * 4 / 5)));
            }
        }, 0);


        this.massAbIds[massAutoBuyId].interval = interval
        return massAutoBuyId
    }

    async stopAutoBuySystem(massId: number): Promise<void> {
        this.massAbIds[massId].botsIds.forEach((id) => {
            this.clearSubscribes(this.massAbIds[massId].subscribes[id])
        })
        delete this.massAbIds[massId]
    }

    async addToAutoBuySystem(massId: number, botId: string) {
        this.$ab.next({id: botId, action: 'START'});

        const {profile, profileAccount} = await this.massAutoBuyFirstInit(botId)
        const isOkInit = await this.autoBuyProccessInit(botId, profile, profileAccount);
        if (!isOkInit) {
            this.$ab.next({id: botId, action: 'STOP'});
            this.massAbIds[massId].botsIds.filter((id) => id !== botId);
            return
        }
        const {sellSubscribe, buyLoggerSubscribe, updatePrice, paySubscribe, $updatePrice, $stopSetPrice} = isOkInit;
        const subscribe1 = $updatePrice.subscribe(() => {
            this.massAbIds[massId].stopped = true;
        });
        const subscribe2 = $stopSetPrice.subscribe(async (newProfile) => {
            const oldProfile = this.massAbIds[massId].profiles[botId]
            this.massAbIds[massId].profiles[botId] = this.smoothNewProfile(oldProfile, newProfile);
            this.massAbIds[massId].profilesAccounts[botId]._bot.chat('/ah');
            await syncTimeout(600);
            if (profile.name === 'holyworld') await windowsService.click(botId, 53, 1);
            await syncTimeout(600);
            this.massAbIds[massId].stopped = false
        });

        this.massAbIds[massId].subscribes[botId] = [
            subscribe1, subscribe2, nodeIntervalToSubscribe(updatePrice),
            nodeIntervalToSubscribe(sellSubscribe), buyLoggerSubscribe,
            nodeIntervalToSubscribe(paySubscribe)]
        this.massAbIds[massId].botsIds.push(botId)
        this.massAbIds[massId].profiles[botId] = profile;
        this.massAbIds[massId].profilesAccounts[botId] = profileAccount;
        this.bindCloseAh(profileAccount, massId)
    }

    async deleteMassAutoBuyBot(massId: number, botId: string) {
        if (!this.massAbIds[massId]?.botsIds.includes(botId)) return
        this.clearSubscribes(this.massAbIds[massId].subscribes[botId])
        this.massAbIds[massId].botsIds = this.massAbIds[massId].botsIds.filter((id) => id !== botId)
        delete this.massAbIds[massId].profiles[botId]
        delete this.massAbIds[massId].profilesAccounts[botId]
        delete this.massAbIds[massId].subscribes[botId]
        await syncTimeout(1000)
        this.windowService.closeWindow(botId)
        this.$ab.next({id: botId, action: 'STOP'})
    }

    private clearSubscribes(subscribes: Subscribe[]) {
        subscribes.forEach((subsc) => subsc.unsubscribe())
    }

    private async setBuyPrice(bot: Bot, profile: abProfile): Promise<abProfile> {
        buyLogger.info('Калибровка запущенна')
        const newProfile = {...profile};

        for (const abKey in profile.info) {
            const abInfo = profile.info[abKey];

            if (!abInfo.searchName) continue;
            const priceData = await this.checkMinprice(abInfo?.searchName, bot, profile);
            if (!priceData) continue;
            const newPrice = (priceData.averagePrice / 100) * (100 - abInfo?.procentDown || profile.defaultProcentDown)
            const oldPrice = newProfile.info[abKey].price;

            newProfile.info[abKey].price = newPrice
            newProfile.info[abKey].sellprice = Math.floor(priceData.minPrice * 0.99);

            await syncTimeout(500);
        }

        buyLogger.info('Калибровка законченна')
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
        const filterItems = items.filter((item) => item !== null)
        const prices = filterItems.map((item) => this.extractPrice(ToGeneralizedItem(item).customLoreHTML, profile.priceRegex) / item.count)
        const minPrices = [...prices].sort((a, b) => a - b).slice(0, 3)

        const minPrice = Math.floor(minPrices[0])
        const averagePrice = Math.floor(calculateAverage(minPrices))


        return {averagePrice, minPrice};
    }

    private async massAutoBuyFirstInit(id: string) {
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


    private smoothNewProfile(oldProfile: abProfile, newProfile: abProfile) {
        const smoothProfileItems = {...newProfile};

        for (const key in oldProfile.info) {
            const temp = newProfile.info[key].price / oldProfile.info[key].price
            if (temp > 1.7 || temp < 0.4) smoothProfileItems.info[key] = oldProfile.info[key]
        }

        return smoothProfileItems
    }

    private async autoBuyProccessInit(id: string, profile: abProfile, profileAccount: IClientBot): Promise<{
        sellSubscribe: NodeJS.Timeout,
        updatePrice: NodeJS.Timeout,
        buyLoggerSubscribe: Subscribe,
        paySubscribe: NodeJS.Timeout
        $updatePrice: Observable<undefined>,
        $stopSetPrice: Observable<abProfile>,
    } | undefined> {
        if (this.getAutoBuyState(id) === 'ON') return;

        const bot = profileAccount?._bot;
        if (!bot) return;

        const $updatePrice = new Observable<undefined>();
        const $stopSetPrice = new Observable<abProfile>();
        let updatePrice;

        const sellSubscribe = setInterval(() => {
            this.inventorySell(bot, profile);
        }, 9000);

        const paySubscribe = setInterval(() => {
            this.pay(profile, bot)
        }, 5000);

        if (profile.percentMode) {
            updatePrice = setInterval(async () => {
                $updatePrice.next();
                await syncTimeout(2000);
                const newProfile = await this.setBuyPrice(bot, profile);
                $stopSetPrice.next(newProfile);
            }, profile.reloadPriceInterval || 99 * 99 * 99 * 99 * 99 * 99 * 99 * 99);
        }

        const buyLoggerSubscribe = this.initBuyLogger(profileAccount);

        await syncTimeout(1000);
        if (!bot.currentWindow) return;

        return {sellSubscribe, buyLoggerSubscribe, updatePrice, $updatePrice, $stopSetPrice, paySubscribe};
    }

    private async updateAuction(bot: Bot, profile: abProfile) {
        bot.clickWindow(profile.updateIndex, 0, 0);
    }

    private async proccesBuyCycle(bot: Bot, profile: abProfile, profileAccount: IClientBot) {
        try {


            const searchInfo = this.searchItemToBuy(bot, profile);
            if (searchInfo) {
                const {slotIndex, targetItem} = searchInfo;

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
            logger.error(e.message)
        }
    }

    getAutoBuyState(id: string): toggleInfo {
        for (const massId in this.massAbIds) {
            if (this.massAbIds[massId].botsIds.includes(id)) return "ON"
        }
        return 'OFF'
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

    private async pay(profile: abProfile, bot: Bot) {
        if (profile.name === 'holyworld' && profile.savingBalanceAccount) {
            const balance = this.getBotBalance(bot, profile.name);
            if (balance >= profile.targetBalance * 1.2) {
                this.sendMoneyOnSaveAccount(Math.floor(balance - profile.targetBalance), bot, profile);
            }
        }
    }

    private async inventorySell(bot: Bot, profile: abProfile) {
        for (let index = 0; index < bot.inventory.slots.length; index++) {
            const sItem = bot.inventory.slots[index];
            if (!sItem) continue;

            const item = ToGeneralizedItem(sItem);
            const price = this.checkSellItem(profile, item, index);
            if (!price) continue;

            await this.sellItem(bot, item, price, index);
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
        } else if (bot.currentWindow.slots[0]?.name === 'green_stained_glass_pane') {
            logger.warn(`Отклонил неправильно выбранный предмет ${name} в количестве ${targetItem?.count}`);
            bot.clickWindow(8, 0, 0);
        } else {
            logger.warn(`Холик залагал ${name}`)
        }
    }

    private initBuyLogger(profileAccount: IClientBot) {
        return this.chatService.onChatMessage(profileAccount.accountModel.id, (msg) => {
            if (!msg.includes('▶ Вы успешно купили') && !msg.includes(' купил ')) return;
            buyLogger.info(`${profileAccount.accountModel.nickname}: ${msg}`);
        });
    }

    private onAuctionWindowUpdate(profileAccount: IClientBot) {
        return new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error("Timeout: событие не произошло за 3 секунды"));
            }, 3000);

            profileAccount.$window.once(() => {
                clearTimeout(timeout);
                resolve();
            }, (event) => event.action === "UPDATE" && event.slotIndex === 44 && event.newItem !== null);
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

        return {slotIndex, targetItem};
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
        if (!this.checkAutoBuy(name, profile)) return;
        if (!profile.info[name]?.sellprice) return;

        if ((index - 36) < 0 || (index - 36) > 9) return;
        return price * count;
    }

    private async sellItem(bot: Bot, item: GeneralizedItem, price: number, slotIndex: number) {
        const name = item?.customName || item?.displayName;
        bot.setQuickBarSlot(slotIndex - 36);
        await syncTimeout(800)
        bot.chat(`/ah sell ${price}`);
        logger.info(`Попытался выставить предмет ${name} на продаже в количестве ${item.count} по цене за штуку ${price / item.count}`);
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
        const nickname = this.extractNickname(item?.customLoreHTML, profile.nicknameRegex)
        const name = item?.customName || item?.displayName;

        if ((price / item?.count) > profile.info[name]?.price) return false;
        if (profile.blackList.includes(nickname)) {
            buyLogger.info(`АДМИН:${nickname} попытался продать ${name}, за ${price}`)
            return false
        }
        if (
            item?.count <= 3 && price <= 1000
            && profile.exception?.includes(name)
        ) return false

        logger.info(`Нашел предмет для покупки с именем ${name} в количестве ${item?.count} при цене за штуку: ${price}`);
        return true;
    }

    private checkAutoBuy(name: string, profile: abProfile) {
        for (const item in profile.info) {
            if (item === name) return true;
        }
        return false;
    }

    private bindCloseAh(clientBot: IClientBot, massId?: number) {
        clientBot.$disconnect.once(() => {
            this.deleteMassAutoBuyBot(massId, clientBot.accountModel.id)
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

    private extractNickname(text: string, nicknameRegex: string): string | null {
        if (!text) return null

        const regExp = new RegExp(nicknameRegex);
        const match = text.match(regExp)
        const nickname = match ? match[1].trim() : null;

        return nickname
    }

    private async buyClick(bot: Bot, slotIndex: number) {
        await bot.clickWindow(slotIndex, 0, 0);
    }
}

export const autoBuyService = new AutoBuyService(botInRAMRepository, chatService, windowsService);
