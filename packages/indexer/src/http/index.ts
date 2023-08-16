import {IndexerHttpConfig} from "../types/indexer";
import axios, {AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig} from "axios";
import {logger} from "@darwinia/ormpipe-logger";

export class IndexerHttp {
  private config: IndexerHttpConfig;

  constructor(config: IndexerHttpConfig) {
    this.config = config;
  }

  private _axios(): AxiosInstance {
    const service = axios.create({
      baseURL: this.config.endpoint,
      timeout: this.config.timeout,
      withCredentials: true,
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
        // Do something with request error
        logger.error(error);
        Promise.reject(error)
      },
    );

    service.interceptors.response.use(
      (response: AxiosResponse<any>) => {
        return response.data;
      },
      (error: AxiosError) => {
      },
    );
  }

}
