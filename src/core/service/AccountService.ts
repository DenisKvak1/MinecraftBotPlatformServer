import {AccountUpdateDTO, CreateAccountDTO} from "../repository/AccountRepository/dto/AccountDTO";
import {AccountRepository} from "../repository/AccountRepository/AccountRepository";
import {inMemoryAccountRepository} from "../../infrastructure/database/repository/inMemoryAccountRepository";
import {AccountModel} from "../model/AccountModel";

export class AccountService {
    constructor(
        private accountRepository: AccountRepository
    ) {}

    async create(account: CreateAccountDTO): Promise<AccountModel> {
        return await this.accountRepository.create(account)
    }

    async getByName(name: string): Promise<AccountModel | undefined> {
        return await this.accountRepository.getByName(name)
    }

    async getByID(id: string): Promise<AccountModel | undefined> {
        return await this.accountRepository.getByName(id)
    }

    async update(id: string, dto:AccountUpdateDTO) {
        this.accountRepository.updateByName(id, dto)
    }

    async getAll(): Promise<AccountModel[]>{
        return await this.accountRepository.getAll()
    };


    async delete(id: string): Promise<void>{
        this.accountRepository.deleteByID(id);
    };
}
export const accountService = new AccountService(inMemoryAccountRepository)