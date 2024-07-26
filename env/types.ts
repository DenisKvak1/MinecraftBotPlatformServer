export type toggle = "START" | "STOP"
export type toggleInfo = 'ON' | 'OFF'

export type GeneralizedItem = {
	name: string,
	count: number,
	displayName: string,

	customName?: string,
	customLore?: string,
}