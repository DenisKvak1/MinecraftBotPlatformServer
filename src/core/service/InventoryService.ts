import { InventoryUpdateDTO } from './ClientBot';
import { Subscribe } from '../../../env/helpers/observable';
import { GeneralizedItem } from '../../../env/types';
import {Experience} from "mineflayer";

export interface IInventoryService {
	setHotBarSlot(id: string, slot: number): void;
	useSlot(id: string, slotID: number): void;
	activate(id: string): Promise<void>;
	dropSlot(id: string, slot: number): void;
	dropAll(id: string): Promise<void>;
	getSlots(id: string): {slots: (GeneralizedItem | null)[], selectedSlot: number}
	onUpdateSlot(id: string, callback: (dto: InventoryUpdateDTO) => void): Subscribe
	getExp(id: string): Promise<Experience>
	onExperienceUpdate(id: string, callback: (experienceInfo: Experience) => void): Subscribe
}