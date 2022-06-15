import { readFileSync } from 'fs';
import HtmlWebpackPlugin = require('html-webpack-plugin');
import { Compiler } from 'webpack';

const pluginName = 'InjectAssetsRetryPlugin';

export interface AssetsRetryOptions {
  maxRetryCount?: number;
  onRetry?: RetryFunction;
  onSuccess?: SuccessFunction;
  onFail?: FailFunction;
  domain?: Domain;
}
export type RetryFunction = (
  currentUrl: string,
  originalUrl: string,
  retryCollector: null | RetryStatistics
) => string | null;
export interface RetryStatistics {
  retryTimes: number;
  succeeded: string[];
  failed: string[];
}
export type SuccessFunction = (currentUrl: string) => void;
export type FailFunction = (currentUrl: string) => void;
export type Domain = string[] | { [x: string]: string };

export class InjectAssetsRetryPlugin {
  options: AssetsRetryOptions;

  constructor(options: AssetsRetryOptions) {
    this.options = Object.assign({}, options);
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(pluginName, compilation => {
      const hooks = HtmlWebpackPlugin.getHooks(compilation);
      hooks.alterAssetTagGroups.tap(
        {
          name: pluginName,
          stage: 1,
        },
        assets => {
          assets.headTags.unshift({
            attributes: {},
            tagName: 'script',
            innerHTML: `
            window.assetsRetry({
              domain: ${JSON.stringify(this.options.domain)},
              maxRetryCount: ${this.options.maxRetryCount},
              onRetry: ${this.options.onRetry},
              onSuccess: ${this.options.onSuccess},
              onFail: ${this.options.onFail},
            });
          `,
            voidTag: false,
            meta: { plugin: pluginName },
          });
          assets.headTags.unshift({
            attributes: {},
            tagName: 'script',
            innerHTML: readFileSync(require.resolve('assets-retry')).toString(),
            voidTag: false,
            meta: { plugin: pluginName },
          });
          return assets;
        }
      );
    });
  }
}
