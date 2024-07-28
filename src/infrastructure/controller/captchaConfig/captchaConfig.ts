import { CaptchaPreset } from '../../../core/service/CaptchaService';
import path from 'node:path';

export function getProfileCaptcha(server: string) {
	switch (server) {
		case 'mc.funtime.su':
			return FuntimeCaptcha
		case 'mc.holyworld.io':
			return HolyWorldCaptcha
		case 'mc.holyworld.ru':
			return HolyWorldCaptcha
	}
}

export const FuntimeCaptcha: CaptchaPreset = {
	mapsPath: path.resolve(process.cwd(), './captcha/maps/'),
	resultPath: path.resolve(process.cwd(), './captcha/result/result.jpg'),
	rows: 2,
	cols: 3,
	startX: 4,
	startY: 253
}
export const HolyWorldCaptcha: CaptchaPreset = {
	mapsPath: path.resolve(process.cwd(), './captcha/maps/'),
	resultPath: path.resolve(process.cwd(), './captcha/result/result.jpg'),
	rows: 3,
	cols: 4,
	startX: 10,
	startY: 67
}
