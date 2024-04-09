import { IndexerInput } from "../types/indexer";
import { Gqlc } from "../gqlc";
import { IGraphResponse, QueryGraph } from "../types/graph";

interface QueryGenericGraphql extends QueryGraph {
  schema: string;
}

export interface PonderPage<T> {
  items: T[];
  start: string;
  end: string;
  hasNext: boolean;
}

export class GraphCommon {
  private readonly _input: IndexerInput;
  private readonly _gqlc: Gqlc;

  constructor(input: IndexerInput, gqlc: Gqlc) {
    this._input = input;
    this._gqlc = gqlc;
  }

  public get input(): IndexerInput {
    return this._input;
  }

  public get gqlc(): Gqlc {
    return this._gqlc;
  }

  public get endpoint(): string {
    return this.gqlc.endpoint;
  }

  public async query(options: QueryGraph): Promise<GraphResponseData> {
    const resp: IGraphResponse<Record<string, any[]>> = await this.gqlc.query({
      query: options.query,
      variables: options.variables,
    });

    if (resp.errors) {
      console.error(
        "!!! Ponder Error: ",
        resp.errors[0].message,
        options,
        JSON.stringify(resp.errors[0].locations),
      );
    }

    const { data } = resp;
    // const rets = data[options.schema];
    // if (rets && rets.length) {
    //   return rets;
    // }
    // return [];
    return data ? new GraphResponseData(data) : GraphResponseData.def();
  }

  public async list<T>(options: QueryGenericGraphql): Promise<T[]> {
    const gdata = await this.query(options);
    return gdata.list<T>(options.schema);
  }

  public async page<T>(options: QueryGenericGraphql): Promise<PonderPage<T>> {
    const gdata = await this.query(options);
    return gdata.page(options.schema);
  }

  public async single<T>(options: QueryGenericGraphql): Promise<T | undefined> {
    const gdata = await this.query(options);
    return gdata.single<T>(options.schema);
  }
}

export class GraphResponseData {
  constructor(private readonly data: Record<string, any>) {}

  public static def(): GraphResponseData {
    return new GraphResponseData({});
  }

  public page<T>(key: string): PonderPage<T> {
    const rets = this.data[key]?.items;
    const page = this.data[key]?.pageInfo;
    return {
      items: rets,
      start: page?.startCursor,
      end: page?.endCursor,
      hasNext: page?.hasNextPage,
    };
  }

  public list<T>(key: string): T[] {
    const rets = this.data[key]?.items;
    if (!rets || !rets.length) {
      return [];
    }
    return rets;
  }

  public single<T>(key: string): T | undefined {
    const rets = this.list<T>(key);
    return rets.length ? rets[0] : undefined;
  }
}
