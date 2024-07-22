import {AccountUpdateDTO, CreateAccountDTO} from "./dto/AccountDTO";
import { AccountModel } from '../../model/AccountModel';

export type AccountRepository = {
    create(dto: CreateAccountDTO): Promise<AccountModel>;
    getByID(id: string): Promise<AccountModel> | undefined;
    getByName(string: string): Promise<AccountModel> | undefined;
    update(id: string, dto: AccountUpdateDTO): void
    updateByName(string: string, dto: AccountUpdateDTO): void
    getAll(): Promise<AccountModel[]>;
    deleteByID(id: string): void;
    deleteByName(string: string): void;
}
