import { Subscribe } from '../../../env/helpers/observable';
import { Bot } from 'mineflayer';
import { IClientBot } from './ClientBot';
import { CaptchaConfig } from '../../infrastructure/services/CaptchaService/captchaConfig';

export interface ICaptchaService {
    loadCaptcha(id: string, captchaPreset: CaptchaConfig): Promise<Buffer>;
    onCaptcha(id: string, callback: (image: Buffer)=> void):Subscribe
    processingCaptcha(id: string, bot:Bot, profile: IClientBot): Promise<void>
}
