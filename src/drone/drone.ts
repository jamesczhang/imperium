import _ from "lodash";
import { Colony } from "../colony";
import { Task, Tasks } from "../tasks";

declare global {
    interface Game {
        drones: { [name: string]: Drone };
    }

    interface CreepMemory {
        colony: string;
        assignment: Id<any>;
        role: string;
        task: CTask | null;
    }
}

export class Drone {
    public creep: Creep;
    public name: string;

    public body: BodyPartDefinition[];
    public fatigue: number;
    public hits: number;
    public hitsMax: number;
    public id: Id<Creep>;
    public memory: CreepMemory;
    public pos: RoomPosition;
    public role: string;
    public room: Room;
    public spawning: boolean;
    public saying: string;
    public store: StoreDefinition;
    public ticksToLive: number | undefined;

    public _task: Task | null;

    public constructor(creep: Creep) {
        this.creep = creep;
        this.name = creep.name;

        this.body = creep.body;
        this.fatigue = creep.fatigue;
        this.hits = creep.hits;
        this.hitsMax = creep.hitsMax;
        this.id = creep.id;
        this.memory = creep.memory;
        this.pos = creep.pos;
        this.role = creep.memory.role;
        this.room = creep.room;
        this.spawning = creep.spawning;
        this.saying = creep.saying;
        this.store = creep.store;
        this.ticksToLive = creep.ticksToLive;
        this._task = null;
    }

    public get colony(): Colony {
        return Game.colonies[this.memory.colony];
    }

    public get task(): Task | null {
        if (!this._task) {
            const _task = this.memory.task;
            if (_task) {
                return Tasks.instantiate(_task);
            } else {
                return null;
            }
        }
        return this._task;
    }

    public set task(task: Task | null) {
        this.memory.task = task ? task.proto : null;
        if (task) {
            task.drone = this;
            this._task = task;
        }
    }

    public get isIdle(): boolean {
        return this.task == null || !this.task.isValid();
    }

    public attack(target: AnyCreep | Structure): CreepActionReturnCode {
        return this.creep.attack(target);
    }

    public attackController(target: StructureController): CreepActionReturnCode {
        return this.creep.attackController(target);
    }

    public build(target: ConstructionSite): CreepActionReturnCode | ERR_NOT_ENOUGH_RESOURCES | ERR_RCL_NOT_ENOUGH {
        return this.creep.build(target);
    }

    public cancelOrder(methodName: string): OK | ERR_NOT_FOUND {
        return this.creep.cancelOrder(methodName);
    }

    public claimController(target: StructureController): CreepActionReturnCode | ERR_FULL | ERR_GCL_NOT_ENOUGH {
        return this.creep.claimController(target);
    }

    public dismantle(target: Structure): CreepActionReturnCode {
        return this.creep.dismantle(target);
    }

    public drop(resourceType: ResourceConstant, amount?: number): OK | ERR_NOT_OWNER | ERR_BUSY | ERR_NOT_ENOUGH_RESOURCES {
        return this.creep.drop(resourceType, amount);
    }

    public generateSafeMode(target: StructureController): CreepActionReturnCode {
        return this.creep.generateSafeMode(target);
    }

    public getActiveBodyParts(type: BodyPartConstant): number {
        return this.creep.getActiveBodyparts(type);
    }

    public getBodyParts(type: BodyPartConstant): number {
        return (_.filter(this.body, (p) => p.type === type)).length;
    }

    public harvest(target: Source | Mineral | Deposit): CreepActionReturnCode | ERR_NOT_FOUND | ERR_NOT_ENOUGH_RESOURCES {
        return this.creep.harvest(target);
    }

    public heal(target: Drone | AnyCreep): CreepActionReturnCode {
        return this.creep.heal(target instanceof Drone ? target.creep : target);
    }

    public move(direction: DirectionConstant): CreepMoveReturnCode {
        return this.creep.move(direction);
    }

    public moveTo(target: RoomPosition | { pos: RoomPosition }, opts?: MoveToOpts): CreepMoveReturnCode | ERR_NO_PATH | ERR_INVALID_TARGET | ERR_NOT_FOUND {
        return this.creep.moveTo(target, opts);
    }

    public pickup(target: Resource): CreepActionReturnCode | ERR_FULL {
        return this.creep.pickup(target);
    }

    public rangedAttack(target: AnyCreep | Structure): CreepActionReturnCode {
        return this.creep.rangedAttack(target);
    }

    public rangedHeal(target: Drone | AnyCreep): CreepActionReturnCode {
        return this.creep.rangedHeal(target instanceof Drone ? target.creep : target);
    }

    public rangedMassAttack(): OK | ERR_NOT_OWNER | ERR_BUSY | ERR_NO_BODYPART {
        return this.creep.rangedMassAttack();
    }

    public repair(target: Structure): CreepActionReturnCode | ERR_NOT_ENOUGH_RESOURCES {
        return this.creep.repair(target);
    }

    public reserveController(target: StructureController): CreepActionReturnCode {
        return this.creep.reserveController(target);
    }

    public say(message: string, toPublic?: boolean): OK | ERR_NOT_OWNER | ERR_BUSY {
        return this.creep.say(message, toPublic);
    }

    public signController(target: StructureController, text: string): OK | ERR_BUSY | ERR_INVALID_TARGET | ERR_NOT_IN_RANGE {
        return this.creep.signController(target, text);
    }

    public suicide(): OK | ERR_NOT_OWNER | ERR_BUSY {
        return this.creep.suicide();
    }

    public transfer(target: Drone | AnyCreep | Structure, resourceType: ResourceConstant, amount?: number): ScreepsReturnCode {
        return this.creep.transfer(target instanceof Drone ? target.creep : target, resourceType, amount);
    }

    public upgradeController(target: StructureController): ScreepsReturnCode {
        return this.creep.upgradeController(target);
    }

    public withdraw(target: Structure | Tombstone | Ruin, resourceType: ResourceConstant, amount?: number): ScreepsReturnCode {
        return this.creep.withdraw(target, resourceType, amount);
    }

    public park(pos: RoomPosition = this.pos, maintainDistance: boolean = false): ScreepsReturnCode {
        const road = _.find(this.pos.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_ROAD);
        if (!road) return OK;

        let positions = _.sortBy(this.pos.availableNeighbours(), (p) => p.getRangeTo(pos));
        if (maintainDistance) {
            const range = this.pos.getRangeTo(pos);
            positions = _.filter(positions, (p) => p.getRangeTo(pos) <= range);
        }

        for (const position of positions) {
            if (_.find(position.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_ROAD)) continue;
            const terrain = position.lookFor(LOOK_TERRAIN)[0];
            if (terrain !== "swamp") {
                return this.move(this.pos.getDirectionTo(position));
            }
        }

        return this.moveTo(pos);
    }

    public run(): ScreepsReturnCode | void {
        if (this.task) {
            return this.task.run();
        }
    }

    public static bodyCost(body: BodyPartConstant[]): number {
        const partCosts: { [type: string]: number } = {
            [MOVE]: 50,
            [WORK]: 100,
            [CARRY]: 50,
            [ATTACK]: 80,
            [RANGED_ATTACK]: 150,
            [HEAL]: 250,
            [CLAIM]: 600,
            [TOUGH]: 10
        };

        let cost = 0;
        for (const part of body) {
            cost += partCosts[part];
        }
        return cost;
    }
}
