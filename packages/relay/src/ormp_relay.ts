import {OracleRelay} from "./relay/oracle";
import {OrmpRelayStartInput, RelayConfig, StartTask} from "./types/config";
import {BaseLifecycle, OracleLifecycle, RelayerLifecycle} from "./types/lifecycle";
import {OrmpipeIndexer} from "@darwinia/ormpipe-indexer";
import {RelayerRelay} from "./relay/relayer";
import {RelayDirection} from "./types/mark";
import {ThegraphIndexer} from "@darwinia/ormpipe-indexer/dist/thegraph";
import {RelayClient} from "./client";
import {setTimeout} from "timers/promises";
import {logger} from "@darwinia/ormpipe-logger";
import {RelayStorage} from "./helper/storage";

export class OrmpRelay {
  constructor(
    private readonly config: RelayConfig
  ) {
  }

  public async start() {
    if (!this.config.enableSourceToTarget && !this.config.enableTargetToSource) {
      logger.warn(
        'not have pipe enabled, please add --enable-source-to-target or --enable-target-to-source to your command',
        {target: 'ormpipe', breads: ['ormpipe', 'start']},
      );
      return;
    }

    const {tasks, features} = this.config;

    let times = 0;
    while (true) {
      times += 1;
      logger.info('====== ormpipe relay round [%s] ======', times, {target: 'ormpipe'});
      for (const task of tasks) {
        try {
          await this.run({task, features});
        } catch (e: any) {
          logger.error(e, {target: 'ormpipe', breads: ['ormpipe', 'start', task]});
        } finally {
          await setTimeout(5000);
        }
      }
      await setTimeout(5000);
      logger.info('this round [%s] all done, wait 5s', times, {target: 'ormpipe'});
    }
  }

  private async run(input: OrmpRelayStartInput) {
    // source -> target
    const sourceToTargetConfig: RelayConfig = {...this.config};
    // target -> source
    const targetToSourceConfig: RelayConfig = {
      ...this.config,
      sourceName: this.config.targetName,
      sourceEndpoint: this.config.targetEndpoint,
      targetName: this.config.sourceName,
      targetEndpoint: this.config.sourceEndpoint,
      sourceIndexerEndpoint: this.config.targetIndexerEndpoint,
      sourceIndexerOracleEndpoint: this.config.targetIndexerOracleEndpoint,
      sourceIndexerRelayerEndpoint: this.config.targetIndexerRelayerEndpoint,
      sourceIndexerOrmpEndpoint: this.config.targetIndexerOrmpEndpoint,
      sourceIndexerAirnodeEndpoint: this.config.targetIndexerAirnodeEndpoint,
      targetIndexerEndpoint: this.config.sourceIndexerEndpoint,
      targetIndexerOracleEndpoint: this.config.sourceIndexerOracleEndpoint,
      targetIndexerRelayerEndpoint: this.config.sourceIndexerRelayerEndpoint,
      targetIndexerOrmpEndpoint: this.config.sourceIndexerOrmpEndpoint,
      targetIndexerAirnodeEndpoint: this.config.sourceIndexerAirnodeEndpoint,
      sourceSigner: this.config.targetSigner,
      sourceSignerAirnode: this.config.targetSignerAirnode,
      sourceSignerRelayer: this.config.targetSignerRelayer,
      targetSigner: this.config.sourceSigner,
      targetSignerAirnode: this.config.sourceSignerAirnode,
      targetSignerRelayer: this.config.sourceSignerRelayer,
      sourceAddressAirnode: this.config.targetAddressAirnode,
      sourceAddressRelayer: this.config.targetAddressRelayer,
      targetAddressAirnode: this.config.sourceAddressAirnode,
      targetAddressRelayer: this.config.sourceAddressRelayer,
    };

    const features = input.features;
    switch (input.task) {
      case StartTask.oracle: {
        if (sourceToTargetConfig.enableSourceToTarget) {
          const sourceToTargetLifecycle = await this.initOracleLifecycle(
            sourceToTargetConfig,
            RelayDirection.SourceToTarget,
          );
          const sourceToTargetRelayer = new OracleRelay(sourceToTargetLifecycle);
          await sourceToTargetRelayer.start(features);
        }

        if (targetToSourceConfig.enableTargetToSource) {
          const targetToSourceLifecycle = await this.initOracleLifecycle(
            targetToSourceConfig,
            RelayDirection.TargetToSource,
          );
          const targetToSourceRelayer = new OracleRelay(targetToSourceLifecycle);
          await targetToSourceRelayer.start(features);
        }
        break;
      }
      case StartTask.relayer: {
        if (sourceToTargetConfig.enableSourceToTarget) {
          const sourceToTargetLifecycle = await this.initRelayerLifecycle(
            sourceToTargetConfig,
            RelayDirection.TargetToSource,
          );
          const sourceToTargetRelayer = new RelayerRelay(sourceToTargetLifecycle);
          await sourceToTargetRelayer.start();
        }

        if (targetToSourceConfig.enableTargetToSource) {
          const targetToSourceLifeCycle = await this.initRelayerLifecycle(
            targetToSourceConfig,
            RelayDirection.TargetToSource,
          );
          const targetToSourceRelayer = new RelayerRelay(targetToSourceLifeCycle);
          await targetToSourceRelayer.start();
        }
        break;
      }
    }

  }

