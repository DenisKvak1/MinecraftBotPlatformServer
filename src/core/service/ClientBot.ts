import { AccountModel, BotStatus } from '../model/AccountModel';
import { Bot } from 'mineflayer';
import { IObservable } from '../../../env/helpers/observable';
import { GeneralizedItem } from '../../../env/types';

export type InventoryUpdateDTO = {
    itemSlot: number
    newItem: GeneralizedItem | null
}
export interface IClientBot{
    _bot: Bot;
    accountModel: AccountModel;
    $status: IObservable<BotStatus>
    $health: IObservable<void>
    $captcha: IObservable<Buffer>
    $disconnect: IObservable<string>
    $spawn: IObservable<null>
    $openWindow: IObservable<GeneralizedItem[]>
    $closeWindow: IObservable<void>
    $chat: IObservable<string>
    $inventoryUpdate: IObservable<InventoryUpdateDTO>
    $death: IObservable<void>
    connect(): void
    disconnect(): void
}
