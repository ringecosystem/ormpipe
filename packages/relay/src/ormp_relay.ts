import {OracleRelay} from "./relay/oracle";
import {RelayConfig, StartInput, StartTask} from "./types/config";
import {ethers} from "ethers";
import {BaseLifecycle, OracleLifecycle, RelayerLifecycle} from "./types/lifecycle";
import {OrmpipeIndexer} from "@darwinia/ormpipe-indexer";
import {RelayerRelay} from "./relay/relayer";
import {RelayDirection} from "./types/mark";
import {ThegraphIndexer} from "@darwinia/ormpipe-indexer/dist/thegraph";

export class OrmpRelay {
  constructor(
    private readonly config: RelayConfig
  ) {
  }

  public async start(input: StartInput) {
    // start ormp relay

    // source -> target
    const sourceToTargetConfig: RelayConfig = {...this.config};
    // target -> source
    // const targetToSourceConfig: RelayConfig = {
    //   sourceName: this.config.targetName,
    //   sourceEndpoint: this.config.targetEndpoint,
    //   targetName: this.config.sourceName,
    //   targetEndpoint: this.config.sourceEndpoint,
    //   sourceIndexerEndpoint: this.config.targetIndexerEndpoint,
    //   sourceIndexerOracleEndpoint: this.config.targetIndexerOracleEndpoint,
    //   sourceIndexerRelayerEndpoint: this.config.targetIndexerRelayerEndpoint,
    //   sourceIndexerChannelEndpoint: this.config.targetIndexerChannelEndpoint,
    //   sourceIndexerAirnodeEndpoint: this.config.targetIndexerAirnodeEndpoint,
    //   targetIndexerEndpoint: this.config.sourceIndexerEndpoint,
    //   targetIndexerOracleEndpoint: this.config.sourceIndexerOracleEndpoint,
    //   targetIndexerRelayerEndpoint: this.config.sourceIndexerRelayerEndpoint,
    //   targetIndexerChannelEndpoint: this.config.sourceIndexerChannelEndpoint,
    //   targetIndexerAirnodeEndpoint: this.config.sourceIndexerAirnodeEndpoint,
    // };

    switch (input.task) {
      case StartTask.oracle: {
        const lifecycle = await this.initOracleLifecycle(sourceToTargetConfig, RelayDirection.SourceToTarget);
        const relayer = new OracleRelay(lifecycle);
        await relayer.start();
        break;
      }
      case StartTask.relayer: {
        const lifecycle = await this.initRelayerLifecycle(sourceToTargetConfig, RelayDirection.TargetToSource);
        const relayer = new RelayerRelay(lifecycle);
        await relayer.start();
        break;
      }
    }

  }

  private async initOracleLifecycle(config: RelayConfig, direction: RelayDirection): Promise<OracleLifecycle> {
    if (!config.sourceIndexerOracleEndpoint) {
      throw new Error(
        'missing '
        + direction == RelayDirection.SourceToTarget
          ? '--source-indexer-oracle-endpoint or --source-indexer-endpoint'
          : '--source-indexer-oracle-endpoint or --source-indexer-endpoint'
      );
    }
    if (!config.sourceIndexerChannelEndpoint) {
      throw new Error(
        'missing '
        + direction == RelayDirection.SourceToTarget
          ? '--source-indexer-channel-endpoint or --source-indexer-endpoint'
          : '--source-indexer-channel-endpoint or --source-indexer-endpoint'
      );
    }
    if (!config.targetIndexerChannelEndpoint) {
      throw new Error(
        'missing '
        + direction == RelayDirection.SourceToTarget
          ? '--target-indexer-channel-endpoint or --target-indexer-endpoint'
          : '--target-indexer-channel-endpoint or --target-indexer-endpoint'
      );
    }
    const sourceIndexer = this.initSourceIndexer(config);
    const targetIndexer = this.initTargetIndexer(config);

    const baseLifecycle = await this.initBaseLifecycle(config, direction);
    return {
      ...baseLifecycle,
      sourceIndexerOracle: sourceIndexer.oracle(),
      sourceIndexerChannel: sourceIndexer.channel(),
      targetIndexerChannel: targetIndexer.channel(),
      targetIndexerAirnode: targetIndexer.airnode(),
    };
  }

  private async initRelayerLifecycle(config: RelayConfig, direction: RelayDirection): Promise<RelayerLifecycle> {
    if (!config.sourceIndexerOracleEndpoint) {
      throw new Error(
        'missing '
        + direction == RelayDirection.SourceToTarget
          ? '--source-indexer-relayer-endpoint or --source-indexer-endpoint'
          : '--source-indexer-relayer-endpoint or --source-indexer-endpoint'
      );
    }
    if (!config.sourceIndexerChannelEndpoint) {
      throw new Error(
        'missing '
        + direction == RelayDirection.SourceToTarget
          ? '--source-indexer-channel-endpoint or --source-channel-endpoint'
          : '--source-indexer-channel-endpoint or --source-channel-endpoint'
      );
    }
    if (!config.targetIndexerChannelEndpoint) {
      throw new Error(
        'missing '
        + direction == RelayDirection.SourceToTarget
          ? '--target-indexer-channel-endpoint or --target-channel-endpoint'
          : '--target-indexer-channel-endpoint or --target-channel-endpoint'
      );
    }
    const sourceIndexer = this.initSourceIndexer(config);
    const targetIndexer = this.initTargetIndexer(config);

    const baseLifecycle = await this.initBaseLifecycle(config, direction);
    return {
      ...baseLifecycle,
      sourceIndexerChannel: sourceIndexer.channel(),
      sourceIndexerRelayer: sourceIndexer.relayer(),
      targetIndexerChannel: targetIndexer.channel(),
      targetIndexerAirnode: targetIndexer.airnode(),
    };
  }

  private async initBaseLifecycle(config: RelayConfig, direction: RelayDirection): Promise<BaseLifecycle> {
    const sourceClient = new ethers.JsonRpcProvider(config.sourceEndpoint);
    const targetClient = new ethers.JsonRpcProvider(config.targetEndpoint);
    return {
      direction,
      sourceName: config.sourceName,
      targetName: config.targetName,
      sourceClient,
      targetClient,
    };
  }

  private initSourceIndexer(config: RelayConfig): ThegraphIndexer {
    return new OrmpipeIndexer({
      endpoint: config.sourceIndexerEndpoint,
      oracleEndpoint: config.sourceIndexerOracleEndpoint,
      relayerEndpoint: config.sourceIndexerRelayerEndpoint,
      channelEndpoint: config.sourceIndexerRelayerEndpoint,
      airnodeEndpoint: config.sourceIndexerAirnodeEndpoint,
    }).thegraph();
  }

  private initTargetIndexer(config: RelayConfig): ThegraphIndexer {
    return new OrmpipeIndexer({
      endpoint: config.targetIndexerEndpoint,
      oracleEndpoint: config.targetIndexerOracleEndpoint,
      relayerEndpoint: config.targetIndexerRelayerEndpoint,
      channelEndpoint: config.targetIndexerRelayerEndpoint,
      airnodeEndpoint: config.targetIndexerAirnodeEndpoint,
    }).thegraph();
  }
}
