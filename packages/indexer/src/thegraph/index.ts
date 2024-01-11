import {IndexerInput} from "../types/indexer";
import {ThegraphIndexOrmp} from "./ormp";
import {Gqlc} from "../gqlc";


export class ThegraphIndexer {
  private readonly graphOrmp: ThegraphIndexOrmp;

  constructor(input: IndexerInput) {
    const {endpoint, ormpEndpoint, subapiEndpoint} = input;
    this.graphOrmp = new ThegraphIndexOrmp(input, new Gqlc({
      timeout: input.timeout,
      endpoint: ormpEndpoint ?? endpoint,
    }));
  }

  public ormp(): ThegraphIndexOrmp {
    return this.graphOrmp;
  }


}
