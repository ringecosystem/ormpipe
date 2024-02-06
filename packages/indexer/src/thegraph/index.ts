import {IndexerInput} from "../types/indexer";
import {ThegraphIndexOrmp} from "./ormp";
import {ThegraphIndexSigncribe} from "./signcribe";
import {ThegraphIndexOracle} from "./oracle"
import {Gqlc} from "../gqlc";


export class ThegraphIndexer {
  private readonly graphOrmp: ThegraphIndexOrmp;
  private readonly graphSigncribe: ThegraphIndexSigncribe;
  private readonly graphOracle: ThegraphIndexOracle;

  constructor(input: IndexerInput) {
    const {endpoint, ormpEndpoint, signcribeEndpoint, oracleEndpoint} = input;
    this.graphOrmp = new ThegraphIndexOrmp(input, new Gqlc({
      timeout: input.timeout,
      endpoint: ormpEndpoint ?? endpoint,
    }));
    this.graphSigncribe = new ThegraphIndexSigncribe(input, new Gqlc({
      timeout: input.timeout,
      endpoint: signcribeEndpoint ?? endpoint,
    }));
    this.graphOracle = new ThegraphIndexOracle(input, new Gqlc({
      timeout: input.timeout,
      endpoint: oracleEndpoint ?? endpoint,
    }));
  }

  public ormp(): ThegraphIndexOrmp {
    return this.graphOrmp;
  }

  public signcribe(): ThegraphIndexSigncribe {
    return this.graphSigncribe;
  }

  public oracle(): ThegraphIndexOracle {
    return this.graphOracle;
  }


}
