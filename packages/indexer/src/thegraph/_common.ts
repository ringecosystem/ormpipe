import {IndexerInput} from "../types/indexer";
import {Gqlc} from "../gqlc";
import {IGraphResponse, OrmpChannelMessageAccepted, QueryGraph} from "../types/graph";

interface QueryGenericGraphql extends QueryGraph {
  schema: string
}

export class GraphCommon {
  private readonly _input: IndexerInput;
  private readonly _gqlc: Gqlc;

  constructor(
    input: IndexerInput,
    gqlc: Gqlc,
  ) {
    this._input = input;
    this._gqlc = gqlc;
  }

  public get input() {
    return this._input
  }

  public get gqlc() {
    return this._gqlc
  }

  public async list<T>(options: QueryGenericGraphql): Promise<T[]> {
    const resp: IGraphResponse<Record<string, T[]>> = await this.gqlc.query({
      query: options.query,
      variables: options.variables
    });
    const {data} = resp;
    const rets = data[options.schema];
    if (rets && rets.length) {
      return rets;
    }
    return [];
  }

  public async single<T>(options: QueryGenericGraphql): Promise<T | undefined> {
    const rets = await this.list<T>(options);
    return rets.length ? rets[0] : undefined;
  }
}
