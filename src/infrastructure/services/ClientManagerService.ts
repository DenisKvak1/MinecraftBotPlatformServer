import { IClientManagerService } from '../../core/service/ClientManagerService';
import { ClientBotRepository } from '../../core/repository/ClientBotRepository/clientBotRepository';
import { botInRAMRepository } from '../database/repository/inRAMBotDateBase';
import { captchaService } from './CaptchaService';
import { ICaptchaService } from '../../core/service/CaptchaService';
import { getProfileCaptcha } from '../../core/config';
import { accountService, AccountService } from '../../core/service/AccountService';
import { BotStatus } from '../../core/model/AccountModel';
import { Observable, Subscribe } from '../../../env/helpers/observable';
import { inMemoryAccountRepository } from '../database/repository/inMemoryAccountRepository';

export class ClientManagerService implements IClientManagerService{
	$connect = new Observable<{id: string}>()
	$disconnect = new Observable<{id: string}>()

	constructor(
		private botRepository: ClientBotRepository,
		private accountService: AccountService,
		private captchaService: ICaptchaService,
	) {
	}


	connect(id: string) {
		const profile = this.botRepository.getById(id)
		if (profile._bot) return
		profile.connect()
		const bot = this.botRepository.getById(id)._bot
		bot.once('login', ()=> {
			this.accountService.update(id, {status: BotStatus.CONNECT})
			this.$connect.next({id})
		})

		bot.once('login', async ()=>{
			const captchaProfile = getProfileCaptcha(profile.accountModel.profile)
			if (!captchaProfile) return
			const imageBuffer = await this.captchaService.loadCaptcha(id, captchaProfile)
			profile.$captcha.next(imageBuffer)
		})
		process.on('SIGTERM', ()=>{
			this.accountService.update(id, {status: BotStatus.DISCONNECT})
			process.exit(0);
		})
		process.on('SIGINT', ()=>{
			this.accountService.update(id, {status: BotStatus.DISCONNECT})
			process.exit(0);
		})
		bot.once('end', ()=>{
			this.accountService.update(id, {status: BotStatus.DISCONNECT})
			this.$disconnect.next({id})
		})
	}

	disconnect(id: string) {
		this.botRepository.getById(id)?.disconnect();
		this.accountService.update(id, {status: BotStatus.DISCONNECT})
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
		const bot = this.botRepository.getById(id)
		return bot?.$health.subscribe(()=>{
			callback()
		})
	}

	onDeath(id: string, callback: () => void): Subscribe {
		const bot = this.botRepository.getById(id)
		return bot?.$death.subscribe(()=>{
			callback()
		})
	}

	async checkOnline(id: string): Promise<boolean> {
		return (await this.accountService.getByID(id)).status === "CONNECT"
	}

	async isPossibleBot(id: string): Promise<boolean> {
		const account = await this.accountService.getByID(id)
		return Boolean(account)
	}
}

export const clientManagerService = new ClientManagerService(botInRAMRepository, accountService, captchaService);