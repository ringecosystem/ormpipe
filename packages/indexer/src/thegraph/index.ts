import {IndexerInput} from "../types/indexer";
import {ThegraphIndexerOracle} from "./oracle";
import {ThegraphIndexerRelayer} from "./relayer";
import {ThegraphIndexOrmp} from "./ormp";
import {ThegraphIndexerSubapi} from "./subapi";
import {Gqlc} from "../gqlc";


export class ThegraphIndexer {
  private readonly graphOracle: ThegraphIndexerOracle;
  private readonly graphRelayer: ThegraphIndexerRelayer;
  private readonly graphOrmp: ThegraphIndexOrmp;
  private readonly graphAirnode: ThegraphIndexerSubapi;

  constructor(input: IndexerInput) {
    const {endpoint, oracleEndpoint, relayerEndpoint, ormpEndpoint, airnodeEndpoint} = input;
    this.graphOracle = new ThegraphIndexerOracle(input, new Gqlc({
      timeout: input.timeout,
      endpoint: oracleEndpoint ?? endpoint
    }));
    this.graphRelayer = new ThegraphIndexerRelayer(input, new Gqlc({
      timeout: input.timeout,
      endpoint: relayerEndpoint ?? endpoint,
    }));
    this.graphOrmp = new ThegraphIndexOrmp(input, new Gqlc({
      timeout: input.timeout,
      endpoint: ormpEndpoint ?? endpoint,
    }));
    this.graphAirnode = new ThegraphIndexerSubapi(input, new Gqlc({
      timeout: input.timeout,
      endpoint: airnodeEndpoint ?? endpoint,
    }));
  }

  public oracle(): ThegraphIndexerOracle {
    return this.graphOracle;
  }

  public relayer(): ThegraphIndexerRelayer {
    return this.graphRelayer
  }

  public ormp(): ThegraphIndexOrmp {
    return this.graphOrmp;
  }

  public airnode(): ThegraphIndexerSubapi {
    return this.graphAirnode;
  }

}
