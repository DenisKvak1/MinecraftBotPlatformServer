import { IObservable } from '../../../env/helpers/observable';
import { toggle, toggleInfo } from '../../../env/types';

export interface IAutoBuyService {
	$ab: IObservable<{id: string, action: toggle}>
	startAutoBuySystem(botIds: string[]): Promise<void>
	stopAutoBuySystem(botIds: string[]): Promise<void>
	startAutoBuy(id: string): void
	stopAutoBuy(id: string): void
	getAutoBuyState(id: string): toggleInfo
}