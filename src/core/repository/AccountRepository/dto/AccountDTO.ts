import { BotProfile } from '../../../config';
import { BotStatus } from '../../../model/AccountModel';

export type CreateAccountDTO = {
    nickname: string,
    port: number,
    server: string
    version: string,
    profile?: BotProfile
}
export type AccountUpdateDTO = {
    port?: number,
    server?: string
    version?: string,
    profile?: BotProfile
    status?: BotStatus
}