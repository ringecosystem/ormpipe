import {Args, Command, Flags} from '@oclif/core'
import {OrmpRelay, RelayConfig, StartInput, StartTask} from "@darwinia/ormpipe-relay"
import {logger} from "@darwinia/ormpipe-logger";
const camelize = require('camelize')

export default class Start extends Command {
  static description = 'describe the command here'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'source-name': Flags.string({
      required: true,
      description: '[source-chain] name',
      default: 'source',
    }),
    'source-endpoint': Flags.string({required: true, description: '[source-chain] endpoint'}),
    'target-name': Flags.string({
      required: true,
      description: '[target-chain] name',
      default: 'target'
    }),
    'target-endpoint': Flags.string({required: true, description: '[target-chain] endpoint'}),

    // 'indexer-endpoint': Flags.string({
    //   required: true,
    //   description: 'indexer endpoint',
    //   default: 'https://api.studio.thegraph.com/query/51152/ormpipe-arbitrum-goerli/version/latest'
    // }),
    'source-indexer-oracle-endpoint': Flags.string({
      required: false,
      description: 'indexer for oracle endpoint'
    }),
    'source-indexer-relayer-endpoint': Flags.string({
      required: false,
      description: 'indexer for relayer endpoint'
    }),

  }

  static args = {
    task: Args.string({
      required: true,
      description: 'relay task name',
      options: ['oracle', 'relayer'],
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Start)

    const {task} = args;

    const relayConfig = camelize(flags) as unknown as RelayConfig;

    const ormpRelay = new OrmpRelay(relayConfig);
    const input: StartInput = {
      task: task as unknown as StartTask,
    };
    try {
      await ormpRelay.start(input);
    } catch (e: any) {
      const message = e.message ?? `${e}`;
      logger.error(message, {target: 'cli', breads: ['ormpipe', 'start', 'task']})
    }
  }
}
