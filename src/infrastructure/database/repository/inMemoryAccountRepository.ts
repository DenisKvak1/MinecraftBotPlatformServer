import { AccountRepository } from '../../../core/repository/AccountRepository/AccountRepository';
import { IJSONController, JSONControllerAccountImpl } from '../../module/JSONController';
import { AccountUpdateDTO, CreateAccountDTO } from '../../../core/repository/AccountRepository/dto/AccountDTO';
import { AccountModel } from '../../../core/model/AccountModel';
import { v4 as uuidv4 } from 'uuid';
import { addColors } from 'winston';

class InMemoryAccountRepository implements AccountRepository {
	constructor(
		private JSONController: IJSONController,
	) {
	}


	async create(dto: CreateAccountDTO): Promise<AccountModel> {
		const account: AccountModel[] = this.JSONController.loadJSON();
		const createAccount = {
			id: uuidv4(),
			...dto,
		} as AccountModel;
		if (!createAccount.whiteList) createAccount.whiteList = [];
		if (!createAccount.autoReconnect) createAccount.autoReconnect = { enable: false, timeout: 5000, script: '' };

		account.push(createAccount);
		this.JSONController.saveJSON(account);
		return createAccount;
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

	async getAll(): Promise<AccountModel[]> {
		return await this.JSONController.loadJSON();
	}


	async getByID(id: string): Promise<AccountModel> | undefined {
		const accounts: AccountModel    [] = this.JSONController.loadJSON();
		const account = accounts.find((item) => item.id === id);
		if (!account) return undefined;

		return account;
	}

	async getByName(name: string): Promise<AccountModel> | undefined {
		const accounts: AccountModel    [] = this.JSONController.loadJSON();
		const account = accounts.find((item) => item.nickname === name);
		if (!account) return undefined;

		return account;
	}

	update(id: string, dto: AccountUpdateDTO): void {
		const accounts: AccountModel[] = this.JSONController.loadJSON();
		const index = accounts.findIndex((account) => account.id === id);
		if (index !== -1) {
			const account = accounts[index];
			for (const dtoKey in dto) {
				if (dto[dtoKey]) account[dtoKey] = dto[dtoKey];
			}
			if (dto.nickname !== undefined) {
				account.nickname = dto.nickname;
			}
			if (dto.server !== undefined) {
				account.server = dto.server;
			}
			if (dto.port !== undefined) {
				account.port = dto.port;
			}
			if (dto.version !== undefined) {
				account.version = dto.version;
			}
			if (dto.version !== undefined) {
				account.version = dto.version;
			}
			if (dto.whiteList !== undefined) {
				account.whiteList = dto.whiteList;
			}
			if (dto.autoReconnect.timeout !== undefined) {
				account.autoReconnect.timeout = dto.autoReconnect.timeout;
			}
			if (dto.autoReconnect.script !== undefined) {
				account.autoReconnect.script = dto.autoReconnect.script;
			}
			if (!account.autoReconnect.script) account.autoReconnect.enable = false;

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
					account[dtoKey] = dto[dtoKey];
				}
			}
			this.JSONController.saveJSON(accounts);
		}
	}
}

export const inMemoryAccountRepository = new InMemoryAccountRepository(JSONControllerAccountImpl);