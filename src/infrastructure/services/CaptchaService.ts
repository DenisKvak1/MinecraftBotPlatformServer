import { CaptchaPreset, ICaptchaService } from '../../core/service/CaptchaService';
import { ClientBotRepository } from '../../core/repository/ClientBotRepository/clientBotRepository';
import { Bot } from 'mineflayer';
import path from 'node:path';
import { CaptchaSharp } from '../module/CaptchaSharp';
import { botInRAMRepository } from '../database/repository/inRAMBotDateBase';
import { Captcha } from '../module/Captcha';
import { Subscribe } from '../../../env/helpers/observable';


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

	async loadCaptcha(id: string, captchaPreset: CaptchaPreset): Promise<Buffer> {
		const bot = this.repository.getById(id)._bot;

		const captcha = new Captcha(bot,  captchaPreset)
		return captcha.execute()
	}
}
export const captchaService = new CaptchaService(botInRAMRepository)