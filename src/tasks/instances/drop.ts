import { Task, TaskTarget } from "../task";

export type DropTarget = { pos: RoomPosition } | RoomPosition;

export class DropTask extends Task {
    public static TaskType = "drop";

    public constructor(target: DropTarget, resourceType: ResourceConstant = RESOURCE_ENERGY, amount?: number, opts: TaskOpts = {} as TaskOpts) {
        if (target instanceof RoomPosition) {
            super(DropTask.TaskType, { id: "" as Id<TaskTarget>, pos: target }, opts);
        } else {
            super(DropTask.TaskType, { id: "" as Id<TaskTarget>, pos: target.pos }, opts);
        }

        this.specs.targetRange = 1;
        this.specs.oneShot = true;
        this.data.resourceType = resourceType;
        this.data.amount = amount;
    }

    public get target(): null {
        return null;
    }

    public isValidTask(): boolean {
        const amount = this.data.amount || 1;
        const resourcesInCarry = this.drone.store[this.data.resourceType || RESOURCE_ENERGY] || 0;
        return resourcesInCarry >= amount;
    }

    public isValidTarget(): boolean {
        return true;
    }

    public work(): ScreepsReturnCode {
        return this.drone.drop(this.data.resourceType || RESOURCE_ENERGY, this.data.amount);
    }
}
