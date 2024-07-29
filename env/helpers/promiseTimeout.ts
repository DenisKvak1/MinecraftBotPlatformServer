export function PromiseTimeout(delay: number) {
	return new Promise(resolve => setTimeout(resolve, delay));
}