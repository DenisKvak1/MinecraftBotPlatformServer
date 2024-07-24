import { IClientBot } from '../../../core/service/ClientBot';
import { ClientBot } from '../../services/ClientBot';
import { AccountModel } from '../../../core/model/AccountModel';
import { ClientBotRepository } from '../../../core/repository/ClientBotRepository/clientBotRepository';

export class BotInRAMRepository implements ClientBotRepository{
    private readonly bots: IClientBot[] = [];

    create(dto: AccountModel): IClientBot {
        const bot = new ClientBot(dto)
        this.bots.push(bot)
        return bot
    }

    delete(name: string): void {
        const index = this.bots.findIndex((item) => item.accountModel.nickname === name);
        this.bots.splice(index, 1);
    }

    getAll(): IClientBot[] {
        return this.bots
    }

    getByName(name: string): IClientBot | undefined {
        return this.bots.find((item) => item.accountModel.nickname === name);
    }

    getById(id: string): IClientBot | undefined {
        return this.bots.find((item) => item.accountModel.id === id);
    }
}
export const botInRAMRepository = new BotInRAMRepository()