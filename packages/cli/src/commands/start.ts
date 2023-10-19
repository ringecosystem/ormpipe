import {Command, Flags} from '@oclif/core'
import {
  OrmpRelay,
  RelayConfig,
  StartTask,
  RelayFeature
} from "@darwinia/ormpipe-relay"
import {logger} from "@darwinia/ormpipe-logger";
import {CommandHelper} from "../common/commander";

const homedir = require('os').homedir();
const camelize = require('camelize')

export default class Start extends Command {
  static description = 'describe the command here'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    tasks: Flags.string({
      char: 't',
      required: true,
      multiple: true,
      description: 'task name',
      options: Object.values(StartTask),
    }),
    features: Flags.string({
      required: false,
      multiple: true,
      description: 'features',
      options: Object.values(RelayFeature),
    }),
    'enable-source-to-target': Flags.boolean({
      required: false,
      description: 'enable relay source to target',
    }),
    'enable-target-to-source': Flags.boolean({
      required: false,
      description: 'enable relay target to source',
    }),
    'data-path': Flags.string({
      char: 'd',
      required: false,
      description: 'data path',
      env: 'ORMPIPE_DATA_PATH',
      default: `${homedir}/.ormpipe`,
    }),

    'source-name': Flags.string({
      required: true,
      description: '[source-chain] name',
      default: 'source',
      env: 'ORMPIPE_SOURCE_NAME',
    }),
    'source-endpoint': Flags.string({
      required: true,
      description: '[source-chain] endpoint',
      env: 'ORMPIPE_SOURCE_ENDPOINT',
    }),

    'target-name': Flags.string({
      required: true,
      description: '[target-chain] name',
      default: 'target',
      env: 'ORMPIPE_TARGET_NAME',
    }),
    'target-endpoint': Flags.string({
      required: true,
      description: '[target-chain] endpoint',
      env: 'ORMPIPE_TARGET_ENDPOINT',
    }),

    'source-indexer-endpoint': Flags.string({
      required: false,
      description: '[source-chain] indexer endpoint',
      env: 'ORMPIPE_SOURCE_INDEXER_ENDPOINT',
    }),
    'source-indexer-oracle-endpoint': Flags.string({
      required: false,
      description: '[source-chain] indexer for oracle endpoint, default use --source-indexer-endpoint',
      env: 'ORMPIPE_SOURCE_INDEXER_ORACLE_ENDPOINT',
    }),
    'source-indexer-relayer-endpoint': Flags.string({
      required: false,
      description: '[source-chain] indexer for relayer endpoint, default use --source-indexer-endpoint',
      env: 'ORMPIPE_SOURCE_RELAYER_ENDPOINT',
    }),
    'source-indexer-ormp-endpoint': Flags.string({
      required: false,
      description: '[source-chain] indexer for ormp endpoint, default use --source-indexer-endpoint',
      env: 'ORMPIPE_SOURCE_ORMP_ENDPOINT',
    }),
    'source-indexer-subapi-endpoint': Flags.string({
      required: false,
      description: '[source-chain] indexer for subapi endpoint, default use --source-indexer-endpoint',
      env: 'ORMPIPE_SOURCE_SUBAPI_ENDPOINT',
    }),

    'target-indexer-endpoint': Flags.string({
      required: false,
      description: '[target-chain] indexer endpoint',
      env: 'ORMPIPE_TARGET_ENDPOINT',
    }),
    'target-indexer-oracle-endpoint': Flags.string({
      required: false,
      description: '[target-chain] indexer for oracle endpoint, default use --target-indexer-endpoint',
      env: 'ORMPIPE_TARGET_INDEXER_ORACLE_ENDPOINT',
    }),
    'target-indexer-relayer-endpoint': Flags.string({
      required: false,
      description: '[target-chain] indexer for relayer endpoint, default use --target-indexer-endpoint',
      env: 'ORMPIPE_TARGET_INDEXER_RELAYER_ENDPOINT',
    }),
    'target-indexer-ormp-endpoint': Flags.string({
      required: false,
      description: '[target-chain] indexer for ormp endpoint, default use --target-indexer-endpoint',
      env: 'ORMPIPE_TARGET_INDEXER_ORMP_ENDPOINT',
    }),
    'target-indexer-subapi-endpoint': Flags.string({
      required: false,
      description: '[target-chain] indexer for subapi endpoint, default use --target-indexer-endpoint',
      env: 'ORMPIPE_TARGET_INDEXER_SUBAPI_ENDPOINT',
    }),

    'source-signer': Flags.boolean({
      required: false,
      description: '[source-chain] source signer interactively',
    }),
    'source-signer-subapi': Flags.boolean({
      required: false,
      description: '[source-chain] source signer for subapi contract interactively',
    }),
    'source-signer-relayer': Flags.boolean({
      required: false,
      description: '[source-chain] source signer for relayer contract interactively',
    }),
    'target-signer': Flags.boolean({
      required: false,
      description: '[target-chain] target signer interactively',
    }),
    'target-signer-subapi': Flags.boolean({
      required: false,
      description: '[target-chain] target signer for subapi contract interactively',
    }),
    'target-signer-relayer': Flags.boolean({
      required: false,
      description: '[target-chain] target signer for relayer contract interactively',
    }),

