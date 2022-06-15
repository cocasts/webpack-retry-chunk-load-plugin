/* eslint-disable */
// @ts-nocheck
import * as prettier from 'prettier';

const pluginName = 'HandleChunkLoadFailurePlugin';

/**
 * This Webpack plugin calls `window._chunkHandler.handleVersionChange()` when loading a chunk fails
 */
export class HandleChunkLoadFailurePlugin {
  constructor(options = {}) {
    this.options = Object.assign({}, options);
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(pluginName, compilation => {
      const { mainTemplate } = compilation;
      if (mainTemplate.hooks.jsonpScript) {
        // Adapted from https://github.com/webpack/webpack/blob/11e94dd2d0a8d8baae75e715ff8a69f27a9e3014/lib/web/JsonpMainTemplatePlugin.js#L145-L210
        // https://github.com/webpack/webpack/issues/9611#issuecomment-523850870
        mainTemplate.hooks.jsonpScript.tap(pluginName, (source, chunk) => {
          const { crossOriginLoading, chunkLoadTimeout, jsonpScriptType } =
            mainTemplate.outputOptions;

          const crossOriginScript = `
          if (script.src.indexOf(window.location.origin + '/') !== 0) {
            script.crossOrigin = ${JSON.stringify(crossOriginLoading)};
          }
        `;

          const scriptWithRetry = `
          // create error before stack unwound to get useful stacktrace later
          var error = new Error();
          function loadScript(src) {
            var script = document.createElement('script');
            var onScriptComplete;
            ${
              jsonpScriptType
                ? `script.type = ${JSON.stringify(jsonpScriptType)};`
                : ''
            }
            script.charset = 'utf-8';
            script.timeout = ${chunkLoadTimeout / 1000};
            if (${mainTemplate.requireFn}.nc) {
              script.setAttribute("nonce", ${mainTemplate.requireFn}.nc);
            }
            script.src = src;
            ${crossOriginLoading ? crossOriginScript : ''}
            onScriptComplete = function (event) {
              var chunk = installedChunks[chunkId];
              if (chunk) window._chunkHandler.handleVersionChange()
            };
            script.onerror = onScriptComplete;
            return script;
          }
          var script = loadScript(jsonpScriptSrc(chunkId));
        `;

          const currentChunkName = chunk.name;
          const addRetryCode =
            !this.options.chunks ||
            this.options.chunks.includes(currentChunkName);
          const script = addRetryCode ? scriptWithRetry : source;

          return prettier.format(script, {
            singleQuote: true,
            parser: 'babel',
          });
        });
      }
    });
  }
}

// module.exports[pluginName] = HandleChunkLoadFailurePlugin;
