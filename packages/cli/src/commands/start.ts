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

    'source-indexer-endpoint': Flags.string({
      required: false,
      description: '[source-chain] indexer endpoint'
    }),
    'source-indexer-oracle-endpoint': Flags.string({
      required: false,
      description: '[source-chain] indexer for oracle endpoint, default use --source-indexer-endpoint'
    }),
    'source-indexer-relayer-endpoint': Flags.string({
      required: false,
      description: '[source-chain] indexer for relayer endpoint, default use --source-indexer-endpoint'
    }),
    'source-indexer-ormp-endpoint': Flags.string({
      required: false,
      description: '[source-chain] indexer for ormp endpoint, default use --source-indexer-endpoint'
    }),
    'source-indexer-airnode-endpoint': Flags.string({
      required: false,
      description: '[source-chain] indexer for airnode endpoint, default use --source-indexer-endpoint'
    }),

    'target-indexer-endpoint': Flags.string({
      required: false,
      description: '[target-chain] indexer endpoint'
    }),
    'target-indexer-oracle-endpoint': Flags.string({
      required: false,
      description: '[target-chain] indexer for oracle endpoint, default use --target-indexer-endpoint'
    }),
    'target-indexer-relayer-endpoint': Flags.string({
      required: false,
      description: '[target-chain] indexer for relayer endpoint, default use --target-indexer-endpoint'
    }),
    'target-indexer-ormp-endpoint': Flags.string({
      required: false,
      description: '[target-chain] indexer for ormp endpoint, default use --target-indexer-endpoint'
    }),
    'target-indexer-airnode-endpoint': Flags.string({
      required: false,
      description: '[target-chain] indexer for airnode endpoint, default use --target-indexer-endpoint'
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

    const relayFlags = camelize(flags) as unknown as RelayConfig;

    const relayConfig: RelayConfig = {
      ...relayFlags,

      sourceIndexerOracleEndpoint: relayFlags.sourceIndexerOracleEndpoint ?? relayFlags.sourceIndexerEndpoint,
      sourceIndexerRelayerEndpoint: relayFlags.sourceIndexerRelayerEndpoint ?? relayFlags.sourceIndexerEndpoint,
      sourceIndexerOrmpEndpoint: relayFlags.sourceIndexerOrmpEndpoint ?? relayFlags.sourceIndexerEndpoint,
      sourceIndexerAirnodeEndpoint: relayFlags.sourceIndexerAirnodeEndpoint ?? relayFlags.sourceIndexerEndpoint,

      targetIndexerOracleEndpoint: relayFlags.targetIndexerOracleEndpoint ?? relayFlags.targetIndexerEndpoint,
      targetIndexerRelayerEndpoint: relayFlags.targetIndexerRelayerEndpoint ?? relayFlags.targetIndexerEndpoint,
      targetIndexerOrmpEndpoint: relayFlags.targetIndexerOrmpEndpoint ?? relayFlags.targetIndexerEndpoint,
      targetIndexerAirnodeEndpoint: relayFlags.targetIndexerAirnodeEndpoint ?? relayFlags.targetIndexerEndpoint,
    };

    const ormpRelay = new OrmpRelay(relayConfig);
    const input: StartInput = {
      task: task as unknown as StartTask,
    };
    try {
      await ormpRelay.start(input);
    } catch (e: any) {
      logger.error(e, {target: 'cli', breads: ['ormpipe', 'start', 'task']})
    }
  }
}
