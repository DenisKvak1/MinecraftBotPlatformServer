import { AccountModel } from '../model/AccountModel';
import { Bot } from 'mineflayer';
import { IObservable } from '../../../env/helpers/observable';
import { Item } from 'prismarine-item';

export type InventoryUpdateDTO = {
    itemSlot: number
    newItem: Item | null
}
export interface IClientBot{
    _bot: Bot;
    accountModel: AccountModel;
    $health: IObservable<void>
    $captcha: IObservable<Buffer>
    $disconnect: IObservable<string>
    $spawn: IObservable<null>
    $openWindow: IObservable<Item[]>
    $closeWindow: IObservable<void>
    $chat: IObservable<string>
    $inventoryUpdate: IObservable<InventoryUpdateDTO>
    $death: IObservable<void>
    connect(): void
    disconnect(): void
}
