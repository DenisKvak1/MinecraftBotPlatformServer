import { HeadRotateDirection } from '../../services/HeadService';
import { AccountModel } from '../../../core/model/AccountModel';
import { MovementDirection } from '../../services/WalkService';
import { Item } from 'prismarine-item';
import { toggle } from '../../../../env/types';
import { BotProfile } from '../../../core/config';

export type IncomingMessage<T = any> = {
	command: UNIVERSAL_COMMAND_LIST
	botID: string
	data?: T
}
export type OutgoingReplayMessage<T = any> = {
	command: UNIVERSAL_COMMAND_LIST
	botID: string
	status: STATUS
	errorMessage?: errorMessage
	data?: T
}
export type errorMessage = string

export enum STATUS {
	SUCCESS = 'success',
	ERROR = 'error',
}

export type IncomingCreateBotMessage = IncomingMessage<{
	nickname: string,
	server: string,
	port: number,
	version: string,
}>
export type IncomingDeleteBotMessage = IncomingMessage
export type IncomingUpdateBotOptionsMessage = IncomingMessage<{
	profile: BotProfile,
	server?: string,
	port?: number,
	version?: string,
}>
export type IncomingConnectBotMessage = IncomingMessage<{
	action: 'CONNECT' | 'DISCONNECT'
}>
export type IncomingSendChatMessageMessage = IncomingMessage<{
	message: string
}>
export type IncomingAttackMessage = IncomingMessage
export type IncomingToggleClickerMessage = IncomingMessage<{
	action: toggle
	type: 'ATTACK' | 'USEITEM',
	interval: number
}>
export type IncomingToggleFoodMessage = IncomingMessage<{
	action: toggle
}>
export type IncomingToggleFarmMessage = IncomingMessage<{
	action: toggle
}>
export type IncomingRotateHeadMessage = IncomingMessage<{
	action: toggle
	direction: HeadRotateDirection,
}>
export type IncomingMovementBotMessage = IncomingMessage<{
	action: toggle,
	direction: MovementDirection,
}>
export type IncomingSetHotBarSlotMessage = IncomingMessage<{
	slotIndex: number
}>
export type IncomingActivateSlotMessage = IncomingMessage<{
	slotIndex: number
}>
export type IncomingDropSlotMessage = IncomingMessage<{
	slotIndex: number
}>
export type IncomingDropAllSlotMessage = IncomingMessage
export type IncomingGotoMessage = IncomingMessage<{
	x: number,
	y: number,
	z: number
}>
export type IncomingClickWindowMessage = IncomingMessage<{
	slotIndex: number
}>
export type IncomingGetBotsMessage = IncomingMessage
export type IncomingJumpBotMessage = IncomingMessage
export type IncomingGetBotInfoIDMessage = IncomingMessage<{
	id: string
}>
export type IncomingGetBotInfoNameMessage = IncomingMessage<{
	name: string
}>
export type OutgoingGetBotInfoMessage = OutgoingReplayMessage<{
	account: AccountModel
}>
export type OutgoingGetBotsInfoMessage = OutgoingReplayMessage<{
	accounts: AccountModel[]
}>
export type IncomingGetSlotsMessage = IncomingMessage
export type OutgoingCaptchaMessage = {
	command: OUTGHOING_COMMAND_LIST.LOAD_CAPTCHA
	id: string,
	imageBuffer: Buffer
}
export type OutgoingConnectingBotMessage = {
	command: OUTGHOING_COMMAND_LIST.CONNECTING_BOT
	id: string,
	state: 'CONNECT' | 'DISCONNECT' | 'SPAWN'
}
export type OutgoingActionWindowBotMessage = {
	command: OUTGHOING_COMMAND_LIST.WINDOW
	id: string,
	action: "OPEN" | "CLOSE"
	items?: (Item | null)[]
}
export type OutgoingChatBotMessage = {
	command: OUTGHOING_COMMAND_LIST.CHAT_MESSAGE
	id: string,
	message: string
}
export type OutgoingGetSlotsReplayMessage = OutgoingReplayMessage<{
	slots?: (Item | null)[],
	selectedSlot: number
}>
export type OutgoingCreateBotReplayMessage = OutgoingReplayMessage<{
	account: AccountModel
}>
export type OutgoingInventoryUpdateBotMessage = {
	command: OUTGHOING_COMMAND_LIST.INVENTORY_UPDATE
	id: string,
	index: number,
	item: {
		name: string
		count: number
	} | null
}
export type OutgoingChangePositionBotMessage = {
	command: OUTGHOING_COMMAND_LIST.POSITION_BOT
	id: string,
	pos: {
		x: number,
		y: number,
		z: number
	}
}
export type OutgoingBotDamageMessage = {
	command: OUTGHOING_COMMAND_LIST.DAMAGE
	id: string
}
export type OutgoingBotDeathMessage = {
	command: OUTGHOING_COMMAND_LIST.DEATH
	id: string
}

export enum UNIVERSAL_COMMAND_LIST {
	CREATE_BOT = 'CREATE_BOT',
	DELETE_BOT = 'DELETE_BOT',
	GET_BOT_ID = 'GET_BOT_ID',
	GET_BOT_NAME = 'GET_BOT_NAME',
	GET_BOTS = 'GET_BOTS',
	UPDATE_BOT_OPTIONS = 'UPDATE_UPDATE_BOT_OPTIONS',
	CONNECT_DISCONNECT_BOT = 'CONNECT_DISCONNECT__BOT',
	SEND_CHAT_MESSAGE = 'SEND_CHAT_MESSAGE',
	ATTACK = 'ATTACK',
	TOGGLE_CLICKER = 'TOGGLE_CLICKER',
	TOGGLE_FOOD = 'TOGGLE_FOOD',
	TOGGLE_FARM = 'TOGGLE_FARM',
	ROTATE_HEAD = 'ROTATE_HEAD',
	SET_HOTBAR_SLOT = 'SET_HOTBAR_SLOT',
	DROP_SLOT = 'DROP_SLOT',
	DROP_ALL_SLOT = 'DROP_ALL_SLOT',
	GOTO = 'GOTO',
	MOVEMENT_BOT = 'MOVEMENT_BOT',
	JUMP_BOT = 'JUMP_BOT',
	CLICK_WINDOW = 'CLICK_WINDOW',
	GET_INVENTORY_SLOTS = 'GET_INVENTORY_SLOTS',
	ACTIVATE_SLOT = 'ACTIVATE_SLOT'
}

export enum OUTGHOING_COMMAND_LIST {
	CONNECTING_BOT = 'CONNECTING_BOT',
	WINDOW = 'WINDOW',
	CHAT_MESSAGE = 'CHAT_MESSAGE',
	POSITION_BOT = 'POSITION_BOT',
	LOAD_CAPTCHA = 'LOAD_CAPTCHA',
	INVENTORY_UPDATE = 'INVENTORY_UPDATE',
	DAMAGE = 'DAMAGE',
	DEATH = 'DEATH'
}