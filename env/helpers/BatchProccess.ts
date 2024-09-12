export class BatchProccess<T> {
	private items: T[] = [];

	constructor(
		private callback: (items: T[]) => void,
		private timeoutValue: number,
	) {
	}

	push(item: T) {
		if (this.items.length === 0) {
			setTimeout(() => {
				this.callback(this.items);
				this.items = [];
			}, this.timeoutValue);
		}
		this.items.push(item);
	}
}