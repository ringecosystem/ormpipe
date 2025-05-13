import { IndexerInput } from "./types/indexer";
import { SqdIndexer } from "./sqd";

export class OrmpipeIndexer {
  private readonly input: IndexerInput;

  private readonly _indexer: SqdIndexer;

  constructor(input: IndexerInput) {
    this.input = input;
    this._indexer = new SqdIndexer(this.input);
  }

  public indexer(): SqdIndexer {
    return this._indexer;
  }
}
