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
	updateIndex: number,
	shift: boolean
	interval: number,
	autoSellPrice?: number,
	defaultProcentDown?: number
	reloadPriceInterval: number

	info: {
		[key: string]: {
			price: number
			sellprice?: number | any,
			searchName?: string
			seellcount?: number,
			procentDown?: number
		}
	}
}
