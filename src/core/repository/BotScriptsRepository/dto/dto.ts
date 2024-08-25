import { BotActions } from '../../../service/BotScriptService/types';

export type CreateBotScriptDTO = {
	name: string,
	botActions: BotActions
}