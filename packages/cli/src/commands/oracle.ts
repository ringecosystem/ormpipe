import {Args, Command, Flags} from '@oclif/core'
import {CommandHelper} from "../common/commander";
import {CliOracleConfig, OracleRelay, OracleRelayConfig, OracleRelayLifecycle} from "@darwinia/ormpipe-relay-oracle";
import {RelayEVMClient, RelayStorage} from "@darwinia/ormpipe-common";
import {OrmpipeIndexer} from "@darwinia/ormpipe-indexer";

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
    const {args, flags} = await this.parse(Oracle)

    const cliConfig = camelize(flags) as unknown as CliOracleConfig;
    const relayConfigs = await CommandHelper.buildRelayConfig(cliConfig);
    while (true) {
      for (const rc of relayConfigs) {
        const lifecycle = await this.buildLifecycle(rc as OracleRelayConfig);
        const relay = new OracleRelay(lifecycle);
        await relay.start();
      }
    }
  }


  private async buildLifecycle(config: OracleRelayConfig): Promise<OracleRelayLifecycle> {
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
    const signcribeClient = new RelayEVMClient({
      chainName: 'darwinia',
      endpoint: 'https://rpc.darwinia.network',
      signer: config.signcribeSigner,
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
      signcribeClient,
      sourceIndexerOrmp: sourceIndex.ormp(),
      targetIndexerOrmp: targetIndex.ormp(),
      indexerSigncribe: sourceIndex.signcribe(),
    };
  }

}
