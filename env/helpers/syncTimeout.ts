export function syncTimeout(delay: number) {
	return new Promise(resolve => setTimeout(resolve, delay));
}