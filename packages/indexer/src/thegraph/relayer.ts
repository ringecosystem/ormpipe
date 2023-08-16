import {IndexerInput} from "../types/indexer";
import {Gqlc} from "../gqlc";

export class GraphRelayer {
  private readonly input: IndexerInput;
  private readonly gqlc: Gqlc;

  constructor(input: IndexerInput, gqlc: Gqlc) {
    this.input = input;
    this.gqlc = gqlc;
  }

}
