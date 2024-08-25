import { toggle } from '../../../../env/types';

export enum BOT_SCRIPT_ACTIONS {
	GOTO = 'GOTO',
	SEND_CHAT_ESSAGE = 'SEND_CHAT_MESSAGE',
	CLICK_WINDOW = 'CLICK_WINDOW',
	SET_HOTBOR_SLOT = 'SET_HOTBOR_SLOT',
	ACTIVATE_ITEM = 'ACTIVATE_ITEM',
	TOGGLE_AUTOBUY = 'TOGGLE_AUTOBUY',
	TOGGLE_FOOD = 'TOGGLE_FOOD',
	TOGGLE_FARM = 'TOGGLE_FARM',
	TOGGLE_ATTACK_CLICKER ='TOGGLE_ATTACK_CLICKER',
	TOGGLE_USE_CLICKER = 'TOGGLE_USE_CLICKER',
	DROP_SLOT = 'DROP_SLOT',
	SLEEP = 'SLEEP',
	ATTACK = 'ATTACK',
	DISCONNECT = 'DISCONNECT',
	CONNECT = 'CONNECT'
}
export type BotAction<T = any> = {
	command: BOT_SCRIPT_ACTIONS,
	value?: T
}
export type GotoBotAction = BotAction<{
	x: number;
	y: number;
	z: number;
}>;

export type SendChatMessageBotAction = BotAction<{
	message: string;
}>;

export type ClickWindowBotAction = BotAction<{
	slotIndex: number;
}>;

export type SetHotbarSlotBotAction = BotAction<{
	slotIndex: number;
}>;

export type ActivateItemBotAction = BotAction<{}>;

export type ToggleAutobuyBotAction = BotAction<{
	toggle: toggle;
}>;

export type ToggleFoodBotAction = BotAction<{
	toggle: toggle;
}>;
export type ToggleFarmBotAction = BotAction<{
	toggle: toggle;
}>;
export type ToggleUseClickerBotAction = BotAction<{
	intervalTimeout?: number;
	toggle: toggle;
}>;

export type ToggleAttackClickerBotAction = BotAction<{
	intervalTimeout?: number;
	toggle: toggle;
}>;

export type AttackBotAction = BotAction<{}>;

export type DropSlotBotAction = BotAction<{
	slotIndex: number;
}>;

export type SleepBotAction = BotAction<{
	sleepTimeout: number;
}>;
export type ConnectBotAction = BotAction<{}>;

export type DisconnectBotAction = BotAction<{}>;

export type BotActions = BotAction[]

export type BotScript = {
	id: string
	name: string,
	botActions: BotActions
}