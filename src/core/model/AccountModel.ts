export type AccountModel = {
    id: string
    nickname: string,
    server: string,
    version: string,
    port: number,
    whiteList: string[]
}
export type ClientAccountModel = AccountModel & {
    status: BotStatus
}

export enum BotStatus {
    CONNECT= "CONNECT",
    DISCONNECT = "DISCONNECT",
}