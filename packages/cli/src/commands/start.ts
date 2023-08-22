import {Args, Command, Flags} from '@oclif/core'
import {OrmpRelay, RelayConfig, StartRelayFlag, StartInput, StartTask} from "@darwinia/ormpipe-relay"
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

    'source-signer': Flags.string({
      required: false,
      description: '[source-chain] get source signer interactively',
    }),
    'source-signer-env': Flags.string({
      required: false,
      description: '[source-chain] get source signer from environment',
      default: 'ORMPIPE_SOURCE_SIGNER',
    }),
    'source-signer-oracle': Flags.string({
      required: false,
      description: '[source-chain] get source signer for oracle contract interactively',
    }),
    'source-signer-oracle-env': Flags.string({
      required: false,
      description: '[source-chain] get source signer for oracle contract from environment',
      default: 'ORMPIPE_SOURCE_SIGNER_ORACLE',
    }),
    'target-signer': Flags.string({
      required: false,
      description: '[target-chain] get source signer interactively',
    }),
    'target-signer-env': Flags.string({
      required: false,
      description: '[target-chain] get source signer from environment',
      default: 'ORMPIPE_TARGET_SIGNER',
    }),
    'target-signer-oracle': Flags.string({
      required: false,
      description: '[target-chain] get source signer for oracle contract interactively',
    }),
    'target-signer-oracle-env': Flags.string({
      required: false,
      description: '[target-chain] get source signer for oracle contract from environment',
      default: 'ORMPIPE_TARGET_SIGNER_ORACLE',
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

    const rawRelayFlags = camelize(flags) as unknown as StartRelayFlag;

    const relayConfig: StartRelayFlag = {
      ...rawRelayFlags,

      sourceIndexerOracleEndpoint: rawRelayFlags.sourceIndexerOracleEndpoint ?? rawRelayFlags.sourceIndexerEndpoint,
      sourceIndexerRelayerEndpoint: rawRelayFlags.sourceIndexerRelayerEndpoint ?? rawRelayFlags.sourceIndexerEndpoint,
      sourceIndexerOrmpEndpoint: rawRelayFlags.sourceIndexerOrmpEndpoint ?? rawRelayFlags.sourceIndexerEndpoint,
      sourceIndexerAirnodeEndpoint: rawRelayFlags.sourceIndexerAirnodeEndpoint ?? rawRelayFlags.sourceIndexerEndpoint,

      targetIndexerOracleEndpoint: rawRelayFlags.targetIndexerOracleEndpoint ?? rawRelayFlags.targetIndexerEndpoint,
      targetIndexerRelayerEndpoint: rawRelayFlags.targetIndexerRelayerEndpoint ?? rawRelayFlags.targetIndexerEndpoint,
      targetIndexerOrmpEndpoint: rawRelayFlags.targetIndexerOrmpEndpoint ?? rawRelayFlags.targetIndexerEndpoint,
      targetIndexerAirnodeEndpoint: rawRelayFlags.targetIndexerAirnodeEndpoint ?? rawRelayFlags.targetIndexerEndpoint,
    };
    
    console.log(relayConfig)

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
