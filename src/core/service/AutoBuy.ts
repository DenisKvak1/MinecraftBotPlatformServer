import { IObservable } from '../../../env/helpers/observable';
import { toggle, toggleInfo } from '../../../env/types';

export interface IAutoBuyService {
	$ab: IObservable<{id: string, action: toggle}>
	startAutoBuySystem(botIds: string[]): Promise<number>
	stopAutoBuySystem(massId: number): Promise<void>
	addToAutoBuySystem(massId: number, botId: string): Promise<void>
	deleteMassAutoBuyBot(massId: number, botId: string): Promise<void>
	getAutoBuyState(id: string): toggleInfo
}