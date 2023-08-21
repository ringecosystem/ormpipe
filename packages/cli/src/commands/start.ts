import {Args, Command, Flags} from '@oclif/core'
import {OrmpRelay, RelayConfig} from "@darwinia/ormpipe-relay"
const camelize = require('camelize')

export default class Start extends Command {
  static description = 'describe the command here'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'source-chain-name': Flags.string({
      required: true,
      description: '[source-chain] name',
      default: 'source',
    }),
    'source-chain-endpoint': Flags.string({required: true, description: '[source-chain] endpoint'}),
    'target-chain-name': Flags.string({
      required: true,
      description: '[target-chain] name',
      default: 'target'
    }),
    'target-chain-endpoint': Flags.string({required: true, description: '[target-chain] endpoint'}),

    'indexer-endpoint': Flags.string({
      required: true,
      description: 'indexer endpoint',
      default: 'https://api.studio.thegraph.com/query/51152/ormpipe-arbitrum-goerli/version/latest'
    }),
    'indexer-oracle-endpoint': Flags.string({
      required: false,
      description: 'indexer for oracle endpoint, default use --indexer-endpoint'
    }),
    'indexer-relayer-endpoint': Flags.string({
      required: false,
      description: 'indexer for relayer endpoint, default use --indexer-endpoint'
    }),

  }

  static args = {
    file: Args.string({description: 'file to read'}),
  }

  public async run(): Promise<void> {
    // args,
    const {flags} = await this.parse(Start)

//    const name = flags.name ?? 'world'
//    this.log(`hello ${name} from /data/dev/darwinia-network/ormpipe/packages/bin/src/commands/start.ts`)
//    if (args.file && flags.force) {
//      this.log(`you input --force and --file: ${args.file}`)
//    }

    const flagData = camelize(flags) as unknown as RelayConfig;
    const relayConfig = {
      ...flagData,
      indexerOracleEndpoint: flagData.indexerOracleEndpoint ?? flagData.indexerEndpoint,
      indexerRelayerEndpoint:flagData.indexerRelayerEndpoint ?? flagData.indexerEndpoint,
    } as RelayConfig;

    const ormpRelay = new OrmpRelay(relayConfig);
    await ormpRelay.start();
  }
}
