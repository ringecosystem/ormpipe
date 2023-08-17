import {OrmpipeIndexer} from "@darwinia/ormpipe-indexer";
import {logger} from "@darwinia/ormpipe-logger";

export class OracleRealy {

  private indexer: OrmpipeIndexer;

  constructor() {
    this.indexer = new OrmpipeIndexer({
      endpoint: 'https://api.studio.thegraph.com/query/51152/ormpipe-arbitrum-goerli/version/latest',
//      endpoint: 'https://httpbin.org/post',
    });
  }


  public async start() {
    try {
      await this.run();
    } catch (e: any) {
      const message = e.message;
      logger.error(message, {target: 'oracle', breads: ['source>target']});
    }
  }

  private async run() {
    const nextOracleAssigned = await this.indexer.thegraph().oracle().nextAssigned({blockNumber: 0});
    console.log(JSON.stringify(nextOracleAssigned));
  }

}
