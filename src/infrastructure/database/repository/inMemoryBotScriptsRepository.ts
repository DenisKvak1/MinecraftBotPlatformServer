
import { v4 as uuidv4 } from 'uuid';
import { BotScriptRepository } from '../../../core/repository/BotScriptsRepository/BotScriptsRepository';
import { CreateBotScriptDTO } from '../../../core/repository/BotScriptsRepository/dto/dto';
import { BotScript } from '../../../core/service/BotScriptService/types';
import { Bot } from 'mineflayer';
import { IJSONController, JSONControllerBotScriptsImpl } from '../../module/JSONController';

class InMemoryBotScriptsRepository implements BotScriptRepository{
	constructor(
		private JSONController: IJSONController
	) {}


	async create(dto: CreateBotScriptDTO): Promise<BotScript> {
		const scripts: BotScript[] = this.JSONController.loadJSON();
		const botScript = {
			id: uuidv4(),
			...dto
		} as BotScript;

		scripts.push(botScript);
		this.JSONController.saveJSON(scripts);
		return  botScript
	}

	delete(id: string): void {
		const scripts: BotScript[] = this.JSONController.loadJSON();
		const index = scripts.findIndex((item) => item.id === id);
		scripts.splice(index, 1);
		this.JSONController.saveJSON(scripts);
	}


	async getAll(): Promise<BotScript[]> {
		return await this.JSONController.loadJSON();
	}


	async getById(id: string): Promise<BotScript> | undefined {
		const scripts: BotScript[] = this.JSONController.loadJSON();
		const script = scripts.find((item) => item.id === id);
		if (!script) return undefined;

		return script
	}

	async getByName(name: string): Promise<BotScript> {
		const scripts: BotScript[] = this.JSONController.loadJSON();
		const script = scripts.find((item) => item.name === name);
		if (!script) return undefined;

		return script
	}

	async save(dto: BotScript): Promise<void> {
		const scripts: BotScript[] = this.JSONController.loadJSON();
		const index = scripts.findIndex((script) => script.id === dto.id);
		scripts[index] = dto

		this.JSONController.saveJSON(scripts)
	}
}
export const inMemoryBotScriptsRepository = new InMemoryBotScriptsRepository(JSONControllerBotScriptsImpl)