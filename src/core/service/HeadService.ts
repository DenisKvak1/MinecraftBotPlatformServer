export interface IHeadService {
	startUpRotate(id: string): void;
	startDownRotate(id: string): void;
	startRightRotate(id: string): void;
	startLeftRotate(id: string): void;
	stopRotate(id: string): void;

	stopRotateUp(id: string): void;
	stopRotateDown(id: string): void;
	stopRotateRight(id: string): void;
	stopRotateLeft(id: string): void;
}
