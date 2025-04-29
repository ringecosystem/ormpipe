import axios, {AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig} from "axios";
import {QueryGraph} from "../types/graphql";

export interface GqlcConfig {
  endpoint: string
  timeout?: number
}

export class Gqlc {
  private readonly config: GqlcConfig;
  private readonly axios: AxiosInstance;

  constructor(config: GqlcConfig) {
    this.config = config;
    this.axios = this._axios(config.endpoint);
  }

  public get endpoint(): string {
    return this.config.endpoint
  }

  private _axios(endpoint: string): AxiosInstance {
    const service = axios.create({
      // baseURL: 'https://httpbin.org/post',
      // baseURL: 'https://api.studio.thegraph.com/query/51152/ormpipe-arbitrum-goerli/version/latest',
      baseURL: endpoint,
      timeout: this.config.timeout ?? 1000 * 10,
    });
    this._interceptors(service);
    return service;
  }

  private _interceptors(service: AxiosInstance) {
    service.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (config.method === 'get' && config.params) {
          let url = config.url as string
          url += '?'
          const keys = Object.keys(config.params)
          for (const key of keys) {
            if (config.params[key] !== void 0 && config.params[key] !== null) {
              url += `${key}=${encodeURIComponent(config.params[key])}&`
            }
          }
          url = url.substring(0, url.length - 1)
          config.params = {}
          config.url = url
        }
        return config
      },
      (error: AxiosError) => {
        const {message, config} = error;
        error.message = config
          ? `(indexer, request) ${config.method} -> ${config.baseURL}/${config.url} ${message}`
          : message;
        return Promise.reject(error);
      },
    );

    service.interceptors.response.use(
      (response: AxiosResponse<any>) => {
        return response.data;
      },
      (error: AxiosError) => {
        const {message, config} = error;
        error.message = config
          ? `(indexer, response) ${config.method} -> ${config.baseURL}${config.url ? '/' + config.url : ''} ${message}`
          : message;
        return Promise.reject(error);
      },
    );
  }

  private request(option: any) {
    const {url, method, params, data, headersType, responseType} = option
    return this.axios({
      url: url,
      method,
      params,
      data,
      responseType: responseType,
      headers: {
        'Content-Type': headersType || 'application/json'
      }
    })
  }

//  public get<T = any>(option: any) {
//    return this.request({method: 'get', ...option}) as unknown as T
//  };
//
//  public post<T = any>(option: any) {
//    return this.request({method: 'post', ...option}) as unknown as T
//  };
//
//  public delete<T = any>(option: any) {
//    return this.request({method: 'delete', ...option}) as unknown as T
//  };
//
//  public put<T = any>(option: any) {
//    return this.request({method: 'put', ...option}) as unknown as T
//  };

  public query<T = any>(query: QueryGraph) {
    return this.request({
      method: 'post',
      data: query,
    }) as unknown as T
  }

}
