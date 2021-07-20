import { Task } from "../task";

export type HarvestTarget = Source | Mineral;

export class HarvestTask extends Task {
    public static TaskType = "harvest";

    public constructor(target: HarvestTarget, opts: TaskOpts = {} as TaskOpts) {
        super(HarvestTask.TaskType, target, opts);
    }

    public get target(): HarvestTarget {
        return super.target as HarvestTarget;
    }

    public isValidTask(): boolean {
        return this.drone.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    }

    public isValidTarget(): boolean {
        return (this.target instanceof Source ? this.target.energy : this.target.mineralAmount) > 0;
    }

    public work(): ScreepsReturnCode {
        return this.drone.harvest(this.target);
    }
}
