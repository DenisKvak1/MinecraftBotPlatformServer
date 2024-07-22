import { IClientManagerService } from '../../core/service/ClientManagerService';
import { ClientBotRepository } from '../../core/repository/ClientBotRepository/clientBotRepository';
import { botInRAMRepository } from '../database/repository/inRAMBotDateBase';
import { captchaService } from './CaptchaService';
import { ICaptchaService } from '../../core/service/CaptchaService';
import { FuntimeCaptcha, getProfileCaptcha } from '../../core/config';
import { AccountService } from '../../core/service/AccountService';
import { AccountRepository } from '../../core/repository/AccountRepository/AccountRepository';
import { inMemoryAccountRepository } from '../database/repository/inMemoryAccountRepository';
import { BotStatus } from '../../core/model/AccountModel';
import { Observable, Subscribe } from '../../../env/helpers/observable';

export class ClientManagerService implements IClientManagerService{
	$connect = new Observable<{id: string}>()
	$disconnect = new Observable<{id: string}>()

	constructor(
		private botRepository: ClientBotRepository,
		private accountRepository: AccountRepository,
		private captchaService: ICaptchaService,
	) {
	}


	connect(id: string) {
		const profile = this.botRepository.getById(id)
		profile.connect()
		const bot = this.botRepository.getById(id)._bot
		this.accountRepository.update(id, {status: BotStatus.CONNECT})

		this.$connect.next({id})

		bot.once('login', async ()=>{
			const captchaProfile = getProfileCaptcha(profile.accountModel.profile)
			if (!captchaProfile) return
			const imageBuffer = await this.captchaService.loadCaptcha(id, captchaProfile)
			profile.$captcha.next(imageBuffer)
		})
		bot.once('end', ()=>{
			this.$disconnect.next({id})
		})
	}

	disconnect(id: string) {
		this.botRepository.getById(id)?.disconnect();
		this.accountRepository.update(id, {status: BotStatus.DISCONNECT})
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
		return (await this.accountRepository.getByID(id)).status === "CONNECT"
	}
}

export const clientManagerService = new ClientManagerService(botInRAMRepository, inMemoryAccountRepository, captchaService);