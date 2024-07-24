import {AccountRepository} from "../../../core/repository/AccountRepository/AccountRepository";
import {IJSONController, JSONController, JSONControllerImpl} from "../../module/JSONController";
import {AccountUpdateDTO, CreateAccountDTO} from "../../../core/repository/AccountRepository/dto/AccountDTO";
import {AccountModel} from "../../../core/model/AccountModel";
import { v4 as uuidv4 } from 'uuid';
import { ClientBotRepository } from '../../../core/repository/ClientBotRepository/clientBotRepository';
import { botInRAMRepository } from './inRAMBotDateBase';

class InMemoryAccountRepository implements AccountRepository{
    constructor(
        private JSONController: IJSONController,
        private botRepository: ClientBotRepository
    ) {}


    async create(dto: CreateAccountDTO): Promise<AccountModel> {
        const account: AccountModel[] = this.JSONController.loadJSON();
        const createAccount = {
            id: uuidv4(),
            ...dto
        } as AccountModel;
        account.push(createAccount);
        this.JSONController.saveJSON(account);
        this.botRepository.create(createAccount)
        return createAccount
    }

    deleteByID(id: string): void {
        const accounts: AccountModel[] = this.JSONController.loadJSON();
        const index = accounts.findIndex((item) => item.id === id);
        accounts.splice(index, 1);
        this.JSONController.saveJSON(accounts);
    }

    deleteByName(name: string): void {
        const accounts: AccountModel[] = this.JSONController.loadJSON();
        const index = accounts.findIndex((item) => item.nickname === name);
        accounts.splice(index, 1);
        this.JSONController.saveJSON(accounts);
    }

    getAll(): Promise<AccountModel[]> {
        return this.JSONController.loadJSON();
    }

    async getByID(id: string): Promise<AccountModel> | undefined {
        const accounts: AccountModel    [] = this.JSONController.loadJSON();
        const account = accounts.find((item) => item.id === id);
        if (!account) return undefined;
        const bot = this.botRepository.getByName(account.nickname)
        if (!bot) {
            this.botRepository.create(account)
        }

        return account
    }

    async getByName(name: string): Promise<AccountModel> | undefined {
        const accounts: AccountModel    [] = this.JSONController.loadJSON();
        const account = accounts.find((item) => item.nickname === name);
        if (!account) return undefined;
        const bot = this.botRepository.getByName(account.nickname)
        if (!bot) {
            this.botRepository.create(account)
        }

        return account
    }

    update(id: string, dto: AccountUpdateDTO): void {
        const accounts: AccountModel[] = this.JSONController.loadJSON();
        const index = accounts.findIndex((account) => account.id === id);
        if (index !== -1) {
            const account = accounts[index];
            if (dto.server !== undefined) {
                account.server = dto.server;
            }
            if (dto.port !== undefined) {
                account.port = dto.port;
            }
            if (dto.version !== undefined) {
                account.version = dto.version;
            }
            if (dto.profile !== undefined) {
                account.profile = dto.profile;
            }

            if (dto.status !== undefined) {
                account.status = dto.status;
            }
            this.JSONController.saveJSON(accounts);
        }
    }

    updateByName(name: string, dto: AccountUpdateDTO): void {
        const accounts: AccountModel[] = this.JSONController.loadJSON();
        const index = accounts.findIndex((account) => account.nickname === name);
        if (index !== -1) {
            const account = accounts[index];
            for (const dtoKey in dto) {
                if (dto[dtoKey] !== undefined) {
                    account[dtoKey] = dto[dtoKey]
                }
            }
            this.JSONController.saveJSON(accounts);
        }
    }
}
export const inMemoryAccountRepository = new InMemoryAccountRepository(JSONControllerImpl, botInRAMRepository)