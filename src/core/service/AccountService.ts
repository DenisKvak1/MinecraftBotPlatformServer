import { AccountUpdateDTO, CreateAccountDTO } from '../repository/AccountRepository/dto/AccountDTO';
import { AccountRepository } from '../repository/AccountRepository/AccountRepository';
import { inMemoryAccountRepository } from '../../infrastructure/database/repository/inMemoryAccountRepository';
import { ClientBotRepository } from '../repository/ClientBotRepository/clientBotRepository';
import { botInRAMRepository } from '../../infrastructure/database/repository/inRAMBotDateBase';
import { AccountModel, BotStatus, ClientAccountModel } from '../model/AccountModel';

export class AccountService {
    constructor(
        private accountRepository: AccountRepository,
        private botRepository: ClientBotRepository
    ) {}

    async create(account: CreateAccountDTO): Promise<ClientAccountModel> {
        const newAccount = await this.accountRepository.create(account)
        const clientAccount = {
            ...newAccount,
            status: BotStatus.DISCONNECT
        }
        this.botRepository.create(newAccount)
        return clientAccount
    }

    async getByName(name: string): Promise<ClientAccountModel | undefined> {
        const account = await this.accountRepository.getByName(name)
        if (!account) return undefined
        let bot = this.botRepository.getByName(account.nickname)
        if (!bot) {
            bot = this.botRepository.create(account)
        }
        const clientAccount = {
            ...account,
            status: bot.$status.getValue()
        }
        return clientAccount
    }

    async getByID(id: string): Promise<ClientAccountModel | undefined> {
        const account = await this.accountRepository.getByID(id)
        if (!account) return undefined
        let bot = this.botRepository.getById(id)    
        if (!bot) {
            bot = this.botRepository.create(account)
        }

        const clientAccount = {
            ...account,
            status: bot.$status.getValue()
        }
        return clientAccount
    }

    async update(id: string, dto:AccountUpdateDTO) {
        this.accountRepository.update(id, dto)
    }

    async getAll(): Promise<ClientAccountModel[]>{
        const accounts: AccountModel[] = await this.accountRepository.getAll()
        const clientAccounts = accounts.map(account => {
            let bot = this.botRepository.getByName(account.nickname);
            if (!bot) {
                bot = this.botRepository.create(account);
            }
            return {
                ...account,
                status: bot.$status.getValue()
            }
        });
        return clientAccounts
    };


    async delete(id: string): Promise<void>{
        this.botRepository.getById(id).disconnect();
        this.accountRepository.deleteByID(id);
        this.botRepository.delete(id)
    };
}
export const accountService = new AccountService(inMemoryAccountRepository, botInRAMRepository)