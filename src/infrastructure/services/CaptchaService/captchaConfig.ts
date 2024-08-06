import path from 'node:path';
import { parseJsonFile } from '../../../../env/helpers/parseJson';

export function getProfileCaptcha(server: string) {
	const autoBuyConfigPath = path.resolve(process.cwd(), 'configs/CaptchaConfig.json');
	const configs:CaptchaConfig[] =  parseJsonFile(autoBuyConfigPath);
	const targetConfig = configs.find((config)=>{
		if(typeof config.serverIps === 'string' && config.serverIps === server) {
			return config
		}
		if(typeof config.serverIps === 'object' && config.serverIps.includes(server)) {
			return config
		}
	})

	return targetConfig
}

export type CaptchaConfig = {
	serverIps: string | string[]
	resultPath: string
	mapsPath: string
	rows: number
	cols: number
	startX: number
	startY: number
	invertRows?: boolean
	invertCol?: boolean
}