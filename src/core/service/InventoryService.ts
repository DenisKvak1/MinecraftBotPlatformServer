import { InventoryUpdateDTO } from './ClientBot';
import { Subscribe } from '../../../env/helpers/observable';
import { GeneralizedItem } from '../../../env/types';

export interface IInventoryService {
	setHotBarSlot(id: string, slot: number): void;
	useSlot(id: string, slotID: number): void;
	dropSlot(id: string, slot: number): void;
	dropAll(id: string): void;
	getSlots(id: string): {slots: (GeneralizedItem | null)[], selectedSlot: number}
	onUpdateSlot(id: string, callback: (dto: InventoryUpdateDTO) => void): Subscribe
}