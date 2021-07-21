import "./ahead/prototypes";
import { Mem } from "./ahead/utils";
import { Colony } from "./colony";
import { Drone } from "./drone";

Mem.format();

function main(): void {
    Mem.clean();

    Game.drones = {};
    for (const name in Game.creeps)
        Game.drones[name] = new Drone(Game.creeps[name]);

    Game.colonies = {};
    for (const name in Game.spawns) {
        const room = Game.spawns[name].room;
        if (!Game.colonies[room.name]) {
            Game.colonies[room.name] = new Colony(room.name);
        }
    }

    for (const name in Game.colonies) {
        Game.colonies[name].run();
    }
}

export const loop = main;
