import { Item } from 'prismarine-item';
import { GeneralizedItem } from '../types';
import { parseEnv } from 'node:util';

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
	};

	if (((nbt?.value as any)?.display)) {
		const nbtLore = nbt.value;
		const { customName, customLore } = parseNBT(nbtLore as any);
		newItem.customName = customName;
		newItem.customLore = customLore;
	}

	return newItem;
};

type NBTData = {
	display: {
		type: string;
		value: {
			Name: {
				type: string;
				value: string;
			};
			Lore: {
				type: string;
				value: {
					type: string;
					value: string[];
				};
			};
		};
	};
};

type ParsedNBTData = {
	customName: string;
	customLore: string;
};

function parseNBT(nbtData: NBTData): ParsedNBTData {
	let customNameParts: any;
	let customName: any;
	let customLoreParts: any;

	if (nbtData.display.value.Name) {
		const nameData = JSON.parse(nbtData.display.value.Name.value);
		if (Array.isArray(nameData.extra)) {
			customName = nameData.extra.map((part: { text: string }) => part.text).join('');
		} else if (typeof nameData.text === 'string') {
			customName = nameData.text;
		}
	}

	if (nbtData.display.value.Lore) {
		customLoreParts = nbtData.display.value.Lore.value.value.map(loreEntry => {
			const loreData = JSON.parse(loreEntry);
			if (Array.isArray(loreData.extra)) {
				return loreData.extra.map((part: { text: string }) => part.text).join('');
			} else if (typeof loreData.text === 'string') {
				return loreData.text;
			}
			return '';
		});
	}

	return {
		customName: customName || '',
		customLore: customLoreParts?.join('\n') || '',
	};
}