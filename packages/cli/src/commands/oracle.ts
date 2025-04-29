import {Command, Flags} from '@oclif/core'
import {CommandHelper} from "../common/commander";
import {CliOracleConfig, OracleRelay, OracleRelayConfig, OracleRelayLifecycle} from "@darwinia/ormpipe-relay-oracle";
import {logger, RelayEVMClient, RelayStorage} from "@darwinia/ormpipe-common";
import {OrmpipeIndexer} from "@darwinia/ormpipe-indexer";
import {setTimeout} from "timers/promises";

const camelize = require('camelize')

export default class Oracle extends Command {
  static description = 'ORMP oracle relay'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    ...CommandHelper.COMMON_FLAGS,
    'mainly': Flags.boolean({
      required: false,
      description: 'mainly node',
    }),
  }

  static args = {}

  public async run(): Promise<void> {

    process.on('uncaughtException', (error) => {
      logger.error(`detected uncaught exception: ${error.message}`);
    })

    const {args, flags} = await this.parse(Oracle)

    const cliConfig = camelize(flags) as unknown as CliOracleConfig;
    let times = 0;
    while (true) {
      times += 1;
      const relayConfigs = await CommandHelper.buildRelayConfig(cliConfig);
      for (const rc of relayConfigs) {
        const orc = rc as OracleRelayConfig;
        if (orc.mainly === undefined) {
          const envMainly = process.env['ORMPIPE_MAINLY'];
          orc.mainly = envMainly === 'true' || envMainly === '1';
        }

        const sourceToTargetLifecycle = await this.buildLifecycle(orc);
        sourceToTargetLifecycle.times = times;

        if (rc.symbol === '-' || rc.symbol === '>') {
          logger.info(
            '--------- oracle %s>%s ---------',
            sourceToTargetLifecycle.sourceChain.name,
            sourceToTargetLifecycle.targetChain.name,
          );
          const sourceToTargetRelay = new OracleRelay(sourceToTargetLifecycle);
          await sourceToTargetRelay.start();
          await setTimeout(1000)
        }

        if (rc.symbol === '-' || rc.symbol === '<') {
          const targetToSourceLifecycle = {
            ...sourceToTargetLifecycle,
            sourceChain: sourceToTargetLifecycle.targetChain,
            targetChain: sourceToTargetLifecycle.sourceChain,
            sourceSigner: sourceToTargetLifecycle.targetSigner,
            targetSigner: sourceToTargetLifecycle.sourceSigner,
            sourceName: sourceToTargetLifecycle.targetName,
            targetName: sourceToTargetLifecycle.sourceName,
            sourceClient: sourceToTargetLifecycle.targetClient,
            targetClient: sourceToTargetLifecycle.sourceClient,
            sourceIndexerOrmp: sourceToTargetLifecycle.targetIndexerOrmp,
            targetIndexerOrmp: sourceToTargetLifecycle.sourceIndexerOrmp,
          };

          logger.info(
            '--------- oracle %s>%s ---------',
            targetToSourceLifecycle.sourceChain.name,
            targetToSourceLifecycle.targetChain.name,
          );
          const targetToSourceRelay = new OracleRelay(targetToSourceLifecycle);
          await targetToSourceRelay.start();
          await setTimeout(1000);
        }

      }
      await setTimeout(4000);
    }
  }


  private async buildLifecycle(config: OracleRelayConfig): Promise<OracleRelayLifecycle> {
    const sourceClient = new RelayEVMClient({
      chainId: config.sourceChain.chainId,
      chainName: config.sourceChain.name,
      endpoint: config.sourceChain.endpoint,
      signer: config.sourceSigner,
    });
    const targetClient = new RelayEVMClient({
      chainId: config.targetChain.chainId,
      chainName: config.targetChain.name,
      endpoint: config.targetChain.endpoint,
      signer: config.targetSigner,
    });
    const signcribeClient = new RelayEVMClient({
      chainId: 46,
      chainName: 'darwinia',
      endpoint: 'http://c1.darwinia-rpc.itering.io:9944',
      signer: config.signcribeSigner,
    });
    const sourceIndex = new OrmpipeIndexer({
      endpoint: config.sourceChain.indexer.ormp,
      signcribeEndpoint: config.sourceChain.indexer.signcribe,
    }).indexer();
    const targetIndex = new OrmpipeIndexer({
      endpoint: config.targetChain.indexer.ormp,
      signcribeEndpoint: config.targetChain.indexer.signcribe,
    }).indexer();
    const storage = new RelayStorage(config.dataPath, {
      keyPrefix: `${config.sourceChain.name}-${config.sourceChain.name}`,
    });
    return {
      ...config,
      mainly: !!config.mainly,
      storage,
      sourceName: config.sourceChain.name,
      targetName: config.targetChain.name,
      sourceClient,
      targetClient,
      signcribeClient,
      sourceIndexerOrmp: sourceIndex.ormp(),
      targetIndexerOrmp: targetIndex.ormp(),
      indexerSigncribe: sourceIndex.signcribe(),
    };
  }

}