  private async initOracleLifecycle(config: RelayConfig, direction: RelayDirection): Promise<OracleLifecycle> {
    if (!config.sourceIndexerOracleEndpoint) {
      throw new Error(
        'missing ' + (
          direction == RelayDirection.SourceToTarget
            ? '--source-indexer-oracle-endpoint or --source-indexer-endpoint'
            : '--target-indexer-oracle-endpoint or --target-indexer-endpoint'
        )
      );
    }
    if (!config.sourceIndexerOrmpEndpoint) {
      throw new Error(
        'missing ' + (
          direction == RelayDirection.SourceToTarget
            ? '--source-indexer-ormp-endpoint or --source-indexer-endpoint'
            : '--target-indexer-ormp-endpoint or --target-indexer-endpoint'
        )
      );
    }
    if (!config.targetIndexerOrmpEndpoint) {
      throw new Error(
        'missing ' + (
          direction == RelayDirection.SourceToTarget
            ? '--target-indexer-ormp-endpoint or --target-indexer-endpoint'
            : '--source-indexer-ormp-endpoint or --source-indexer-endpoint'
        )
      );
    }
    if (!config.targetAddressAirnode) {
      throw new Error(
        'missing ' + (
          direction == RelayDirection.SourceToTarget
            ? '--target-address-airnode'
            : '--source-address-airnode'
        )
      );
    }

    const sourceIndexer = this.initSourceIndexer(config);
    const targetIndexer = this.initTargetIndexer(config);

    const baseLifecycle = await this.initBaseLifecycle(config, direction);
    return {
      ...baseLifecycle,
      sourceIndexerOracle: sourceIndexer.oracle(),
      sourceIndexerOrmp: sourceIndexer.ormp(),
      targetIndexerOrmp: targetIndexer.ormp(),
      targetIndexerAirnode: targetIndexer.airnode(),
      targetAirnodeClient: baseLifecycle.targetClient.airnode(config.targetAddressAirnode),
    };
  }

  private async initRelayerLifecycle(config: RelayConfig, direction: RelayDirection): Promise<RelayerLifecycle> {
    if (!config.sourceIndexerOracleEndpoint) {
      throw new Error(
        'missing ' + (
          direction == RelayDirection.SourceToTarget
            ? '--source-indexer-relayer-endpoint or --source-indexer-endpoint'
            : '--target-indexer-relayer-endpoint or --target-indexer-endpoint'
        )
      );
    }
    if (!config.sourceIndexerOrmpEndpoint) {
      throw new Error(
        'missing ' + (
          direction == RelayDirection.SourceToTarget
            ? '--source-indexer-ormp-endpoint or --source-ormp-endpoint'
            : '--target-indexer-ormp-endpoint or --target-ormp-endpoint'
        )
      );
    }
    if (!config.targetIndexerOrmpEndpoint) {
      throw new Error(
        'missing ' + (
          direction == RelayDirection.SourceToTarget
            ? '--target-indexer-ormp-endpoint or --target-ormp-endpoint'
            : '--source-indexer-ormp-endpoint or --source-ormp-endpoint'
        )
      );
    }
    if (!config.targetAddressRelayer) {
      throw new Error(
        'missing ' + (
          direction == RelayDirection.SourceToTarget
            ? '--target-address-relayer'
            : '--source-address-relayer'
        )
      );
    }
    const sourceIndexer = this.initSourceIndexer(config);
    const targetIndexer = this.initTargetIndexer(config);

    const baseLifecycle = await this.initBaseLifecycle(config, direction);
    return {
      ...baseLifecycle,
      sourceIndexerOrmp: sourceIndexer.ormp(),
      sourceIndexerRelayer: sourceIndexer.relayer(),
      targetIndexerOrmp: targetIndexer.ormp(),
      targetIndexerAirnode: targetIndexer.airnode(),
      targetRelayerClient: baseLifecycle.targetClient.relayer(config.targetAddressRelayer),
    };
  }

  private async initBaseLifecycle(config: RelayConfig, direction: RelayDirection): Promise<BaseLifecycle> {
    const sourceClient = new RelayClient({
      chainName: config.sourceName,
      endpoint: config.sourceEndpoint,
      signer: config.sourceSigner,
      signerAirnode: config.sourceSignerAirnode,
      signerRelayer: config.sourceSignerRelayer,
    });
    const targetClient = new RelayClient({
      chainName: config.targetName,
      endpoint: config.targetEndpoint,
      signer: config.targetSigner,
      signerAirnode: config.targetSignerAirnode,
      signerRelayer: config.targetSignerRelayer,
    });
    const storage = new RelayStorage(config.dataPath, {
      keyPrefix: `${config.sourceName}-${config.targetName}`,
    });
    return {
      storage,
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
      ormpEndpoint: config.sourceIndexerOrmpEndpoint,
      airnodeEndpoint: config.sourceIndexerAirnodeEndpoint,
    }).thegraph();
  }

  private initTargetIndexer(config: RelayConfig): ThegraphIndexer {
    return new OrmpipeIndexer({
      endpoint: config.targetIndexerEndpoint,
      oracleEndpoint: config.targetIndexerOracleEndpoint,
      relayerEndpoint: config.targetIndexerRelayerEndpoint,
      ormpEndpoint: config.targetIndexerOrmpEndpoint,
      airnodeEndpoint: config.targetIndexerAirnodeEndpoint,
    }).thegraph();
  }
}
