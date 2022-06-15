import HtmlWebpackPlugin = require('html-webpack-plugin');
import * as prettier from 'prettier';
import { Compiler, RuntimeGlobals } from 'webpack';

const pluginName = 'RetryChunkLoadPlugin';

export interface RetryChunkLoadPluginOptions {
  /**
   * optional stringified function to get the cache busting query string appended to the script src
   * if not set will default to appending the string `?cache-bust=true`
   */
  cacheBust?: string;
  /**
   * optional list of chunks to which retry script should be injected
   * if not set will add retry script to all chunks that have webpack script loading
   */
  chunks?: string[];
  /**
   * optional code to be executed in the browser context if after all retries chunk is not loaded.
   * if not set - nothing will happen and error will be returned to the chunk loader.
   */
  lastResortScript?: string;
  /**
   * optional value to set the maximum number of retries to load the chunk. Default is 1
   */
  maxRetries?: number;
  /**
   * optional number value to set the amount of time in milliseconds before trying to load the chunk again. Default is 0
   * if string, value must be code to generate a delay value. Receives retryCount as argument
   * e.g. `function(retryAttempt) { return retryAttempt * 1000 }`
   */
  retryDelay?: number | string;
  /**
   * optional string value to load chunk using fallback path
   * if set will try one more time after max retries failed
   */
  fallbackPath?: string;
}

export class RetryChunkLoadPlugin {
  options: RetryChunkLoadPluginOptions;

  constructor(options: RetryChunkLoadPluginOptions = {}) {
    this.options = Object.assign({}, options);
  }

