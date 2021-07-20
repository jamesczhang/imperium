import { Task } from "../task";

export type PickupTarget = Resource;

export class PickupTask extends Task {
    public static TaskType = "pickup";

    public constructor(target: PickupTarget, opts: TaskOpts = {} as TaskOpts) {
        super(PickupTask.TaskType, target, opts);
    }

    public get target(): PickupTarget {
        return super.target as PickupTarget;
    }

    public isValidTask(): boolean {
        return this.drone.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    }

    public isValidTarget(): boolean {
        return this.target && this.target.amount > 0;
    }

    public work(): ScreepsReturnCode {
        return this.drone.pickup(this.target);
    }
}
