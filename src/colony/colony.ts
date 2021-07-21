import _ from "lodash";
import { getObjectById } from "../ahead/utils";
import { Drone } from "../drone";
import { Tasks } from "../tasks";

declare global {
    interface Game {
        colonies: { [name: string]: Colony };
    }

    interface Memory {
        colonies: { [name: string]: ColonyMemory };
    }

    interface ColonyMemory {
        level: number;
        [prop: string]: any;
    }
}

export class Colony {
    public name: string;
    public colony: Colony;
    public memory: ColonyMemory;

    public room: Room;
    public pos: RoomPosition;
    public level: number;

    public controller: StructureController;

    public structures: { [structureType: string]: Structure[] };
    public extensions: StructureExtension[];
    public sources: Source[];
    public containers: StructureContainer[];
    public spawns: StructureSpawn[];
    public towers: StructureTower[];
    public storage?: StructureStorage;

    public constructionSites: ConstructionSite[];
    public repairables: Structure[];

    public drones: Drone[];
    private _dronesByRole: { [role: string]: Drone[] };
    private _dronesByAssignment: { [id: string]: Drone[] };
    public hostiles: Creep[];

    public constructor(roomName: string) {
        this.name = roomName;
        this.colony = this;

        if (!Memory.colonies[this.name]) {
            Memory.colonies[this.name] = { level: 0 };
        }
        this.memory = Memory.colonies[this.name];

        this.room = Game.rooms[roomName];
        if (!this.room.controller)
            throw new Error(`The room "${this.room.name}" used to build the colony "${this.name}" does not have a controller`);

        this.controller = this.room.controller;
        this.pos = this.controller.pos;

        this.structures = _.groupBy(this.room.find(FIND_STRUCTURES), (s) => s.structureType);
        this.extensions = this.structuresByType(STRUCTURE_EXTENSION) as StructureExtension[];
        this.containers = this.structuresByType(STRUCTURE_CONTAINER) as StructureContainer[];
        this.spawns = this.structuresByType(STRUCTURE_SPAWN) as StructureSpawn[];
        this.towers = this.structuresByType(STRUCTURE_TOWER) as StructureTower[];
        this.storage = this.room.storage;

        this.sources = this.room.find(FIND_SOURCES);

        this.constructionSites = this.room.find(FIND_CONSTRUCTION_SITES);
        this.repairables = _.filter(_.flatten(_.values(this.structures)), (s) => s.structureType !== STRUCTURE_WALL && s.hits < s.hitsMax);

        this.drones = _.filter(_.values(Game.drones), (drone) => drone.memory.colony === this.name) as Drone[];
        this._dronesByRole = _.groupBy(this.drones, (drone) => drone.memory.role) as { [role: string]: Drone[] };
        this._dronesByAssignment = _.groupBy(this.drones, (drone) => drone.memory.assignment) as { [id: string]: Drone[] };
        this.hostiles = this.room.find(FIND_HOSTILE_CREEPS);

        if (!this.memory.level || Game.time % 10 === 0)
            this.memory.level = this.evaluate();
        this.level = this.memory.level;

        this.init();
    }

    public init(): void {
        for (const source of this.sources) {
            const container = source.pos.findClosestByRange(source.pos.findInRange(this.containers, 2));
            const containerSite = source.pos.findClosestByRange(_.filter(source.pos.findInRange(this.constructionSites, 2), (s) => s.structureType === STRUCTURE_CONTAINER));
            if (!(container || containerSite)) {
                if (Game.time % 100 === 0) console.log(`There is no output for source ${source.id}!`);
                const miners = _.filter(source.pos.findInRange(this.drones, 1), (drone) => drone.role === "miner" && drone.memory.assignment === source.id);
                if (miners[0]) {
                    console.log(`Construction site for output placed for source ${source.id}.`);
                    this.room.createConstructionSite(miners[0].pos, STRUCTURE_CONTAINER);
                }
            }
            if (this.dronesByAssignment(source.id).length < Math.min(3, source.pos.availableNeighbours(true).length)) {
                this.spawnDrone("miner", [WORK, WORK, CARRY, MOVE], source.id);
            }
        }
    }

    public run(): void {
        this.checkPopulation();
        for (const tower of this.towers) {
            this.handleTower(tower);
        }
        for (const miner of this.dronesByRole("miner")) {
            if (miner.isIdle)
                this.handleMiner(miner);
        }
        for (const hauler of this.dronesByRole("hauler")) {
            if (hauler.isIdle)
                this.handleHauler(hauler);
        }
        for (const worker of this.dronesByRole("worker")) {
            if (worker.isIdle)
                this.handleWorker(worker);
        }

        _.forEach(this.drones, (drone) => drone.run());
    }

    public structuresByType(structureType: StructureConstant): Structure[] {
        return this.structures[structureType] || [];
    }

    public dronesByRole(role: string): Drone[] {
        return this._dronesByRole[role] || [];
    }

    public dronesByAssignment(assignment: Id<any>): Drone[] {
        return this._dronesByAssignment[assignment] || [];
    }

    private evaluate(): number {
        if (this.containers.length < this.sources.length) return 1;
        if (!this.storage) return 2;
        if (this.controller.level < 8) return 3;
        return 4;
    }

