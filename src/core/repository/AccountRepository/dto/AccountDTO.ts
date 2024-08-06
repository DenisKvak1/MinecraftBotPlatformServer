export type CreateAccountDTO = {
    nickname: string,
    port: number,
    server: string
    version: string,
    whiteList?: string[]
}
export type AccountUpdateDTO = {
    port?: number,
    server?: string
    version?: string,
    whiteList?: string[]
}