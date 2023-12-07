import {IndexerInput} from "../types/indexer";
import {ThegraphIndexOrmp} from "./ormp";
import {ThegraphIndexerSubapi} from "./subapi";
import {Gqlc} from "../gqlc";


export class ThegraphIndexer {
  private readonly graphOrmp: ThegraphIndexOrmp;
  private readonly graphAirnode: ThegraphIndexerSubapi;

  constructor(input: IndexerInput) {
    const {endpoint, ormpEndpoint, subapiEndpoint} = input;
    this.graphOrmp = new ThegraphIndexOrmp(input, new Gqlc({
      timeout: input.timeout,
      endpoint: ormpEndpoint ?? endpoint,
    }));
    this.graphAirnode = new ThegraphIndexerSubapi(input, new Gqlc({
      timeout: input.timeout,
      endpoint: subapiEndpoint ?? endpoint,
    }));
  }

  public ormp(): ThegraphIndexOrmp {
    return this.graphOrmp;
  }

  public subapi(): ThegraphIndexerSubapi {
    return this.graphAirnode;
  }

}
