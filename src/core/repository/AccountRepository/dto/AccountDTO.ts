export type CreateAccountDTO = {
    nickname: string,
    port: number,
    server: string
    version: string,
    whiteList?: string[],
    autoReconnect?: {
        enable: boolean,
        timeout: number
        script: string
    }
}
export type AccountUpdateDTO = {
    nickname?: string
    port?: number,
    server?: string
    version?: string,
    whiteList?: string[],
    autoReconnectScript: string
    autoReconnectTimeout: number
}