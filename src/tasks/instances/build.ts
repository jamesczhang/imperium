import { Task } from "../task";

export type BuildTarget = ConstructionSite;

export class BuildTask extends Task {
    public static TaskType = "build";

    public constructor(target: BuildTarget, opts: TaskOpts = {} as TaskOpts) {
        super(BuildTask.TaskType, target, opts);

        this.specs.targetRange = 3;
        this.specs.workOffRoad = true;
    }

    public get target(): BuildTarget {
        return super.target as BuildTarget;
    }

    public isValidTask(): boolean {
        return this.drone.store[RESOURCE_ENERGY] > 0;
    }

    public isValidTarget(): boolean {
        return this.target && this.target.my && this.target.progress < this.target.progressTotal;
    }

    public work(): ScreepsReturnCode {
        return this.drone.build(this.target);
    }
}
