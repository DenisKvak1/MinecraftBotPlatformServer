import { Observable } from './observable';
import { GeneralizedItem } from '../types';

export class UpdateSlotBatchProccess{
	$update = new Observable<{
		id: string,
		newItems: GeneralizedItem[]
	}>()
	private items:GeneralizedItem[] = []
	private intervalID: NodeJS.Timeout
	private botID: string

	constructor(id: string) {
		this.botID = id
		this.init()
	}

	private init(){
		this.intervalID = setInterval(()=>{
			if(this.items.length === 0) return
			this.$update.next({
				id: this.botID,
				newItems: this.items,
			})
			this.items = []
		}, 300)
	}

	add(data: {newItem: GeneralizedItem | null}): void{
		this.items.push(data.newItem)
	}

	destroy(){
		clearInterval(this.intervalID)
	}
}
