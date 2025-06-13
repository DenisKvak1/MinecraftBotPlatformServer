import { HeadRotateDirection } from '../../services/HeadService';
import { MovementDirection } from '../../services/WalkService';
import { GeneralizedItem, toggle, toggleInfo } from '../../../../env/types';
import { ClientAccountModel } from '../../../core/model/AccountModel';
import { WindowEvent } from '../../../core/service/ClientBot';
import { BotActions, BotScript } from '../../../core/service/BotScriptService/types';
import { AccountUpdateDTO } from '../../../core/repository/AccountRepository/dto/AccountDTO';
import {Experience} from "mineflayer";
import {OutgoingMessage} from "node:http";

export enum BotFunctions {
	AUTO_FARM = 'AUTO_FARM',
	AUTO_BUY = 'AUTO_BUY',
	AUTO_CLICKER_ATTACK = 'AUTO_CLICKER_ATTACK',
	AUTO_CLICKER_USE = 'AUTO_CLICKER_USE',
	AUTO_FOOD = 'AUTO_FOOD',
}

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
export type OutgoingEventMessage<T = any> = {
	command: OUTGHOING_COMMAND_LIST
	botID: string
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
export type IncomingGetExp = IncomingMessage
export type IncomingDeleteBotMessage = IncomingMessage
export type IncomingUpdateBotOptionsMessage = IncomingMessage<AccountUpdateDTO>
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
export type IncomingToggleAbMessage = IncomingMessage<{
	action: toggle
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
	slotIndex: number,
	mode: number
}>
export type IncomingGetCurrentWindow = IncomingMessage
export type IncomingSaveScriptMessage = IncomingMessage<{
	actions: BotActions,
	name: string
}>
export type IncomingDeleteScriptMessage = IncomingMessage<{
	scriptId: string
}>
export type IncomingGetScriptsMessage = IncomingMessage
export type IncomingGetBotsMessage = IncomingMessage
export type IncomingJumpBotMessage = IncomingMessage
export type IncomingGetBotInfoIDMessage = IncomingMessage<{
	id: string
}>
export type IncomingGetBotInfoNameMessage = IncomingMessage<{
	name: string
}>
export type IncomingGetBotFunctionsStateMessage = IncomingMessage

export type IncomingSubscribeOnBotEventsMessage = IncomingMessage

export type IncomingUnSubscribeOnBotEventsMessage = IncomingMessage

export type OutgoingGetBotInfoMessage = OutgoingReplayMessage<{
	account: ClientAccountModel
}>

export type OutgoingGetScripts = OutgoingReplayMessage<{
	scripts: BotScript[]
}>
export type OutgoingGetExp = OutgoingReplayMessage<Experience>
export type OutgoingExperienceEvent = OutgoingEventMessage<Experience>
export type OutgoingDeleteScript = OutgoingReplayMessage
export type OutgoingSaveScript = OutgoingReplayMessage<{
	script: BotScript
}>

export type OutgoingGetBotsInfoMessage = OutgoingReplayMessage<{
	accounts: ClientAccountModel[]
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
export type OutgoingActionWindowBotMessage = WindowEvent & {
	id: string,
	command: OUTGHOING_COMMAND_LIST.WINDOW
}
export type OutgoingChatBotMessage = {
	command: OUTGHOING_COMMAND_LIST.CHAT_MESSAGE
	id: string,
	message: string
}
export type OutgoingGetCurrentWindowReplayMessage = OutgoingReplayMessage<{
	slots: (GeneralizedItem | null)[]
}>
export type OutgoingGetSlotsReplayMessage = OutgoingReplayMessage<{
	slots: (GeneralizedItem | null)[],
	selectedSlot: number
}>
export type OutgoingGetBotFunctionStatusReplayMessage = OutgoingReplayMessage<{
	functionsStatus: Record<BotFunctions, toggleInfo>
}>
export type OutgoingCreateBotReplayMessage = OutgoingReplayMessage<{
	account: ClientAccountModel
}>
export type OutgoingInventoryUpdateBotMessage = {
	command: OUTGHOING_COMMAND_LIST.INVENTORY_UPDATE
	id: string,
	index: number,
	item: GeneralizedItem | null
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

export type OutgoingBotFunctionsStatusMessage = {
	command: OUTGHOING_COMMAND_LIST.BOT_FUNCTIONS_ACTION,
	id: string,
	type: BotFunctions
	action: toggle
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
	SUBSCRIBE_EVENTS = 'SUBSCRIBE_EVENTS',
	UNSUBSCRIBE_EVENTS = 'UNSUBSCRIBE_EVENTS',
	UPDATE_BOT_OPTIONS = 'UPDATE_UPDATE_BOT_OPTIONS',
	CONNECT_DISCONNECT_BOT = 'CONNECT_DISCONNECT__BOT',
	SEND_CHAT_MESSAGE = 'SEND_CHAT_MESSAGE',
	ATTACK = 'ATTACK',
	TOGGLE_CLICKER = 'TOGGLE_CLICKER',
	TOGGLE_FOOD = 'TOGGLE_FOOD',
	TOGGLE_FARM = 'TOGGLE_FARM',
	TOGGLE_AB = 'TOGGLE_AB',
	GET_BOT_FUNCTIONS_STATUS = 'GET_BOT_FUNCTIONS_STATUS',
	ROTATE_HEAD = 'ROTATE_HEAD',
	SET_HOTBAR_SLOT = 'SET_HOTBAR_SLOT',
	DROP_SLOT = 'DROP_SLOT',
	DROP_ALL_SLOT = 'DROP_ALL_SLOT',
	GOTO = 'GOTO',
	MOVEMENT_BOT = 'MOVEMENT_BOT',
	JUMP_BOT = 'JUMP_BOT',
	CLICK_WINDOW = 'CLICK_WINDOW',
	GET_INVENTORY_SLOTS = 'GET_INVENTORY_SLOTS',
	GET_CURRENT_WINDOW = 'GET_CURRENT_WINDOW',
	ACTIVATE_SLOT = 'ACTIVATE_SLOT',
	GET_SCRIPTS = 'GET_SCRIPTS',
	SAVE_SCRIPT = 'SAVE_SCRIPT',
	DELETE_SCRIPT = 'DELETE_SCRIPT',
	GET_EXP = 'GET_EXP'
}

export enum OUTGHOING_COMMAND_LIST {
	CONNECTING_BOT = 'CONNECTING_BOT',
	WINDOW = 'WINDOW',
	CHAT_MESSAGE = 'CHAT_MESSAGE',
	POSITION_BOT = 'POSITION_BOT',
	LOAD_CAPTCHA = 'LOAD_CAPTCHA',
	INVENTORY_UPDATE = 'INVENTORY_UPDATE',
	BOT_FUNCTIONS_ACTION = 'BOT_FUNCTIONS_ACTION',
	DAMAGE = 'DAMAGE',
	DEATH = 'DEATH',
	EXPERIENCE = 'EXPERIENCE'
}