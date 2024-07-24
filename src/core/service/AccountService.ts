import {AccountUpdateDTO, CreateAccountDTO} from "../repository/AccountRepository/dto/AccountDTO";
import {AccountRepository} from "../repository/AccountRepository/AccountRepository";
import {inMemoryAccountRepository} from "../../infrastructure/database/repository/inMemoryAccountRepository";
import {AccountModel} from "../model/AccountModel";
import { getProfile } from '../config';

export class AccountService {
    constructor(
        private accountRepository: AccountRepository
    ) {}

    async create(account: CreateAccountDTO): Promise<AccountModel> {
        if (account.profile){
            const profile = getProfile(account.profile)
            account.version = profile.version;
            account.port = profile.port
            account.server = profile.host
        }
        return await this.accountRepository.create(account)
    }

    async getByName(name: string): Promise<AccountModel | undefined> {
        return await this.accountRepository.getByName(name)
    }

    async getByID(id: string): Promise<AccountModel | undefined> {
        return await this.accountRepository.getByID(id)
    }

    async update(id: string, dto:AccountUpdateDTO) {
        if (dto.profile){
            const profile = getProfile(dto.profile)
            dto.port = profile.port
            dto.version = profile.version
            dto.server = profile.host
        }
        this.accountRepository.update(id, dto)
    }

    async getAll(): Promise<AccountModel[]>{
        return await this.accountRepository.getAll()
    };


    async delete(id: string): Promise<void>{
        this.accountRepository.deleteByID(id);
    };
}
export const accountService = new AccountService(inMemoryAccountRepository)