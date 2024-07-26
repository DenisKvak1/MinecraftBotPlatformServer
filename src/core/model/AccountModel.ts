import { BotProfile } from '../config';
import exp from 'node:constants';

export type AccountModel = {
    id: string
    nickname: string,
    server: string,
    version: string,
    port: number,
    profile: BotProfile
}
export type ClientAccountModel = AccountModel & {
    status: BotStatus
}

export enum BotStatus {
    CONNECT= "CONNECT",
    DISCONNECT = "DISCONNECT",
}