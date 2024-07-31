import { Item } from 'prismarine-item';
import { GeneralizedItem } from '../types';
const registry = require('prismarine-registry')('1.20.4')
const ChatMessage = require('prismarine-chat')(registry)

export const ToGeneralizedItems = (items: (Item | null)[]): (GeneralizedItem | null)[] => {
	return items.map((item) => {
		if (item === null) return null;
		return ToGeneralizedItem(item);
	});
};
export const ToGeneralizedItem = (item: Item | null): GeneralizedItem | null => {
	if (item === null) return null;
	const nbt = item.nbt;

	const newItem: GeneralizedItem = {
		name: item.name,
		count: item.count,
		displayName: item.displayName,
		customName: convertCustomNameToString(item.customName),
		customNameHTML: convertCustomNameToString(item.customName, true),
		customLoreHTML: convertCustomLoreToString(item.customLore)
	};


	return newItem;
};
type CustomLore = string | string[] | null;

function convertCustomNameToString(customName: CustomName, HTML: boolean = false): string {
	try {
		if (typeof customName === 'string') {
			const chatMessage = new ChatMessage(JSON.parse(customName));
			return HTML ? chatMessage.toHTML() : chatMessage.toString()
		}
		return '';
	} catch (e) {
		console.error('Ошибка при преобразовании customName:', e);
		return '';
	}
}
type CustomName = string | null;

function convertCustomLoreToString(customLore: CustomLore): string {
	try {
		if (Array.isArray(customLore)) {
			return customLore.map(loreItem => {
				const chatMessage = new ChatMessage(JSON.parse(loreItem));
				return chatMessage.toHTML();
			}).join('<br>');
		} else if (typeof customLore === 'string') {
			const chatMessage = new ChatMessage(JSON.parse(customLore));
			return chatMessage.toHTML();
		}
		return '';
	} catch (e) {
		console.error('Ошибка при преобразовании customLore:', e);
		return '';
	}
}