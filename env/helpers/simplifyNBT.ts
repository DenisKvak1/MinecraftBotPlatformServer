export function simplifyNBT(nbt: any): any {
	if (nbt == null || typeof nbt !== 'object') return nbt;

	if ('type' in nbt && 'value' in nbt) {
		return simplifyNBT(nbt.value);
	}

	if (Array.isArray(nbt)) {
		return nbt.map(simplifyNBT);
	}

	const result: Record<string, any> = {};
	for (const [key, value] of Object.entries(nbt)) {
		result[key] = simplifyNBT(value);
	}

	return result;
}