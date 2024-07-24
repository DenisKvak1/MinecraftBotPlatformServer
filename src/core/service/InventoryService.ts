import { InventoryUpdateDTO } from './ClientBot';
import { Subscribe } from '../../../env/helpers/observable';
import { Item } from 'prismarine-item';

export interface IInventoryService {
	setHotBarSlot(id: string, slot: number): void;
	useSlot(id: string, slotID: number): void;
	dropSlot(id: string, slot: number): void;
	dropAll(id: string): void;
	getSlots(id: string): {slots: (Item | null)[], selectedSlot: number}
	onUpdateSlot(id: string, callback: (dto: InventoryUpdateDTO) => void): Subscribe
}