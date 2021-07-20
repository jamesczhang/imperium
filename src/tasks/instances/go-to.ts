import { Task, TaskTarget } from "../task";

export type GotoTarget = { pos: RoomPosition } | RoomPosition;

export class GotoTask extends Task {
    public static TaskType = "goto";

    public constructor(target: GotoTarget, opts: TaskOpts = {} as TaskOpts) {
        if (target instanceof RoomPosition) {
            super(GotoTask.TaskType, { id: "" as Id<TaskTarget>, pos: target }, opts);
        } else {
            super(GotoTask.TaskType, { id: "" as Id<TaskTarget>, pos: target.pos }, opts);
        }

        this.specs.targetRange = 1;
    }

    public get target(): null {
        return null;
    }

    public isValidTask(): boolean {
        return !this.drone.pos.inRangeTo(this.targetPos, this.specs.targetRange);
    }

    public isValidTarget(): boolean {
        return true;
    }

    public work(): ScreepsReturnCode {
        return this.drone.moveTo(this.targetPos);
    }
}
