interface RoomPosition {
    isEdge: boolean;
    neighbours: RoomPosition[];
    print: string;

    availableNeighbours(ignoreCreeps?: boolean): RoomPosition[]
    isPassable(ignoreCreeps?: boolean): boolean;
}

Object.defineProperty(RoomPosition.prototype, "isEdge", {
    configurable: true,
    get(): boolean {
        return this.x === 0 || this.x === 49 || this.y === 0 || this.y === 49;
    }
});

Object.defineProperty(RoomPosition.prototype, "neighbours", {
    configurable: true,
    get(): RoomPosition[] {
        const adjPos: RoomPosition[] = [];
        for (const dx of [-1, 0, 1]) {
            for (const dy of [-1, 0, 1]) {
                if (dx === 0 && dy === 0)
                    continue;
                const x = this.x + dx;
                const y = this.y + dy;
                if (0 < x && x < 49 && 0 < y && y < 49)
                    adjPos.push(new RoomPosition(x, y, this.roomName));
            }
        }
        return adjPos;
    }
});

Object.defineProperty(RoomPosition.prototype, "print", {
    configurable: true,
    get(): string {
        return `<a href="#!/room/${Game.shard.name}/${this.roomName as string}">[${this.roomName as string}, ${this.x as number}, ${this.y as number}]</a>`;
    }
});

RoomPosition.prototype.availableNeighbours = function (ignoreCreeps: boolean = false): RoomPosition[] {
    return _.filter(this.neighbours, (pos) => pos.isPassable(ignoreCreeps));
};

RoomPosition.prototype.isPassable = function (ignoreCreeps = false): boolean {
    if (Game.map.getRoomTerrain(this.roomName).get(this.x, this.y) === TERRAIN_MASK_WALL)
        return false;
    if (!ignoreCreeps && this.lookFor(LOOK_CREEPS).length > 0)
        return false;
    return _.filter(this.lookFor(LOOK_STRUCTURES), (s) => !(s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_ROAD)).length <= 0;
};
