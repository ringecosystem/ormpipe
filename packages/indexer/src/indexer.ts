import {IndexerInput} from "./types/indexer";
import {ThegraphIndexer} from "./thegraph";

export class OrmpipeIndexer {
  private readonly input: IndexerInput;

  constructor(input: IndexerInput) {
    this.input = input;
  }

  public thegraph(): ThegraphIndexer {
    return new ThegraphIndexer(this.input);
  }
}
