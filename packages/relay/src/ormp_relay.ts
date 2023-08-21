import {OracleRealy} from "./relay/oracle";
import {RelayConfig, StartInput, StartTask} from "./types/config";
import {ethers} from "ethers";
import {OracleLifecycle, RelayerLifecycle} from "./types/lifecycle";
import {OrmpipeIndexer} from "@darwinia/ormpipe-indexer";
import {RelayerRelay} from "./relay/relayer";

export class OrmpRelay {
  constructor(
    private readonly config: RelayConfig
  ) {
  }

  public async start(input: StartInput) {
    // start ormp relay
    switch (input.task) {
      case StartTask.oracle: {
        const lifecycle = await this.initOracleLifecycle();
        const relayer = new OracleRealy(lifecycle);
        await relayer.start();
        break;
      }
      case StartTask.relayer: {
        const lifecycle = await this.initRelayerLifecycle()
        const relayer = new RelayerRelay(lifecycle);
        await relayer.start();
        break;
      }
    }
  }

  private async initOracleLifecycle(): Promise<OracleLifecycle> {
    // init state
    // == source chain
    const sourceClient = new ethers.JsonRpcProvider(this.config.sourceEndpoint);

    const sourceIndexerOracleEndpoint = this.config.sourceIndexerOracleEndpoint;
    if (!sourceIndexerOracleEndpoint) {
      throw new Error('missing --source-indexer-oracle-endpoint');
    }
    const sourceIndexerOracle = new OrmpipeIndexer({
      endpoint: sourceIndexerOracleEndpoint,
    });
    // == target chain
    const targetClient = new ethers.JsonRpcProvider(this.config.targetEndpoint);
    return {
      sourceClient,
      targetClient,
      sourceIndexerOracle,
    };
  }

  private async initRelayerLifecycle(): Promise<RelayerLifecycle> {
    // init state
    // == source chain
    const sourceClient = new ethers.JsonRpcProvider(this.config.sourceEndpoint);

    const sourceIndexerRelayerEndpoint = this.config.sourceIndexerOracleEndpoint;
    if (!sourceIndexerRelayerEndpoint) {
      throw new Error('missing --source-indexer-relayer-endpoint');
    }
    const sourceIndexerRelayer = new OrmpipeIndexer({
      endpoint: sourceIndexerRelayerEndpoint,
    });
    // == target chain
    const targetClient = new ethers.JsonRpcProvider(this.config.targetEndpoint);
    return {
      sourceClient,
      targetClient,
      sourceIndexerRelayer,
    };
  }
}
