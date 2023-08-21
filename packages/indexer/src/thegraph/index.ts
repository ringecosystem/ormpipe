import {IndexerInput} from "../types/indexer";
import {ThegraphIndexerOracle} from "./oracle";
import {ThegraphIndexerRelayer} from "./relayer";
import {ThegraphIndexChannel} from "./channel";
import {ThegraphIndexerAirnode} from "./airnode";
import {Gqlc} from "../gqlc";


export class ThegraphIndexer {
  private readonly graphOracle: ThegraphIndexerOracle;
  private readonly graphRelayer: ThegraphIndexerRelayer;
  private readonly graphChannel: ThegraphIndexChannel;
  private readonly graphAirnode: ThegraphIndexerAirnode;

  constructor(input: IndexerInput) {
    const {endpoint, oracleEndpoint, relayerEndpoint, channelEndpoint, airnodeEndpoint} = input;
    this.graphOracle = new ThegraphIndexerOracle(input, new Gqlc({
      timeout: input.timeout,
      endpoint: oracleEndpoint ?? endpoint
    }));
    this.graphRelayer = new ThegraphIndexerRelayer(input, new Gqlc({
      timeout: input.timeout,
      endpoint: relayerEndpoint ?? endpoint,
    }));
    this.graphChannel = new ThegraphIndexChannel(input, new Gqlc({
      timeout: input.timeout,
      endpoint: channelEndpoint ?? endpoint,
    }));
    this.graphAirnode = new ThegraphIndexerAirnode(input, new Gqlc({
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

  public channel(): ThegraphIndexChannel {
    return this.graphChannel;
  }

  public airnode(): ThegraphIndexerAirnode {
    return this.graphAirnode;
  }

}
