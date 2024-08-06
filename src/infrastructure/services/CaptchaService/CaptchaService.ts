import { logger } from '../../logger/Logger';
import { CaptchaConfig, getProfileCaptcha } from './captchaConfig';
import { Captcha } from '../../module/Captcha';
import { ClientBotRepository } from '../../../core/repository/ClientBotRepository/clientBotRepository';
import { ICaptchaService } from '../../../core/service/CaptchaService';
import { Subscribe } from '../../../../env/helpers/observable';
import { botInRAMRepository } from '../../database/repository/inRAMBotDateBase';
import { Bot } from 'mineflayer';
import { IClientBot } from '../../../core/service/ClientBot';


export class CaptchaService implements ICaptchaService {
	constructor(
		private repository: ClientBotRepository,
	) {
	}

	onCaptcha(id: string, callback: (image: Buffer)=> void):Subscribe {
		return this.repository.getById(id).$captcha.subscribe((buffer)=>{
			callback(buffer)
		})
	}

	async processingCaptcha(id: string, bot:Bot, profile: IClientBot): Promise<void> {
		const captchaProfile = getProfileCaptcha(profile.accountModel.server)
		if (!captchaProfile) return

		const checkCaptcha = async (message: any)=>{
			if (message.toString().startsWith('BotFilter >> Вы ввели капчу неправильно, пожалуйста попробуйте ещё раз.')){
				try {
					const imageBuffer = await this.loadCaptcha(id, captchaProfile)
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
			const imageBuffer = await this.loadCaptcha(id, captchaProfile)
			logger.info(`${id}: Капча полученна`)
			profile.$captcha.next(imageBuffer)
		} catch (e){
			logger.warn(`${id}: Ошибка при получении капчи ${e.message}`)
		}
	}

	async loadCaptcha(id: string, captchaPreset: CaptchaConfig): Promise<Buffer> {
		const bot = this.repository.getById(id)._bot;
		logger.info(`${id}: Запрос на прохождение капчи`)

		const captcha = new Captcha(bot,  captchaPreset)
		return captcha.execute()
	}
}
export const captchaService = new CaptchaService(botInRAMRepository)