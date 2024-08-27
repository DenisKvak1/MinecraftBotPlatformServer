import { IClientManagerService } from '../../core/service/ClientManagerService';
import { ClientBotRepository } from '../../core/repository/ClientBotRepository/clientBotRepository';
import { botInRAMRepository } from '../database/repository/inRAMBotDateBase';
import { ICaptchaService } from '../../core/service/CaptchaService';
import { accountService, AccountService } from '../../core/service/AccountService';
import { BotStatus } from '../../core/model/AccountModel';
import { Observable, Subscribe } from '../../../env/helpers/observable';
import { captchaService } from './CaptchaService/CaptchaService';
import { IBotScriptService } from '../../core/service/BotScriptService/BotScriptService';
import { botScriptsService } from './BotScriptService';

export class ClientManagerService implements IClientManagerService {
	$connect = new Observable<{ id: string }>();
	$disconnect = new Observable<{ id: string }>();
	private subscribes: Record<string, Subscribe[]> = {};
	private botScriptService: IBotScriptService

	constructor(
		private botRepository: ClientBotRepository,
		private accountService: AccountService,
		private captchaService: ICaptchaService,
	) {
	}


	connect(id: string) {
		const profile = this.botRepository.getById(id);
		if (profile._bot) return;
		profile.connect();
		const bot = this.botRepository.getById(id)._bot;
		if (!this.subscribes[id]) this.subscribes[id] = [];

		this.subscribes[id].push(profile.$reconnect.once(() => {
			if(!profile.accountModel.autoReconnect.enable) return
			setTimeout(() => {
				this.connect(id);

				this.$connect.once(() => {
					const scriptId = profile.accountModel.autoReconnect.script;
					if (!scriptId) return;
					this.botScriptService.run(scriptId, id);
				}, (data) => data.id === id);
			}, profile.accountModel.autoReconnect.timeout || 5000);
		}));

		profile.$status.once(() => {
			this.$connect.next({ id });
		}, (status) => status === BotStatus.CONNECT);

		bot.once('login', () => this.captchaService.processingCaptcha(id, bot, profile));

		bot.once('end', () => {
			this.$disconnect.next({ id });
			this.subscribes[id].forEach((subscribe)=> subscribe.unsubscribe())
		});
	}

	disconnect(id: string) {
		const client = this.botRepository.getById(id);
		client?.disconnect();
	}


	onDisconnect(id: string, callback: (reason: string) => void) {
		return this.botRepository.getById(id).$disconnect.subscribe((reason) => {
			callback(reason);
		});
	}

	onSpawn(id: string, callback: () => void) {
		return this.botRepository.getById(id)?.$spawn.subscribe(() => {
			callback();
		});
	}

	onceSpawn(id: string, callback: () => void) {
		return this.botRepository.getById(id)?.$spawn.once(() => {
			callback();
		});
	}

	onDamage(id: string, callback: () => void): Subscribe {
		const bot = this.botRepository.getById(id);
		return bot?.$health.subscribe(() => {
			callback();
		});
	}

	onDeath(id: string, callback: () => void): Subscribe {
		const bot = this.botRepository.getById(id);
		return bot?.$death.subscribe(() => {
			callback();
		});
	}

	getStatus(id: string): BotStatus {
		return this.botRepository.getById(id).$status.getValue();
	}

	async checkOnline(id: string): Promise<boolean> {
		return this.botRepository.getById(id).$status.getValue() === BotStatus.CONNECT;
	}

	async isPossibleBot(id: string): Promise<boolean> {
		const account = await this.accountService.getByID(id);
		return Boolean(account);
	}

	loadBotScript(botScriptService: IBotScriptService): void {
		this.botScriptService = botScriptService
	}
}

export const clientManagerService = new ClientManagerService(botInRAMRepository, accountService, captchaService);