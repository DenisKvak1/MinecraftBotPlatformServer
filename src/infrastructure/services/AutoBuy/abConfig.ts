import { parseJsonFile } from '../../../../env/helpers/parseJson';
import path from 'node:path';
import { Bot } from 'mineflayer';

export function getProfileAutobuy(server: string) {
	const autoBuyConfigPath = path.resolve(process.cwd(), 'configs/autoBuyConfig.json');
	const configs:abProfile[] =  parseJsonFile(autoBuyConfigPath);
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



export type abProfile = {
	percentMode?: string
	savingBalanceAccount?: string,
	name: string
	targetBalance?: number
	serverIps: string | string[],
	priceRegex: string,
	nicknameRegex: string
	updateIndex: number,
	defaultMaxSellPrice: number
	shift: boolean
	interval: number,
	autosellPrice?: number,
	defaultpercentDown?: number
	callibrationPriceInterval: number
	restartActionInterval?: number
	serverKeyValueName?: string
	blackList: string[]
	exception: string[]
	buyDelay?: number
	itemForSaleLimit?: number
	resell: {
		"hasResellButton": boolean,
		"resellButtonIndex": number,
		"interval": number
	},

	info: abItemCfg
}
export type abItemCfg = {
	[key: string]: {
		price: number
		sellPrice?: number | any,
			searchName?: string
		sellCount?: number,
			percentDown?: number,
			minCountToCalibrate?: number,
	}
}
