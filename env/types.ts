export type toggle = "START" | "STOP"
export type toggleInfo = 'ON' | 'OFF'

export type GeneralizedItem = {
	name: string,
	count: number,
	stackSize: number
	displayName: string,

	slot: number
	renamed: boolean
	customName?: string
	customNameHTML?: string,
	customLoreHTML?: string,
	nbt: any | null
}