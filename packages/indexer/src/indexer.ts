import {IndexerInput} from "./types/indexer";
import {ThegraphIndexer} from "./thegraph";

export class OrmpipeIndexer {
  private readonly input: IndexerInput;

  private readonly thegraphIndexer: ThegraphIndexer;

  constructor(input: IndexerInput) {
    this.input = input;
    this.thegraphIndexer = new ThegraphIndexer(this.input);
  }

  public thegraph(): ThegraphIndexer {
    return this.thegraphIndexer;
  }

}
