export class Mem {
    public static format(): void {
        if (!Memory.colonies) {
            Memory.colonies = {};
        }
    }

    public static cleanCreeps(): void {
        for (const name in Memory.creeps) {
            if (!Game.creeps[name]) {
                delete Memory.creeps[name];
            }
        }
    }

    public static cleanFlags(): void {
        for (const name in Memory.flags) {
            if (!Game.flags[name]) {
                delete Memory.flags[name];
            }
        }
    }

    public static clean(): void {
        this.cleanCreeps();
        this.cleanFlags();
    }
}
