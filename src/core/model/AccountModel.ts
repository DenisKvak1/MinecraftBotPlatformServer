export type AccountModel = {
    id: string
    nickname: string,
    server: string,
    version: string,
    port: number,
}
export type ClientAccountModel = AccountModel & {
    status: BotStatus
}

export enum BotStatus {
    CONNECT= "CONNECT",
    DISCONNECT = "DISCONNECT",
}