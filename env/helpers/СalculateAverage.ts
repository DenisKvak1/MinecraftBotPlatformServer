export function calculateAverage(array: number[]) {
	if (array.length === 0) return 0;

	const sum = array.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
	return sum / array.length;
}