import _ from "lodash";
import { constructPosition, getObjectById } from "../ahead/utils";
import { Drone } from "../drone";
import { Tasks } from "./tasks";

declare global {
    interface CTask {
        name: string;
        _drone: {
            name: string;
        };
        _target: {
            id: Id<TaskTarget>;
            pos: CPosition;
        };
        _parent: CTask | null;
        opts: TaskOpts;
        data: TaskData;
        tick: number;
    }

    interface TaskSpecs {
        targetRange: number;
        workOffRoad: boolean;
        oneShot: boolean;
    }

    interface TaskOpts {
        blind?: boolean;
        nextPos?: CPosition;
        moveOpts?: MoveToOpts;
    }

    interface TaskData {
        quiet?: boolean;
        resourceType?: ResourceConstant;
        amount?: number;
        signature?: string;
        skipEnergy?: boolean;
    }
}

export interface TaskTarget {
    id: Id<this>;
    pos: RoomPosition;
}

export abstract class Task {
    public static TaskType: string;

    public name: string;
    public tick: number;
    public specs: TaskSpecs;
    public opts: TaskOpts;
    public data: TaskData;

    private _drone: {
        name: string;
    };
    private _target: {
        id: Id<TaskTarget>;
        pos: CPosition;
    };
    private _parent: CTask | null;

    public constructor(taskName: string, target: TaskTarget, opts: TaskOpts = {} as TaskOpts) {
        this.name = taskName;
        this._drone = {
            name: ""
        };
        if (target) {
            this._target = {
                id: target.id,
                pos: target.pos
            };
        } else {
            this._target = {
                id: "" as Id<TaskTarget>,
                pos: {
                    x: -1,
                    y: -1,
                    roomName: ""
                }
            };
        }
        this._parent = null;
        this.specs = {
            targetRange: 1,
            workOffRoad: false,
            oneShot: false
        };
        _.defaults(opts, {
            blind: false,
            moveOptions: {}
        });
        this.tick = Game.time;
        this.opts = opts;
        this.data = {
            quiet: true
        };
    }

    public get proto(): CTask {
        return {
            name: this.name,
            _drone: this._drone,
            _target: this._target,
            _parent: this._parent,
            opts: this.opts,
            data: this.data,
            tick: this.tick
        };
    }

    public set proto(proto: CTask) {
        this._drone = proto._drone;
        this._target = proto._target;
        this._parent = proto._parent;
        this.opts = proto.opts;
        this.data = proto.data;
        this.tick = proto.tick;
    }

    public get drone(): Drone {
        return Game.drones[this._drone.name] as Drone;
    }

    public set drone(drone: Drone) {
        this._drone.name = drone.name;
    }

    public get target(): TaskTarget | null {
        return getObjectById(this._target.id);
    }

    public get targetPos(): RoomPosition {
        if (this.target) {
            this._target.pos = this.target.pos;
        }
        return constructPosition(this._target.pos);
    }

    public get parent(): Task | null {
        return (this._parent ? Tasks.instantiate(this._parent) : null);
    }

    public set parent(parent: Task | null) {
        this._parent = parent ? parent.proto : null;

        if (this.drone) {
            this.drone.task = this;
        }
    }

    public fork(task: Task): Task {
        task.parent = this;
        if (this.drone) {
            this.drone.task = task;
        }
        return task;
    }

    public abstract isValidTask(): boolean;

    public abstract isValidTarget(): boolean;

    public isValid(): boolean {
        const validTask: boolean = !!this.drone && this.isValidTask();
        const validTarget: boolean = !!this.target && this.isValidTarget();
        if (validTask && validTarget) {
            return true;
        } else {
            this.finish();
            return this.parent ? this.parent.isValid() : false;
        }
    }

    public moveToTarget(range?: number): ScreepsReturnCode {
        if (this.opts.moveOpts && !this.opts.moveOpts.range) {
            this.opts.moveOpts.range = range;
        }
        return this.drone.moveTo(this.targetPos, this.opts.moveOpts);

    }

    public moveToNextPos(): ScreepsReturnCode | void {
        if (this.opts.nextPos) {
            const nextPos = constructPosition(this.opts.nextPos);
            return this.drone.moveTo(nextPos);
        }
    }

    public run(): ScreepsReturnCode | void {
        if (this.drone.pos.inRangeTo(this.targetPos, this.specs.targetRange) && !this.drone.pos.isEdge) {
            if (this.specs.workOffRoad) {
                this.drone.park(this.targetPos, true);
            }
            const result = this.work();
            if (this.specs.oneShot && result === OK) {
                this.finish();
            }
            return result;
        } else {
            this.moveToTarget();
        }
    }

    public abstract work(): ScreepsReturnCode;

    public finish(): void {
        this.moveToNextPos();
        if (this.drone) {
            this.drone.task = this.parent;
        } else {
            console.log(`No drone executing ${this.name}!`);
        }
    }
}
