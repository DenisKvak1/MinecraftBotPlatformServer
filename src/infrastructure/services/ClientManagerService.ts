import { IClientManagerService } from '../../core/service/ClientManagerService';
import { ClientBotRepository } from '../../core/repository/ClientBotRepository/clientBotRepository';
import { botInRAMRepository } from '../database/repository/inRAMBotDateBase';
import { captchaService } from './CaptchaService';
import { ICaptchaService } from '../../core/service/CaptchaService';
import { accountService, AccountService } from '../../core/service/AccountService';
import { BotStatus, ClientAccountModel } from '../../core/model/AccountModel';
import { Observable, Subscribe } from '../../../env/helpers/observable';
import { Bot } from 'mineflayer';
import { logger } from '../logger/Logger';
import { getProfileCaptcha } from '../captchaConfig/captchaConfig';

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
			this.$connect.next({id})
		})

		bot.once('login', async ()=>{
			const captchaProfile = getProfileCaptcha(profile.accountModel.server)
			if (!captchaProfile) return

			const checkCaptcha = async (message: any)=>{
				if (message.toString().startsWith('BotFilter >> Вы ввели капчу неправильно, пожалуйста попробуйте ещё раз.')){
					try {
						const imageBuffer = await this.captchaService.loadCaptcha(id, captchaProfile)
						logger.info(`${id}: Капча полученна`)
						profile.$captcha.next(imageBuffer)
					} catch (e){
						logger.warn(`${id}: Ошибка при получении капчи ${e.message}`)
					}
				}
			}

			bot.on('message', checkCaptcha)
			setTimeout(()=> bot.off('message', checkCaptcha), 10000)
			try {
				const imageBuffer = await this.captchaService.loadCaptcha(id, captchaProfile)
				logger.info(`${id}: Капча полученна`)
				profile.$captcha.next(imageBuffer)
			} catch (e){
				logger.warn(`${id}: Ошибка при получении капчи ${e.message}`)
			}
		})

		bot.once('end', ()=>{
			this.$disconnect.next({id})
		})
	}

	disconnect(id: string) {
		const client = this.botRepository.getById(id)
		client?.disconnect()
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

	getStatus(id: string): BotStatus {
		return this.botRepository.getById(id).$status.getValue()
	}

	async checkOnline(id: string): Promise<boolean> {
		return this.botRepository.getById(id).$status.getValue() === BotStatus.CONNECT
	}

	async isPossibleBot(id: string): Promise<boolean> {
		const account = await this.accountService.getByID(id)
		return Boolean(account)
	}
}

export const clientManagerService = new ClientManagerService(botInRAMRepository, accountService, captchaService);