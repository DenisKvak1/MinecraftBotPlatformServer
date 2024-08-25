import { AccountModel, BotStatus } from '../model/AccountModel';
import { Bot } from 'mineflayer';
import { IObservable } from '../../../env/helpers/observable';
import { GeneralizedItem } from '../../../env/types';

export type InventoryUpdateDTO = {
    itemSlot: number
    newItem: GeneralizedItem | null
}
export type WindowEvent = {
    title?: string,
    action: "OPEN" | "CLOSE" | "UPDATE"
    items?: (GeneralizedItem | null)[]
    slotIndex?: number,
    oldItem?: GeneralizedItem | null
    newItem?: GeneralizedItem | null
}

export interface IClientBot{
    _bot: Bot;
    accountModel: AccountModel;
    $status: IObservable<BotStatus>
    $health: IObservable<void>
    $captcha: IObservable<Buffer>
    $disconnect: IObservable<string>
    $spawn: IObservable<null>
    $window: IObservable<WindowEvent>
    $chat: IObservable<string>
    $inventoryUpdate: IObservable<InventoryUpdateDTO>
    $death: IObservable<void>
    $reconnect: IObservable<void>
    connect(): void
    disconnect(): void
}
