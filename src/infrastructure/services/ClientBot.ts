import { IClientBot, InventoryUpdateDTO } from '../../core/service/ClientBot';
import { AccountModel } from '../../core/model/AccountModel';
import { Bot, createBot } from 'mineflayer';
import { IObservable, Observable } from '../../../env/helpers/observable';
import { Movements, pathfinder } from 'mineflayer-pathfinder';
import { Item } from 'prismarine-item';
import { FuntimeCaptcha, getProfile } from '../../core/config';
import { mapDownloader } from 'mineflayer-item-map-downloader';
import { AccountRepository } from '../../core/repository/AccountRepository/AccountRepository';

export class ClientBot implements IClientBot {
	_bot: Bot;
	$disconnect = new Observable<string>;
	$spawn = new Observable<null>;
	$openWindow = new Observable<Item[]>();
	$closeWindow = new Observable<void>();
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

		this._bot = createBot({
			username: this.accountModel.nickname,
			host: this.accountModel.server,
			port: this.accountModel.port,
			version: this.accountModel.version,

			'mapDownloader-outputDir': FuntimeCaptcha.mapsPath,
		});
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
				this.$inventoryUpdate.next({
					itemSlot: slot,
					newItem: newItem,
				});
			});
		});
		this._bot.on('spawn', () => this.$spawn.next());

		this._bot.on('windowOpen', (window) => this.$openWindow.next(window.slots));
		this._bot.on('windowClose', () => this.$closeWindow.next());
		this._bot.on('message', (json) => this.$chat.next(json.toString()));
		this._bot.on('health', ()=> this.$health.next())
		this._bot.on('death', ()=> this.$death.next())
		this._bot.once('end', (reason) => this.onDisconnectHandler(reason));
	}

	disconnect() {
		if (!this._bot) return;
		this._bot.end();
		this._bot = null;
	}

	private onDisconnectHandler(reason: string) {
		this._bot = null;
		this.$disconnect.next(reason);
	}

	private onSpawnHandler() {
		this.$spawn.next();
	}
}