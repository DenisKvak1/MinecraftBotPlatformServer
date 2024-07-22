export interface IWalkService {
    goto(id: string, x: number, y: number, z: number): void;

    forwardStart(id: string): void;
    backwardStart(id: string): void;
    leftStart(id: string): void;
    rightStart(id: string): void;

    forwardStop(id: string): void;
    backwardStop(id: string): void;
    leftStop(id: string): void;
    rightStop(id: string): void;

    stopMovement(id: string): void;

    jump(id: string):void
}
