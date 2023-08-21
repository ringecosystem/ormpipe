import {IndexerInput} from "../types/indexer";
import {GraphOracle} from "./oracle";
import {GraphRelayer} from "./relayer";
import {GraphChannel} from "./channel";
import {GraphAirnode} from "./airnode";
import {Gqlc} from "../gqlc";


export class ThegraphIndexer {
  private readonly input: IndexerInput;
  private readonly gqlc: Gqlc;
  private readonly graphOracle: GraphOracle;
  private readonly graphRelayer: GraphRelayer;
  private readonly graphChannel: GraphChannel;
  private readonly graphAirnode: GraphAirnode;

  constructor(input: IndexerInput) {
    this.input = input;
    this.gqlc = new Gqlc(input);
    this.graphOracle = new GraphOracle(input, this.gqlc);
    this.graphRelayer = new GraphRelayer(input, this.gqlc);
    this.graphChannel = new GraphChannel(input, this.gqlc);
    this.graphAirnode = new GraphAirnode(input, this.gqlc);
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
