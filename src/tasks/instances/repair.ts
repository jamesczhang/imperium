import { Task } from "../task";

export type RepairTarget = Structure;

export class RepairTask extends Task {
    public static TaskType = "repair";

    public constructor(target: RepairTarget, opts: TaskOpts = {} as TaskOpts) {
        super(RepairTask.TaskType, target, opts);

        this.specs.targetRange = 3;
    }

    public get target(): RepairTarget {
        return super.target as RepairTarget;
    }

    public isValidTask(): boolean {
        return this.drone.store[RESOURCE_ENERGY] > 0;
    }

    public isValidTarget(): boolean {
        return this.target && this.target.hits < this.target.hitsMax;
    }

    public work(): ScreepsReturnCode {
        return this.drone.repair(this.target);
    }
}
