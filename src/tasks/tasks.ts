import { getObjectById } from "../ahead/utils";
import { BuildTarget, BuildTask } from "./instances/build";
import { DropTarget, DropTask } from "./instances/drop";
import { GotoTarget, GotoTask } from "./instances/go-to";
import { HarvestTarget, HarvestTask } from "./instances/harvest";
import { InvalidTask } from "./instances/invalid";
import { PickupTarget, PickupTask } from "./instances/pickup";
import { RepairTarget, RepairTask } from "./instances/repair";
import { TransferTarget, TransferTask } from "./instances/transfer";
import { UpgradeTarget, UpgradeTask } from "./instances/upgrade";
import { WithdrawTarget, WithdrawTask } from "./instances/withdraw";
import { Task } from "./task";

export class Tasks {
    public static build(target: BuildTarget): BuildTask {
        return new BuildTask(target);
    }

    public static drop(target: DropTarget): DropTask {
        return new DropTask(target);
    }

    public static goTo(target: GotoTarget): GotoTask {
        return new GotoTask(target);
    }

    public static harvest(target: HarvestTarget): HarvestTask {
        return new HarvestTask(target);
    }

    public static pickup(target: PickupTarget): PickupTask {
        return new PickupTask(target);
    }

    public static repair(target: RepairTarget): RepairTask {
        return new RepairTask(target);
    }

    public static transfer(target: TransferTarget): TransferTask {
        return new TransferTask(target);
    }

    public static upgrade(target: UpgradeTarget): UpgradeTask {
        return new UpgradeTask(target);
    }

    public static withdraw(target: WithdrawTarget): WithdrawTask {
        return new WithdrawTask(target);
    }

    public static instantiate(proto: CTask): Task {
        const taskName = proto.name;
        const target = getObjectById(proto._target.id);
        let task: Task;
        switch (taskName) {
        case BuildTask.TaskType:
            task = new BuildTask(target as BuildTarget);
            break;
        case DropTask.TaskType:
            task = new DropTask(target as DropTarget);
            break;
        case GotoTask.TaskType:
            task = new GotoTask(target as GotoTarget);
            break;
        case HarvestTask.TaskType:
            task = new HarvestTask(target as HarvestTarget);
            break;
        case PickupTask.TaskType:
            task = new PickupTask(target as PickupTarget);
            break;
        case RepairTask.TaskType:
            task = new RepairTask(target as RepairTarget);
            break;
        case TransferTask.TaskType:
            task = new TransferTask(target as TransferTarget);
            break;
        case UpgradeTask.TaskType:
            task = new UpgradeTask(target as UpgradeTarget);
            break;
        case WithdrawTask.TaskType:
            task = new WithdrawTask(target as WithdrawTarget);
            break;
        default:
            console.log(`Invalid task name: ${taskName}! task.creep: ${proto._drone.name}. Deleting from memory!`);
            task = new InvalidTask(target as any);
            break;
        }

        task.proto = proto;
        return task;
    }
}
