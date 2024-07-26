import {AccountModel} from "../../model/AccountModel";
import {IClientBot} from "../../service/ClientBot";

export interface ClientBotRepository {
    create(dto: AccountModel): IClientBot
    delete(id: string): void
    getAll(): IClientBot[]
    getById(id: string): IClientBot | undefined
    getByName(name: string): IClientBot | undefined
}