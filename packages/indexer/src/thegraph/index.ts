import {IndexerInput} from "../types/indexer";
import {ThegraphIndexOrmp} from "./ormp";
import {Gqlc} from "../gqlc";
import {ThegraphIndexSigncribe} from "./signcribe";


export class ThegraphIndexer {
  private readonly graphOrmp: ThegraphIndexOrmp;
  private readonly graphSigncribe: ThegraphIndexSigncribe;

  constructor(input: IndexerInput) {
    const {endpoint, ormpEndpoint, signcribeEndpoint} = input;
    this.graphOrmp = new ThegraphIndexOrmp(input, new Gqlc({
      timeout: input.timeout,
      endpoint: ormpEndpoint ?? endpoint,
    }));
    this.graphSigncribe = new ThegraphIndexSigncribe(input, new Gqlc({
      timeout: input.timeout,
      endpoint: signcribeEndpoint ?? endpoint,
    }));
  }

  public ormp(): ThegraphIndexOrmp {
    return this.graphOrmp;
  }

  public signcribe(): ThegraphIndexSigncribe {
    return this.graphSigncribe;
  }


}
