import {Command, Flags} from '@oclif/core'
import {
  OrmpRelay,
  RelayConfig,
  StartRelayFlag,
  OrmpRelayStartInput,
  StartTask,
  RelayFeature
} from "@darwinia/ormpipe-relay"
import {logger} from "@darwinia/ormpipe-logger";
import * as enquirer from 'enquirer';

const homedir = require('os').homedir();
const camelize = require('camelize')

export default class Start extends Command {
  static description = 'describe the command here'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    task: Flags.string({
      required: true,
      multiple: true,
      description: 'task name',
      options: Object.values(StartTask),
    }),
    feature: Flags.string({
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
      description: 'enable relay source to target',
    }),
    'data-path': Flags.string({
      required: true,
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
    'source-indexer-airnode-endpoint': Flags.string({
      required: false,
      description: '[source-chain] indexer for airnode endpoint, default use --source-indexer-endpoint',
      env: 'ORMPIPE_SOURCE_AIRNODE_ENDPOINT',
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
    'target-indexer-airnode-endpoint': Flags.string({
      required: false,
      description: '[target-chain] indexer for airnode endpoint, default use --target-indexer-endpoint',
      env: 'ORMPIPE_TARGET_INDEXER_AIRNODE_ENDPOINT',
    }),

    'source-signer': Flags.boolean({
      required: false,
      description: '[source-chain] get source signer interactively',
    }),
    'source-signer-airnode': Flags.boolean({
      required: false,
      description: '[source-chain] get source signer for airnode contract interactively',
    }),
    'source-signer-relayer': Flags.boolean({
      required: false,
      description: '[source-chain] get source signer for relayer contract interactively',
    }),
    'target-signer': Flags.boolean({
      required: false,
      description: '[target-chain] get target signer interactively',
    }),
    'target-signer-airnode': Flags.string({
      required: false,
      description: '[target-chain] get target signer for airnode contract interactively',
    }),
    'target-signer-relayer': Flags.string({
      required: false,
      description: '[target-chain] get target signer for relayer contract interactively',
    }),

    'source-address-airnode': Flags.string({
      required: false,
      description: '[source-chain] source chain airnode contract address',
      env: 'ORMPIPE_SOURCE_ADDRESS_AIRNODE',
    }),
    'source-address-relayer': Flags.string({
      required: false,
      description: '[source-chain] source chain relayer contract address',
      env: 'ORMPIPE_SOURCE_ADDRESS_RELAYER',
    }),
    'target-address-airnode': Flags.string({
      required: false,
      description: '[target-chain] target chain airnode contract address',
      env: 'ORMPIPE_TARGET_ADDRESS_AIRNODE',
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

    const rawRelayFlags = camelize(flags) as unknown as StartRelayFlag;
    const relayConfig = await this.buildFlag(rawRelayFlags);

    const ormpRelay = new OrmpRelay(relayConfig);
    const input: OrmpRelayStartInput = {
      tasks: relayConfig.task,
      features: relayConfig.feature,
    };
    try {
      await ormpRelay.start(input);
    } catch (e: any) {
      logger.error(e, {target: 'cli', breads: ['ormpipe', 'start']})
    }
  }

  private async buildFlag(rawRelayFlags: StartRelayFlag): Promise<RelayConfig> {
    const relayConfig: StartRelayFlag = {
      ...rawRelayFlags,

      enableSourceToTarget: rawRelayFlags.enableSourceToTarget ?? false,
      enableTargetToSource: rawRelayFlags.enableTargetToSource ?? false,
      feature: rawRelayFlags.feature ?? [
        RelayFeature.oracle_delivery,
        RelayFeature.oracle_aggregate,
      ],

      sourceIndexerOracleEndpoint: rawRelayFlags.sourceIndexerOracleEndpoint ?? rawRelayFlags.sourceIndexerEndpoint,
      sourceIndexerRelayerEndpoint: rawRelayFlags.sourceIndexerRelayerEndpoint ?? rawRelayFlags.sourceIndexerEndpoint,
      sourceIndexerOrmpEndpoint: rawRelayFlags.sourceIndexerOrmpEndpoint ?? rawRelayFlags.sourceIndexerEndpoint,
      sourceIndexerAirnodeEndpoint: rawRelayFlags.sourceIndexerAirnodeEndpoint ?? rawRelayFlags.sourceIndexerEndpoint,

      targetIndexerOracleEndpoint: rawRelayFlags.targetIndexerOracleEndpoint ?? rawRelayFlags.targetIndexerEndpoint,
      targetIndexerRelayerEndpoint: rawRelayFlags.targetIndexerRelayerEndpoint ?? rawRelayFlags.targetIndexerEndpoint,
      targetIndexerOrmpEndpoint: rawRelayFlags.targetIndexerOrmpEndpoint ?? rawRelayFlags.targetIndexerEndpoint,
      targetIndexerAirnodeEndpoint: rawRelayFlags.targetIndexerAirnodeEndpoint ?? rawRelayFlags.targetIndexerEndpoint,
    };
    const sourceSigner = await this.interactiveValue({
      required: false,
      enable: !!relayConfig.sourceSigner,
      type: 'password',
      name: 'source-signer',
      message: 'missing --source-signer or ORMPIPE_SOURCE_SIGNER',
      title: 'please type source signer',
      default: process.env.ORMPIPE_SOURCE_SIGNER,
    });
    const sourceSignerAirnode = await this.interactiveValue({
      required: false,
      enable: !!relayConfig.sourceSignerAirnode,
      type: 'password',
      name: 'source-signer-airnode',
      message: 'missing --source-signer-airnode or ORMPIPE_SOURCE_SIGNER_ORACLE',
      title: 'please type source signer for airnode contract',
      default: process.env.ORMPIPE_SOURCE_SIGNER_AIRNODE,
    });
    const sourceSignerRelayer = await this.interactiveValue({
      required: false,
      enable: !!relayConfig.sourceSignerRelayer,
      type: 'password',
      name: 'source-signer-relayer',
      message: 'missing --source-signer-relayer or ORMPIPE_SOURCE_SIGNER_RELAYER',
      title: 'please type source signer for relayer contract',
      default: process.env.ORMPIPE_SOURCE_SIGNER_RELAYER,
    });
    const targetSigner = await this.interactiveValue({
      required: false,
      enable: !!relayConfig.targetSigner,
      type: 'password',
      name: 'target-signer',
      message: 'missing --target-signer or ORMPIPE_TARGET_SIGNER',
      title: 'please type target signer',
      default: process.env.ORMPIPE_TARGET_SIGNER,
    });
    const targetSignerAirnode = await this.interactiveValue({
      required: false,
      enable: !!relayConfig.targetSignerAirnode,
      type: 'password',
      name: 'target-signer-airnode',
      message: 'missing --target-signer-airnode or ORMPIPE_TARGET_SIGNER_ORACLE',
      title: 'please type target signer for airnode contract',
      default: process.env.ORMPIPE_TARGET_SIGNER_AIRNODE,
    });
    const targetSignerRelayer = await this.interactiveValue({
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
      sourceSignerAirnode: sourceSignerAirnode ?? sourceSigner,
      sourceSignerRelayer: sourceSignerRelayer ?? sourceSigner,
      targetSigner,
      targetSignerAirnode: targetSignerAirnode ?? targetSigner,
      targetSignerRelayer: targetSignerRelayer ?? targetSigner,
    } as RelayConfig;
  }

  private async interactiveValue(options: {
    required: boolean,
    enable: boolean,
    type?: string,
    name: string,
    message?: string,
    title: string,
    default?: string,
  }): Promise<string | undefined> {
    let value = options.default;

    if (options.enable) {
      const response: { field: string } = await enquirer.prompt({
        type: options.type ?? 'input',
        name: 'field',
        message: options.title,
        validate: async input => {
          if (!input) return options.title;
          return true;
        }
      });
      if (response.field) {
        value = response.field;
      }
    }

    if (!value && options.required) {
      logger.error(options.message ?? `missing ${options.name}`);
      process.exit(1);
    }
    return value;
  }
}