  apply(compiler: Compiler) {
    const bindAssetReloadFunction = (tag: HtmlWebpackPlugin.HtmlTagObject) => {
      if (
        ['script', 'link'].indexOf(tag.tagName) < 0 &&
        (!/.(css|js)$/.test(tag.attributes?.src as string) ||
          !/.(css|js)$/.test(tag.attributes?.href as string))
      ) {
        return tag;
      }
      tag.attributes.onerror = 'onAssetComplete(this, 0)';
      return tag;
    };
    compiler.hooks.compilation.tap(pluginName, compilation => {
      const hooks = HtmlWebpackPlugin.getHooks(compilation);
      hooks.alterAssetTagGroups.tap(pluginName, assets => {
        assets.headTags = assets.headTags.map(bindAssetReloadFunction);
        assets.bodyTags = assets.bodyTags.map(bindAssetReloadFunction);
        const coreJsContent = `
          var onAssetComplete = (function () {
            var assetMaxRetries = ${this.options.maxRetries || 0};
            var assetPublicPath = ${JSON.stringify(assets.publicPath || '/')};
            var assetRetryDelay = ${this.options.retryDelay || 0};
            var assetFallbackPath = ${JSON.stringify(
              this.options.fallbackPath || ''
            )};

            return function (tag, retries = 0) {
              // return if should not retry nor use fallback
              if (!assetMaxRetries && !assetFallbackPath) {
                return;
              }

              var getAssetPath = function (path, retries, fallbackPath) {
                if (retries <= assetMaxRetries) {
                  return path;
                }
                
                if (fallbackPath && (
                  !assetMaxRetries ||
                  (assetMaxRetries && retries === assetMaxRetries + 1)
                )) {
                  return path.replace(assetPublicPath, assetFallbackPath);
                }

                return path;
              }

              var assetRetry = function (tag, retries) {
                if (['link', 'script'].indexOf(tag.tagName.toLowerCase()) < 0) {
                  return tag;
                }

                var newTag = tag.cloneNode();
                if (tag.tagName.toLowerCase() === 'link') {
                  var path = getAssetPath(tag.href, retries, assetFallbackPath);
                  newTag.href = path;
                  newTag.setAttribute('onerror', 'onAssetComplete(this, ' + retries +')');
                  tag.parentNode.insertBefore(newTag, tag);
                  tag.parentNode.removeChild(tag);
                }
                if (tag.tagName.toLowerCase() === 'script') {
                  var path = getAssetPath(tag.src, retries, assetFallbackPath);
                  newTag.src = path;
                  // document.write(newTag.outerHTML);
                  tag.parentNode.insertAfter(newTag, tag);
                }
              }

              var shouldRetyFallback = assetFallbackPath ? 1 : 0;
              if (retries < assetMaxRetries + shouldRetyFallback) {
                setTimeout(function () {
                  assetRetry(tag, retries + 1);
                }, assetRetryDelay);
              }
            }
          })();
        `;
        const assetsReloadFunction: HtmlWebpackPlugin.HtmlTagObject = {
          attributes: {},
          tagName: 'script',
          innerHTML: coreJsContent,
          voidTag: false,
          meta: { plugin: pluginName },
        };
        assets.headTags.unshift(assetsReloadFunction);
        return assets;
      });
    });
    compiler.hooks.thisCompilation.tap(pluginName, compilation => {
      const { mainTemplate, runtimeTemplate } = compilation;
      const maxRetryValueFromOptions = Number(this.options.maxRetries);
      const maxRetries =
        Number.isInteger(maxRetryValueFromOptions) &&
        maxRetryValueFromOptions > 0
          ? maxRetryValueFromOptions
          : 1;
      const fallbackPath = this.options.fallbackPath;
      const shouldTryFallback = !!fallbackPath;
      const getCacheBustString = () =>
        this.options.cacheBust
          ? `(${this.options.cacheBust})();`
          : '"cache-bust=true"';
      mainTemplate.hooks.localVars.tap(
        { name: pluginName, stage: 1 },
        (source, chunk) => {
          const currentChunkName = chunk.name;
          const addRetryCode =
            !this.options.chunks ||
            this.options.chunks.includes(currentChunkName);
          const getRetryDelay =
            typeof this.options.retryDelay === 'string'
              ? this.options.retryDelay
              : `function() { return ${this.options.retryDelay || 0} }`;
          if (!addRetryCode) return source;
          const script = runtimeTemplate.iife(
            '',
            `
          if(typeof ${RuntimeGlobals.require} !== "undefined") {
            var oldGetScript = ${RuntimeGlobals.getChunkScriptFilename};
            var oldLoadScript = ${RuntimeGlobals.loadScript};
            var oldEnsureScript = ${RuntimeGlobals.ensureChunk};
            var queryMap = {};
            var countMap = {};
            var isTriedFallbackMap = {};
            var getRetryDelay = ${getRetryDelay};
            var fallbackPath = '${fallbackPath}';

            // For js retry
            ${RuntimeGlobals.loadScript} = function(url, done, key, chunkId) {
              var retries = countMap.hasOwnProperty(chunkId) ? countMap[chunkId] : ${maxRetries};
              var finalUrl = url;

              if (retries < 0 && ${shouldTryFallback}) {
                finalUrl = url.replace(${
                  RuntimeGlobals.publicPath
                }, fallbackPath);
                isTriedFallbackMap[chunkId] = true;
              } else {
                finalUrl = finalUrl + (queryMap.hasOwnProperty(chunkId) ? '?' + queryMap[chunkId]  : '');
              }

              var doneFunc = function (event) {
                if ((retries > 0 || (${shouldTryFallback} === !isTriedFallbackMap[chunkId])) && event.type !== 'load') {
                  var retryAttempt = ${maxRetries} - retries + 1;
                  setTimeout(function () {
                    var retryAttemptString = '&retry-attempt=' + retryAttempt;
                    var cacheBust = ${getCacheBustString()} + retryAttemptString;
                    queryMap[chunkId] = cacheBust;
                    countMap[chunkId] = retries - 1;
                    return ${RuntimeGlobals.loadScript}(url, done, key, chunkId)
                  }, getRetryDelay(retryAttempt));

                  return;
                }
                done(event);
              }
              return oldLoadScript(finalUrl, doneFunc, key, chunkId);
            };
          }`
          );
          return (
            source +
            prettier.format(script, {
              trailingComma: 'es5',
              singleQuote: true,
              parser: 'babel',
            })
          );
        }
      );
    });
  }
}

export * from './inject-assets-retry-plugin';
