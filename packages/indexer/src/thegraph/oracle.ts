import {IndexerInput} from "../types/indexer";
import {QueryNextOracleAssigned} from "../types/graph";


export class GraphOracle {
  private readonly input: IndexerInput;

  constructor(input: IndexerInput) {
    this.input = input;
  }

  public nextAssigned(options: QueryNextOracleAssigned) {

  }

}