    private spawnDrone(role: string, body: BodyPartConstant[], assignment?: Id<any>): ScreepsReturnCode {
        const newName = `${role}_${Game.time}`;
        if (this.spawns.length > 0) {
            return this.spawns[0].spawnCreep(body, newName, {
                memory: {
                    colony: this.name,
                    assignment: assignment || "" as Id<any>,
                    role: role,
                    task: null
                }
            });
        }

        return ERR_NOT_FOUND;
    }

    private handleTower(tower: StructureTower): void {
        if (tower.store[RESOURCE_ENERGY] <= 0) return;
        const attackTarget = tower.pos.findClosestByRange(this.hostiles);
        if (attackTarget) {
            tower.attack(attackTarget);
            return;
        }
        const healTarget = tower.pos.findClosestByRange(_.filter(this.drones, (d) => d.hits < d.hitsMax));
        if (healTarget) {
            tower.heal(healTarget.creep);
            return;
        }
        const repairTarget = tower.pos.findClosestByRange(_.filter(this.repairables, (s) => s.hits < 0.9 * s.hitsMax));
        if (repairTarget) {
            tower.repair(repairTarget);
            return;
        }
    }

    private handleMiner(miner: Drone): void {
        const source = getObjectById<Source>(miner.memory.assignment);
        if (miner.store[RESOURCE_ENERGY] <= 0) {
            if (source) {
                miner.task = Tasks.harvest(source);
            } else {
                console.log(`Miner ${miner.name} does not have a source assignment; manual assignment needed.`);
            }
        } else {
            const container = miner.pos.findClosestByRange(source ? source.pos.findInRange(this.containers, 1) : []) ||
                miner.pos.findClosestByRange(miner.pos.findInRange(this.containers, 2));
            if (container) {
                miner.task = Tasks.transfer(container);
                return;
            }
            const containerSite = miner.pos.findClosestByRange(_.filter(miner.pos.findInRange(this.constructionSites, 2), (s) => s.structureType === STRUCTURE_CONTAINER));
            if (containerSite) {
                miner.task = Tasks.build(containerSite);
                return;
            }
            if (this.dronesByRole("hauler").length > 0)
                miner.task = Tasks.drop(miner.pos);
        }
    }

    private handleHauler(hauler: Drone): void {
        if (hauler.store[RESOURCE_ENERGY] <= 0) {
            const energyDrops = _.filter(this.room.find(FIND_DROPPED_RESOURCES), (d) => d.resourceType === RESOURCE_ENERGY);
            const drop = hauler.pos.findClosestByRange(_.filter(energyDrops, (c) => c.amount > 0));
            if (drop) {
                hauler.task = Tasks.pickup(drop);
                return;
            }
            const container = hauler.pos.findClosestByRange(_.filter(this.containers, (c) => c.store[RESOURCE_ENERGY] > 0.5 * hauler.store.getFreeCapacity())) ||
                hauler.pos.findClosestByRange(_.filter(this.containers, (c) => c.store[RESOURCE_ENERGY] > 0));
            if (container) {
                hauler.task = Tasks.withdraw(container);
                return;
            }
        } else {
            const refillTargets = _.filter(_.compact([...this.spawns, ...this.extensions]), (s) => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            const target = hauler.pos.findClosestByRange(refillTargets) || hauler.pos.findClosestByRange(_.filter(this.towers, (t) => t.store.getFreeCapacity(RESOURCE_ENERGY) > 0));
            if (target) {
                hauler.task = Tasks.transfer(target);
            } else if (this.storage) {
                hauler.task = Tasks.transfer(this.storage);
            }
        }
    }

    private handleWorker(worker: Drone): void {
        if (worker.store[RESOURCE_ENERGY] <= 0) {
            const container = worker.pos.findClosestByRange(_.filter(this.containers, (c) => c.store[RESOURCE_ENERGY] > 0.5 * worker.store.getFreeCapacity())) ||
                worker.pos.findClosestByRange(_.filter(this.containers, (c) => c.store[RESOURCE_ENERGY] > 0));
            if (container) {
                worker.task = Tasks.withdraw(container);
            } else if (this.storage) {
                worker.task = Tasks.withdraw(this.storage);
            }
        } else {
            if (this.controller.level < 2 || this.controller.ticksToDowngrade < 1000) {
                worker.task = Tasks.upgrade(this.controller);
                return;
            }

            const repairTarget = worker.pos.findClosestByRange(_.filter(this.repairables, (s) => s.hits < 0.9 * s.hitsMax));
            if (repairTarget) {
                worker.task = Tasks.repair(repairTarget);
                return;
            }

            const buildTarget = worker.pos.findClosestByRange(this.constructionSites);
            if (buildTarget) {
                worker.task = Tasks.build(buildTarget);
                return;
            }

            worker.task = Tasks.upgrade(this.controller);
        }
    }

    private checkPopulation(): void {
        if (this.dronesByRole("hauler").length < 1) {
            this.spawnDrone("hauler", [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE]);
            return;
        }
        if (this.containers.length > 0) {
            if (this.dronesByRole("worker").length < 4) {
                this.spawnDrone("worker", [WORK, CARRY, MOVE], this.controller.id);
                return;
            }
        }
    }
}
