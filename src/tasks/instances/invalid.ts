import { Task, TaskTarget } from "../task";

export class InvalidTask extends Task {
    public static TaskType = "INVALID";

    public constructor(target: TaskTarget, opts: TaskOpts = {} as TaskOpts) {
        super(InvalidTask.TaskType, target, opts);
    }

    public get target(): any {
        return super.target;
    }

    public isValidTask(): boolean {
        return false;
    }

    public isValidTarget(): boolean {
        return false;
    }

    public work(): ScreepsReturnCode {
        return OK;
    }
}
