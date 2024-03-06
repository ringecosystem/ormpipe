import {Command} from '@oclif/core'
import {CommandHelper} from "../common/commander";
import {
  CliRelayerConfig,
  RelayerRelay,
  RelayerRelayConfig,
  RelayerRelayLifecycle
} from "@darwinia/ormpipe-relay-relayer";
import {logger, RelayEVMClient, RelayStorage} from "@darwinia/ormpipe-common";
import {OrmpipeIndexer} from "@darwinia/ormpipe-indexer";
import {setTimeout} from "timers/promises";

const camelize = require('camelize')

export default class Relayer extends Command {
  static description = 'ORMP relayer relay'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    ...CommandHelper.COMMON_FLAGS,
  }

  static args = {}

  public async run(): Promise<void> {

    process.on('uncaughtException', (error) => {
      logger.error(`detected uncaught exception: ${error.message}`);
    })

    const {args, flags} = await this.parse(Relayer)

    const cliConfig = camelize(flags) as unknown as CliRelayerConfig;
    const relayConfigs = await CommandHelper.buildRelayConfig(cliConfig);
    let times = 0;
    while(true) {
      times += 1;
      for (const rc of relayConfigs) {
        const sourceToTargetLifecycle = await this.buildLifecycle(rc);
        sourceToTargetLifecycle.times = times;

        if (rc.symbol === '-' || rc.symbol === '>') {
          logger.info(
            '--------- relayer %s>%s ---------',
            sourceToTargetLifecycle.sourceChain.name,
            sourceToTargetLifecycle.targetChain.name,
          );
          const sourceToTargetRelay = new RelayerRelay(sourceToTargetLifecycle);
          await sourceToTargetRelay.start();
          await setTimeout(1000);
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
            sourceIndexerOracle: sourceToTargetLifecycle.targetIndexerOracle,
            targetIndexerOracle: sourceToTargetLifecycle.sourceIndexerOracle,
          }

          logger.info(
            '--------- relayer %s>%s ---------',
            targetToSourceLifecycle.sourceChain.name,
            targetToSourceLifecycle.targetChain.name,
          );
          const targetToSourceRelay = new RelayerRelay(targetToSourceLifecycle);
          await targetToSourceRelay.start();
          await setTimeout(1000);
        }
      }
      await setTimeout(4000);
    }
  }


  private async buildLifecycle(config: RelayerRelayConfig): Promise<RelayerRelayLifecycle> {
    const sourceClient = new RelayEVMClient({
      chainName: config.sourceChain.name,
      endpoint: config.sourceChain.endpoint,
      signer: config.sourceSigner,
    });
    const targetClient = new RelayEVMClient({
      chainName: config.targetChain.name,
      endpoint: config.targetChain.endpoint,
      signer: config.targetSigner,
    });
    const sourceIndex = new OrmpipeIndexer({
      endpoint: config.sourceChain.indexer.ormp,
      signcribeEndpoint: config.sourceChain.indexer.signcribe,
    }).thegraph();
    const targetIndex = new OrmpipeIndexer({
      endpoint: config.targetChain.indexer.ormp,
      signcribeEndpoint: config.targetChain.indexer.signcribe,
    }).thegraph();
    const storage = new RelayStorage(config.dataPath, {
      keyPrefix: `${config.sourceChain.name}-${config.sourceChain.name}`,
    });
    return {
      ...config,
      times: 0,
      storage,
      sourceName: config.sourceChain.name,
      targetName: config.targetChain.name,
      sourceClient,
      targetClient,
      sourceIndexerOrmp: sourceIndex.ormp(),
      targetIndexerOrmp: targetIndex.ormp(),
      sourceIndexerOracle: sourceIndex.oracle(),
      targetIndexerOracle: targetIndex.oracle(),
    };
  }

}
