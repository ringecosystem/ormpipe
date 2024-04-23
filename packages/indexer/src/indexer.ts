import { IndexerInput } from "./types/indexer";
import { PonderIndexer } from "./ponder";

export class OrmpipeIndexer {
  private readonly input: IndexerInput;

  private readonly ponderIndexer: PonderIndexer;

  constructor(input: IndexerInput) {
    this.input = input;
    this.ponderIndexer = new PonderIndexer(this.input);
  }

  public ponder(): PonderIndexer {
    return this.ponderIndexer;
  }
}
