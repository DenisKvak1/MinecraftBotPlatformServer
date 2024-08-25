import { BotActions, BotScript } from './types';

export interface IBotScriptService {
	run(scriptId: string, botId: string): void
	save(name: string, botScript: BotActions): Promise<BotScript>
	runByName(scriptName: string, botId: string): Promise<void>
	get(id: string): Promise<BotScript>
	getAll(): Promise<BotScript[]>
	delete(id: string): Promise<void>
}