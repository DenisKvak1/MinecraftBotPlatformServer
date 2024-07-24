import { IObservable, Subscribe } from '../../../env/helpers/observable';
import { Item } from 'prismarine-item';
import { Window } from 'prismarine-windows'

export interface IWindowService {
	onOpenWindow: (id: string, callback: (slots: (Item | null)[]) => void) => Subscribe;
	onCloseWindow: (id: string, callback: Function) => Subscribe

	getCurrentWindow(id: string): Window | null
	click(id: string, slot: number): Promise<void>;
}
