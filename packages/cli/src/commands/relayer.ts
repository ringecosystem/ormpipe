import {Command} from '@oclif/core'
import {CommandHelper} from "../common/commander";
import {
  CliRelayerConfig,
  RelayerRelay,
  RelayerRelayConfig,
  RelayerRelayLifecycle
} from "@darwinia/ormpipe-relay-relayer";
import {RelayEVMClient, RelayStorage} from "@darwinia/ormpipe-common";
import {OrmpipeIndexer} from "@darwinia/ormpipe-indexer";

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
    const {args, flags} = await this.parse(Relayer)

    const cliConfig = camelize(flags) as unknown as CliRelayerConfig;
    const relayConfigs = await CommandHelper.buildRelayConfig(cliConfig);
    for (const rc of relayConfigs) {
      const lifecycle = await this.buildLifecycle(rc);
      const relay = new RelayerRelay(lifecycle);
      await relay.start();
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
      storage,
      sourceName: config.sourceChain.name,
      targetName: config.targetChain.name,
      sourceClient,
      targetClient,
      sourceIndexerOrmp: sourceIndex.ormp(),
      targetIndexerOrmp: targetIndex.ormp(),
    };
  }

}