    'source-address-subapi': Flags.string({
      required: false,
      description: '[source-chain] source chain subapi contract address',
      env: 'ORMPIPE_SOURCE_ADDRESS_SUBAPI',
    }),
    'source-address-relayer': Flags.string({
      required: false,
      description: '[source-chain] source chain relayer contract address',
      env: 'ORMPIPE_SOURCE_ADDRESS_RELAYER',
    }),
    'target-address-subapi': Flags.string({
      required: false,
      description: '[target-chain] target chain subapi contract address',
      env: 'ORMPIPE_TARGET_ADDRESS_SUBAPI',
    }),
    'target-address-relayer': Flags.string({
      required: false,
      description: '[target-chain] target chain relayer contract address',
      env: 'ORMPIPE_TARGET_ADDRESS_RELAYER',
    }),

  }

  static args = {
    // task: Args.string({
    //   required: true,
    //   description: 'relay task name',
    //   options: ['oracle', 'relayer'],
    // }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Start)

    // const {task} = args;

    const rawRelayFlags = camelize(flags) as unknown as RelayConfig;
    const relayConfig = await this.buildFlag(rawRelayFlags);

    const ormpRelay = new OrmpRelay(relayConfig);
    try {
      await ormpRelay.start();
    } catch (e: any) {
      logger.error(e, {target: 'cli', breads: ['ormpipe', 'start']})
    }
  }

  private async buildFlag(rawRelayFlags: RelayConfig): Promise<RelayConfig> {
    const relayConfig: RelayConfig = {
      ...rawRelayFlags,

      enableSourceToTarget: rawRelayFlags.enableSourceToTarget ?? false,
      enableTargetToSource: rawRelayFlags.enableTargetToSource ?? false,
      features: rawRelayFlags.features ?? [
        RelayFeature.oracle_delivery,
        RelayFeature.oracle_aggregate,
      ],

      sourceIndexerOracleEndpoint: rawRelayFlags.sourceIndexerOracleEndpoint ?? rawRelayFlags.sourceIndexerEndpoint,
      sourceIndexerRelayerEndpoint: rawRelayFlags.sourceIndexerRelayerEndpoint ?? rawRelayFlags.sourceIndexerEndpoint,
      sourceIndexerOrmpEndpoint: rawRelayFlags.sourceIndexerOrmpEndpoint ?? rawRelayFlags.sourceIndexerEndpoint,
      sourceIndexerSubapiEndpoint: rawRelayFlags.sourceIndexerSubapiEndpoint ?? rawRelayFlags.sourceIndexerEndpoint,

      targetIndexerOracleEndpoint: rawRelayFlags.targetIndexerOracleEndpoint ?? rawRelayFlags.targetIndexerEndpoint,
      targetIndexerRelayerEndpoint: rawRelayFlags.targetIndexerRelayerEndpoint ?? rawRelayFlags.targetIndexerEndpoint,
      targetIndexerOrmpEndpoint: rawRelayFlags.targetIndexerOrmpEndpoint ?? rawRelayFlags.targetIndexerEndpoint,
      targetIndexerSubapiEndpoint: rawRelayFlags.targetIndexerSubapiEndpoint ?? rawRelayFlags.targetIndexerEndpoint,
    };
    const sourceSigner = await CommandHelper.interactiveValue({
      required: false,
      enable: !!relayConfig.sourceSigner,
      type: 'password',
      name: 'source-signer',
      message: 'missing --source-signer or ORMPIPE_SOURCE_SIGNER',
      title: 'please type source signer',
      default: process.env.ORMPIPE_SOURCE_SIGNER,
    });
    const sourceSignerSubapi = await CommandHelper.interactiveValue({
      required: false,
      enable: !!relayConfig.sourceSignerSubapi,
      type: 'password',
      name: 'source-signer-subapi',
      message: 'missing --source-signer-subapi or ORMPIPE_SOURCE_SIGNER_ORACLE',
      title: 'please type source signer for subapi contract',
      default: process.env.ORMPIPE_SOURCE_SIGNER_SUBAPI,
    });
    const sourceSignerRelayer = await CommandHelper.interactiveValue({
      required: false,
      enable: !!relayConfig.sourceSignerRelayer,
      type: 'password',
      name: 'source-signer-relayer',
      message: 'missing --source-signer-relayer or ORMPIPE_SOURCE_SIGNER_RELAYER',
      title: 'please type source signer for relayer contract',
      default: process.env.ORMPIPE_SOURCE_SIGNER_RELAYER,
    });
    const targetSigner = await CommandHelper.interactiveValue({
      required: false,
      enable: !!relayConfig.targetSigner,
      type: 'password',
      name: 'target-signer',
      message: 'missing --target-signer or ORMPIPE_TARGET_SIGNER',
      title: 'please type target signer',
      default: process.env.ORMPIPE_TARGET_SIGNER,
    });
    const targetSignerSubapi = await CommandHelper.interactiveValue({
      required: false,
      enable: !!relayConfig.targetSignerSubapi,
      type: 'password',
      name: 'target-signer-subapi',
      message: 'missing --target-signer-subapi or ORMPIPE_TARGET_SIGNER_ORACLE',
      title: 'please type target signer for subapi contract',
      default: process.env.ORMPIPE_TARGET_SIGNER_SUBAPI,
    });
    const targetSignerRelayer = await CommandHelper.interactiveValue({
      required: false,
      enable: !!relayConfig.targetSignerRelayer,
      type: 'password',
      name: 'target-signer-relayer',
      message: 'missing --target-signer-relayer or ORMPIPE_TARGET_SIGNER_RELAYER',
      title: 'please type target signer for relayer contract',
      default: process.env.ORMPIPE_TARGET_SIGNER_RELAYER,
    });


    return {
      ...relayConfig,
      sourceSigner,
      sourceSignerSubapi: sourceSignerSubapi ?? sourceSigner,
      sourceSignerRelayer: sourceSignerRelayer ?? sourceSigner,
      targetSigner,
      targetSignerSubapi: targetSignerSubapi ?? targetSigner,
      targetSignerRelayer: targetSignerRelayer ?? targetSigner,
    } as RelayConfig;
  }

}
