const edibleItems = [
	'apple',
	'bread',
	'cooked_beef',
	'cooked_chicken',
	'cooked_porkchop',
	'golden_apple',
	'melon',
	'porkchop',
	'potato',
	'baked_potato',
	'pumpkin_pie',
	'steak',
	'suspicious_stew',
	'sweet_berries',
	'rabbit_stew',
	'beetroot_soup',
];

export function isEdible(itemName: string): boolean {
	return edibleItems.includes(itemName);
}