import { Task } from "../task";

export type UpgradeTarget = StructureController;

export class UpgradeTask extends Task {
    public static TaskType = "upgrade";

    public constructor(target: UpgradeTarget, opts: TaskOpts = {} as TaskOpts) {
        super(UpgradeTask.TaskType, target, opts);

        this.specs.targetRange = 3;
        this.specs.workOffRoad = true;
    }

    public get target(): UpgradeTarget {
        return super.target as UpgradeTarget;
    }

    public isValidTask(): boolean {
        return this.drone.store[RESOURCE_ENERGY] > 0;
    }

    public isValidTarget(): boolean {
        return this.target && this.target.my;
    }

    public work(): ScreepsReturnCode {
        return this.drone.upgradeController(this.target);
    }
}
