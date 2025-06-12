export type IObservable<T> = {
	subscribe: (callback: (eventData: T) => void) => Subscribe;
	next: (eventData?: T) => void;
	unsubscribeAll: () => void;
	getValue: () => T;
	setValue: (value: T) => void;
	once: (callback: (eventData?: T) => void, condition?: (eventData?: T) => boolean) => Subscribe;
	await(condition?: (eventData?: T) => boolean): Promise<T>
};

export type Subscribe = { unsubscribe: () => void };

export class Observable<T> implements IObservable<T> {
	private listeners: ((eventData: T) => void)[];
	private onceListeners: { callback: (eventData: T) => void; condition?: (eventData: any) => boolean }[];
	private value: T;

	constructor(startValue?: T) {
		this.value = startValue;
		this.listeners = [];
		this.onceListeners = [];
	}

	subscribe(callback: (eventData?: T) => void): Subscribe {
		this.listeners.push(callback);

		return {
			unsubscribe: (): void => {
				this.listeners = this.listeners.filter(listener => listener !== callback);
			},
		};
	}

	next(eventData?: T): void {
		this.value = eventData;
		this.listeners.forEach(listener => {
			listener(eventData);
		});

		const toRemove: number[] = [];

		this.onceListeners.forEach((listener, index) => {
			const { callback, condition } = listener;
			if (!condition || condition(eventData)) {
				callback(eventData);
				toRemove.push(index);
			}
		});

		this.onceListeners = this.onceListeners.filter((_, index) => !toRemove.includes(index));
	}

	once(callback: (eventData?: T) => void, condition?: (eventData?: T) => boolean): Subscribe {
		this.onceListeners.push({ callback, condition });

		return {
			unsubscribe: (): void => {
				this.onceListeners = this.onceListeners.filter(listener => listener.callback !== callback);
			},
		};
	}

	getValue() {
		return this.value;
	}

	setValue(value: T) {
		this.value = value;
	}

	await(condition?: (eventData?: T) => boolean): Promise<T> {
		const currentValue = this.getValue();
		if ((condition && condition(currentValue)) || (!condition && currentValue !== undefined)) {
			return Promise.resolve(currentValue);
		}

		return new Promise<T>((resolve) => {
			const unsubscribe = this.once((value) => {
				resolve(value!);
			}, condition);
		});
	}

	unsubscribeAll(): void {
		this.listeners = [];
	}
}
