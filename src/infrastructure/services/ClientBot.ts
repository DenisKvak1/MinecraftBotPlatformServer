import {IClientBot, InventoryUpdateDTO, WindowEvent} from '../../core/service/ClientBot';
import {AccountModel, BotStatus} from '../../core/model/AccountModel';
import {Bot, createBot, StorageEvents} from 'mineflayer';
import {Observable} from '../../../env/helpers/observable';
import {Movements, pathfinder} from 'mineflayer-pathfinder';
import {mapDownloader} from 'mineflayer-item-map-downloader';
import {ToGeneralizedItem, ToGeneralizedItems} from '../../../env/helpers/ToGeneralizedItem';
import {logger} from '../logger/Logger';
import {Window} from 'prismarine-windows';
import {Item} from 'prismarine-item';
import path from 'node:path';


const socks = require('socks').SocksClient

export class ClientBot implements IClientBot {
    _bot: Bot;
    $status = new Observable<BotStatus>(BotStatus.DISCONNECT);
    $disconnect = new Observable<string>;
    $spawn = new Observable<null>;
    $window = new Observable<WindowEvent>();
    $chat = new Observable<string>();
    $captcha = new Observable<Buffer>();
    $inventoryUpdate = new Observable<InventoryUpdateDTO>();
    $health = new Observable<void>();
    $death = new Observable<void>();
    $reconnect = new Observable<void>();

    constructor(
        public accountModel: AccountModel,
    ) {
    }


    connect() {
        if (this._bot) return;
        try {
            this._bot = createBot({
                port: this.accountModel.port,
                host: this.accountModel.server,
                username: this.accountModel.nickname,
                skipValidation: true,
                version: this.accountModel.version,
                'mapDownloader-outputDir': path.resolve(process.cwd(), 'captcha/maps/'),
            });
        } catch (e) {
        }

        this.fixCloseWindowOnSwitchSubserver();

        this._bot.loadPlugin(mapDownloader);
        this._bot.loadPlugin(pathfinder);
        this.initEvents();
    }

    private initEvents() {
        this.setupBaseEvents();
        this._bot.once('spawn', () => {
            this.setupMovementSetting();
            this.setupInventoryUpdateEvent();
        });
        this.initWindowAction();
    }


    private fixCloseWindowOnSwitchSubserver() {
        this._bot.on('login', () => {
            if (!this._bot.currentWindow) return;
            this._bot.emit('windowClose', this._bot.currentWindow);
            this._bot.currentWindow = null;
        });
    }


    private setupMovementSetting() {
        const defaultMove = new Movements(this._bot);
        defaultMove.canDig = false;
        defaultMove.allow1by1towers = false;

        this._bot.pathfinder.setMovements(defaultMove);
    }

    private setupInventoryUpdateEvent() {
        // @ts-ignore // Incorrect real argument and library types
        this._bot.inventory.on('updateSlot', (slot: number, oldItem: Item | null, newItem: Item | null) => {
            if (this.itemsAreEqual(oldItem, newItem)) return;
            this.$inventoryUpdate.next({
                itemSlot: slot,
                newItem: ToGeneralizedItem(newItem),
            });
        });
    }

    disconnect() {
        if (!this._bot) return;
        this.$disconnect.next('Польазватель выключил бота');
        this.$status.next(BotStatus.DISCONNECT);
        this._bot.end();
        this._bot = null;
        logger.info(`${this.accountModel.id}: Вышел с сервера ${this.accountModel.server}`);
    }


    private setupBaseEvents() {
        this._bot.once('login', () => {
            this.$status.next(BotStatus.CONNECT);
            logger.info(`${this.accountModel.id}: Зашёл на сервер ${this.accountModel.server}`);
        });
        this._bot.on('message', (json) => {
            logger.info(`${this.accountModel.id}: Получил сообщение ${json.toString()}`);
            this.$chat.next(json.toString());
        });
        this._bot.on('health', () => this.$health.next());
        this._bot.on('death', () => {
            this.$death.next();
            logger.warn(`${this.accountModel.id}: Был убит`);
        });
        this._bot.on('kicked', (reason) => {
            logger.warn(`${this.accountModel.id}: Был кикнут с сервера ${this.accountModel.server}, с причиной: ${reason.toString()}`);
        });
        this._bot.on('end', (reason) => {
            const clean = this.$status.getValue() === BotStatus.DISCONNECT;
            this.onCleanDisconnectHandler(reason, clean);
            logger.warn(`${this.accountModel.id}: Вышел с сервера ${this.accountModel.server}`);
        });
        this._bot.on('error', (error) => {
            logger.error(`${this.accountModel.id}: ${error.message}`);
        });
        this._bot.on('spawn', () => {
            this.onSpawnHandler();
            logger.info(`${this.accountModel.id}: Заспавнился на сервере ${this.accountModel.server}`);
        });
    }

    private initWindowAction() {
        this._bot.on('windowOpen', (window: Window<StorageEvents>) => {
            // @ts-ignore // Incorrect real argument and library types
            window.on('updateSlot', (slot: number, oldItem: Item | null, newItem: Item | null) => {
                this.onWindowSlotUpdate(window, slot, oldItem, newItem);
            });

            const slots = ToGeneralizedItems(window.slots)?.slice(0, -36);

            this.$window.next({
                title: window.title,
                action: 'OPEN',
                items: slots
            });
        });
        this._bot.on('windowClose', (window: Window<StorageEvents>) => {
            // @ts-ignore // Incorrect real argument and library types
            window?.off('updateSlot', this.onWindowSlotUpdate);
            this.$window.next({
                action: 'CLOSE',
            });
            logger.info(`${this.accountModel.id}: Закрыл окно`);
        });
    }

    private onWindowSlotUpdate(window: Window<StorageEvents>, slot: number, oldItem: Item | null, newItem: Item | null) {
        if (slot > window.slots.length - 37) return;
        if (this.itemsAreEqual(oldItem, newItem)) return;

        this.$window.next({
            action: 'UPDATE',
            slotIndex: slot,
            oldItem: ToGeneralizedItem(oldItem),
            newItem: ToGeneralizedItem(newItem),
        });
    }

    private onCleanDisconnectHandler(reason: string, clean: boolean) {
        this._bot = null;
        this.$status.next(BotStatus.DISCONNECT);
        this.$disconnect.next(reason);

        if (clean) return;
        this.$reconnect.next();
    }

    private onSpawnHandler() {
        this.$spawn.next();
    }

    private itemsAreEqual(item1: Item | null, item2: Item | null): boolean {
        if (item1 === null && item2 === null) return true;
        if (item1 === null || item2 === null) return false;


        return item1.name === item2.name && item1.count === item2.count;
    }
}