import { Subscribe } from './observable';

export function nodeIntervalToSubscribe(timeout: NodeJS.Timeout): Subscribe{
	return {
		unsubscribe: ()=>{
			clearInterval(timeout)
		}
	}
}