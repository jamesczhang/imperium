import { Drone } from "../../drone/";
import { Task } from "../task";

export type TransferTarget = (Structure | AnyCreep | Drone) & { store: StoreDefinition }

export class TransferTask extends Task {
    public static TaskType = "transfer";

    public constructor(target: TransferTarget, resourceType: ResourceConstant = RESOURCE_ENERGY, amount?: number, opts: TaskOpts = {} as TaskOpts) {
        super(TransferTask.TaskType, target, opts);

        this.specs.oneShot = true;
        this.data.resourceType = resourceType;
        this.data.amount = amount;
    }

    public get target(): TransferTarget {
        return super.target as TransferTarget;
    }

    public isValidTask(): boolean {
        const amount = this.data.amount || 1;
        const resourcesInCarry = this.drone.store[this.data.resourceType || RESOURCE_ENERGY] || 0;
        return resourcesInCarry >= amount;
    }

    public isValidTarget(): boolean {
        return this.target && this.target.store.getFreeCapacity(this.data.resourceType) > (this.data.amount || 1);
    }

    public work(): ScreepsReturnCode {
        return this.drone.transfer(this.target, (this.data.resourceType || RESOURCE_ENERGY), this.data.amount);
    }
}
