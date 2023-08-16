import {IndexerInput} from "../types/indexer";
import {GraphOracle} from "./oracle";
import {GraphRelayer} from "./relayer";
import {GraphChannel} from "./channel";
import {GraphAirnode} from "./airnode";


export class ThegraphIndexer {
  private readonly input: IndexerInput;

  constructor(input: IndexerInput) {
    this.input = input;
  }

  public oracle(): GraphOracle {
    return new GraphOracle(this.input);
  }

  public relayer(): GraphRelayer {
    return new GraphRelayer(this.input);
  }

  public channel(): GraphChannel {
    return new GraphChannel(this.input);
  }

  public airnode(): GraphAirnode {
    return new GraphAirnode(this.input);
  }



}
