import { IObservable, Subscribe } from '../../../env/helpers/observable';
import { Window } from 'prismarine-windows'
import { GeneralizedItem } from '../../../env/types';

export interface IWindowService {
	onOpenWindow: (id: string, callback: (slots: (GeneralizedItem | null)[]) => void) => Subscribe;
	onCloseWindow: (id: string, callback: Function) => Subscribe

	getCurrentWindow(id: string): Window | null
	click(id: string, slot: number): Promise<void>;
}
