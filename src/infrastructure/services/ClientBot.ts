import { IClientBot, InventoryUpdateDTO, WindowEvent } from '../../core/service/ClientBot';
import { AccountModel, BotStatus } from '../../core/model/AccountModel';
import { Bot, createBot, StorageEvents } from 'mineflayer';
import { Observable } from '../../../env/helpers/observable';
import { Movements, pathfinder } from 'mineflayer-pathfinder';
import { mapDownloader } from 'mineflayer-item-map-downloader';
import { GeneralizedItem } from '../../../env/types';
import { ToGeneralizedItem, ToGeneralizedItems } from '../../../env/helpers/ToGeneralizedItem';
import { logger } from '../logger/Logger';
import { FuntimeCaptcha } from '../controller/captchaConfig/captchaConfig';
import { Window } from 'prismarine-windows';
import { Item } from 'prismarine-item';

export class ClientBot implements IClientBot {
	_bot: Bot;
	$status = new Observable<BotStatus>(BotStatus.DISCONNECT)
	$disconnect = new Observable<string>;
	$spawn = new Observable<null>;
	$window = new Observable<WindowEvent>();
	$chat = new Observable<string>();
	$captcha = new Observable<Buffer>();
	$inventoryUpdate = new Observable<InventoryUpdateDTO>();
	$health = new Observable<void>()
	$death = new Observable<void>()

	constructor(
		public accountModel: AccountModel,
	) {
	}

	connect() {
		if (this._bot) return;
		try {
			this._bot = createBot({
				username: this.accountModel.nickname,
				host: this.accountModel.server,
				port: this.accountModel.port,
				version: this.accountModel.version,
				hideErrors: true,
				logErrors: false,
				'mapDownloader-outputDir': FuntimeCaptcha.mapsPath,
			});
		} catch (e){}

		this._bot.on('login', ()=>{
			if(!this._bot.currentWindow) return
			this._bot.emit('windowClose', this._bot.currentWindow)
			this._bot.currentWindow = null
		})

		this._bot.once('login', ()=> {
			this.$status.next(BotStatus.CONNECT)
			logger.info(`${this.accountModel.id}: Зашёл на сервер ${this.accountModel.server}`)
		})

		this._bot.loadPlugin(mapDownloader);
		this._bot.loadPlugin(pathfinder);
		this.initEvents();
	}

	private initEvents() {
		this._bot.once('spawn', () => {
			const defaultMove = new Movements(this._bot);
			defaultMove.canDig = false;
			defaultMove.allow1by1towers = false;

			this._bot.pathfinder.setMovements(defaultMove);

			// @ts-ignore // Incorrect real argument and library types
			this._bot.inventory.on('updateSlot', (slot: number, oldItem: Item | null, newItem: Item | null) => {
				if (this.itemsAreEqual(oldItem, newItem)) return
				this.$inventoryUpdate.next({
					itemSlot: slot,
					newItem: ToGeneralizedItem(newItem),
				});
			});
		});
		this._bot.on('error', (error)=> {
			logger.error(`${this.accountModel.id}: ${error.message}`);
		})
		this._bot.on('spawn', () => {
			this.$spawn.next()
			logger.info(`${this.accountModel.id}: Заспавнился на сервере ${this.accountModel.server}`)
		});

		this._bot.on('windowOpen', (window:Window<StorageEvents>) => {
			logger.info(`${this.accountModel.id}: Открыл окно ${window.title}`)


			// @ts-ignore // Incorrect real argument and library types
			window.on('updateSlot', (slot: number, oldItem: Item | null, newItem: Item | null)=>{
				this.onWindowSlotUpdate(window, slot, oldItem, newItem)
			})
			const slots = ToGeneralizedItems(window.slots)
			this.$window.next({
				title: window.title,
				action: "OPEN",
				items: slots?.slice(0, -36)
			})
		});
		this._bot.on('windowClose', (window:Window<StorageEvents>) => {
			// @ts-ignore // Incorrect real argument and library types
			window?.off('updateSlot', this.onWindowSlotUpdate)
			this.$window.next({
				action: "CLOSE",
			})
			logger.info(`${this.accountModel.id}: Закрыл окно`)
		});

		this._bot.on('message', (json) => {
			logger.info(`${this.accountModel.id}: Получил сообщение ${json.toString()}`)
			this.$chat.next(json.toString())
		});
		this._bot.on('health', ()=> this.$health.next())
		this._bot.on('death', ()=> {
			this.$death.next()
			logger.warn(`${this.accountModel.id}: Был убит`)
		})
		this._bot.on('kicked', (reason)=>{
			logger.warn(`${this.accountModel.id}: Был кикнут с сервера ${this.accountModel.server}, с причиной: ${reason.toString()}`)
		})
		this._bot.on('end', (reason) => {
			this.onDisconnectHandler(reason)
			logger.warn(`${this.accountModel.id}: Вышел с сервера ${this.accountModel.server}`)
		});
	}

	disconnect() {
		if (!this._bot) return;
		this._bot.end();
		this._bot = null
		this.$status.next(BotStatus.DISCONNECT);
		logger.info(`${this.accountModel.id}: Вышел с сервера ${this.accountModel.server}`)
	}

	private onWindowSlotUpdate(window: Window<StorageEvents>,slot: number, oldItem: Item | null, newItem: Item | null){
		if(slot > window.slots.length - 37 ) return
		if (this.itemsAreEqual(oldItem, newItem)) return

		this.$window.next({
			action: "UPDATE",
			slotIndex: slot,
			oldItem: ToGeneralizedItem(oldItem),
			newItem: ToGeneralizedItem(newItem)
		})
	}

	private onDisconnectHandler(reason: string) {
		this._bot = null;
		this.$status.next(BotStatus.DISCONNECT);
		this.$disconnect.next(reason);
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