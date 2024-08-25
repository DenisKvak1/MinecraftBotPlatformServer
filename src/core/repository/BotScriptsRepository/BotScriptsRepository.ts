import { CreateBotScriptDTO } from './dto/dto';
import { BotScript } from '../../service/BotScriptService/types';

export interface BotScriptRepository {
	create(dto: CreateBotScriptDTO): Promise<BotScript>,
	save(dto: BotScript): void
	getById(id: string): Promise<BotScript>
	getByName(name: string): Promise<BotScript>
	getAll(): Promise<BotScript[]>
	delete(id: string): void
}