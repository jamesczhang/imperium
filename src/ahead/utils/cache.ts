declare global {
    interface CPosition {
        x: number;
        y: number;
        roomName: string;
    }
}

export function getObjectById<T>(id: Id<T> | undefined): T | null {
    return id ? Game.getObjectById(id) : null;
}

export function constructPosition(pos: CPosition): RoomPosition {
    return new RoomPosition(pos.x, pos.y, pos.roomName);
}
