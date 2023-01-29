import * as t from "./task/core.ts";
import * as udd from "./task/udd.ts";
import * as ss from "./sql/shell/task.ts";

// see setup and usage instructions in lib/task/README.md

export class Tasks extends t.EventEmitter<{
  help(): void;
  updateSupportDeps(): Promise<void>;
  updateDenoDeps(): Promise<void>;
  maintain(): Promise<void>;
}> {
  constructor() {
    super();
    // this is ugly but necessary due to events.EventEmitter making _events_ private :-(
    this.on("help", t.eeHelpTask(this));
    this.on("updateSupportDeps", ss.ensureSupportBinsTask());
    this.on("updateDenoDeps", udd.updateDenoDepsTask());
    this.on("maintain", async () => {
      await this.emit("updateSupportDeps");
      await this.emit("updateDenoDeps");
    });
  }
}

// only execute tasks if Taskfile.ts is being called as a script; otherwise
// it might be imported for tasks or other reasons and we shouldn't "run".
if (import.meta.main) {
  await t.eventEmitterCLI(Deno.args, new Tasks());
}
