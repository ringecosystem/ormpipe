import {IndexerInput} from "../types/indexer";
import {GraphOracle} from "./oracle";
import {GraphRelayer} from "./relayer";
import {GraphChannel} from "./channel";
import {GraphAirnode} from "./airnode";
import {Gqlc} from "../gqlc";


export class ThegraphIndexer {
  private readonly input: IndexerInput;
  private readonly http: Gqlc;
  private readonly graphOracle: GraphOracle;
  private readonly graphRelayer: GraphRelayer;
  private readonly graphChannel: GraphChannel;
  private readonly graphAirnode: GraphAirnode;

  constructor(input: IndexerInput) {
    this.input = input;
    this.http = new Gqlc(input);
    this.graphOracle = new GraphOracle(input, this.http);
    this.graphRelayer = new GraphRelayer(input, this.http);
    this.graphChannel = new GraphChannel(input, this.http);
    this.graphAirnode = new GraphAirnode(input, this.http);
  }

  public oracle(): GraphOracle {
    return this.graphOracle;
  }

  public relayer(): GraphRelayer {
    return this.graphRelayer
  }

  public channel(): GraphChannel {
    return this.graphChannel;
  }

  public airnode(): GraphAirnode {
    return this.graphAirnode;
  }

}
