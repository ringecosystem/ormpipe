import {Args, Command, Flags} from '@oclif/core'
import {OracleRealy} from "@darwinia/ormpipe-relay";
import {logger} from "@darwinia/ormpipe-logger";

export default class Start extends Command {
  static description = 'describe the command here'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    // flag with a value (-n, --name=VALUE)
    name: Flags.string({char: 'n', description: 'name to print'}),
    // flag with no value (-f, --force)
    force: Flags.boolean({char: 'f'}),
  }

  static args = {
    file: Args.string({description: 'file to read'}),
  }

  public async run(): Promise<void> {
//    const {args, flags} = await this.parse(Start)

//    const name = flags.name ?? 'world'
//    this.log(`hello ${name} from /data/dev/darwinia-network/ormpipe/packages/bin/src/commands/start.ts`)
//    if (args.file && flags.force) {
//      this.log(`you input --force and --file: ${args.file}`)
//    }

    const relayer = new OracleRealy();
    await relayer.start();
  }
}
