import { IObservable, Subscribe } from '../../../env/helpers/observable';
import { Window } from 'prismarine-windows'
import { GeneralizedItem } from '../../../env/types';
import { WindowEvent } from './ClientBot';

export interface IWindowService {
	onWindowEvent: (id: string, callback: (windowEvent: WindowEvent) => void) => Subscribe;

	getCurrentWindow(id: string): Window | null
	click(id: string, slot: number, mode?: number): Promise<void>;
	closeWindow(id: string): void
}
