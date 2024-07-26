import { IObservable } from '../../../env/helpers/observable';
import { toggle, toggleInfo } from '../../../env/types';

export interface IFarmService {
	$farm: IObservable<{id: string, action: toggle}>
	getFarmState(id: string): toggleInfo
	startFarm(id: string): void
	stopFarm(id: string): void
}