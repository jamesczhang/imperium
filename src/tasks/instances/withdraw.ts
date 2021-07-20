import { Task } from "../task";

export type WithdrawTarget =
    StructureContainer
    | StructureExtension
    | StructureSpawn
    | StructureStorage
    | StructureTower;

export class WithdrawTask extends Task {
    public static TaskType = "withdraw";

    public constructor(target: WithdrawTarget, resourceType: ResourceConstant = RESOURCE_ENERGY, amount?: number, opts: TaskOpts = {} as TaskOpts) {
        super(WithdrawTask.TaskType, target, opts);

        this.specs.oneShot = true;
        this.data.resourceType = resourceType;
        this.data.amount = amount;
    }

    public get target(): WithdrawTarget {
        return super.target as WithdrawTarget;
    }

    public isValidTask(): boolean {
        const amount = this.data.amount || 1;
        const freeCapacity = this.drone.store.getFreeCapacity(this.data.resourceType || RESOURCE_ENERGY) || 0;
        return freeCapacity >= amount;
    }

    public isValidTarget(): boolean {
        return this.target && this.target.store[this.data.resourceType || RESOURCE_ENERGY] > (this.data.amount || 1);
    }

    public work(): ScreepsReturnCode {
        return this.drone.withdraw(this.target, (this.data.resourceType || RESOURCE_ENERGY), this.data.amount);
    }
}
