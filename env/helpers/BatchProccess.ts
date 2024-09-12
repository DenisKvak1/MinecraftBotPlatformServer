export class BatchProccess<T> {
	private items: T[] = [];
	private timeout: NodeJS.Timeout

	constructor(
		private callback: (items: T[]) => void,
		private timeoutValue: number,
	) {
	}

	push(item: T) {
		if (this.items.length === 0) {
			this.timeout = setTimeout(() => {
				this.callback(this.items);
				this.items = [];
			}, this.timeoutValue);
		}
		this.items.push(item);
	}

	undo(){
		clearInterval(this.timeout)
		this.items = []
	}
}