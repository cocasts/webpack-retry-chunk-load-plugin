/* eslint-disable */
// @ts-nocheck
import * as path from 'path';
import { Configuration, RuntimeGlobals } from 'webpack';
import { RetryChunkLoadPlugin, InjectAssetsRetryPlugin } from '../../src';
import HtmlWebpackPlugin = require('html-webpack-plugin');
import MiniCssExtractPlugin = require('mini-css-extract-plugin');
import { readFileSync } from 'fs';

module.exports = {
  devtool: false,
  entry: path.join(__dirname, '..', 'integration', 'fixtures', 'index.ts'),
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '//localhost:3000/',
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      // 不能使用外部变量，该函数相当于注入一个字符串
      // insert: linkTag => {
      //   __webpack_require__.cssChunksMaxRetries = 1;
      //   __webpack_require__.cssChunksRetryDelay = 100;
      //   __webpack_require__.cssChunksFallbackPath = '//localhost:3000/cdn-fallback-';
      //   if (typeof __webpack_require__.cssChunksRetries === 'undefined') {
      //     __webpack_require__.cssChunksRetries = {};
      //   }
      
      //   var onLinkComplete = (event) => {
      //     // avoid mem leaks.
      //     linkTag.onerror = linkTag.onload = null;
      //     if (event.type === 'load') {
      //       return resolve();
      //     }

      //     if (
      //       __webpack_require__.cssChunksRetries
      //       && __webpack_require__.cssChunksMaxRetries
      //       && (__webpack_require__.cssChunksRetries[chunkId] || 0) < __webpack_require__.cssChunksMaxRetries
      //     ) {
      //       linkTag.parentNode.removeChild(linkTag);
      //       __webpack_require__.cssChunksRetries[chunkId] = (__webpack_require__.cssChunksRetries[chunkId] || 0) + 1; 
      //       return setTimeout(function () {
      //         createStylesheet(chunkId, fullhref, resolve, reject)
      //       }, __webpack_require__.cssChunksRetryDelay || 0);
      //     }
      
      //     // if cssChunksFallbackPath set, try fallback path
      //     if (
      //       __webpack_require__.cssChunksFallbackPath && (
      //         !__webpack_require__.cssChunksMaxRetries
      //         || (
      //           // if cssChunksMaxRetries set, it should smaller than cssChunksRetries[chunkId]
      //           __webpack_require__.cssChunksMaxRetries
      //           && __webpack_require__.cssChunksRetries
      //           && __webpack_require__.cssChunksRetries[chunkId] === __webpack_require__.cssChunksMaxRetries
      //         )
      //       )
      //     ) {
      //       linkTag.parentNode.removeChild(linkTag);
      //       __webpack_require__.cssChunksRetries[chunkId] = (__webpack_require__.cssChunksRetries[chunkId] || 0) + 1; 
      //       fullhref = fullhref.replace(__webpack_require__.p, __webpack_require__.cssChunksFallbackPath);
      //       return setTimeout(function () {
      //         createStylesheet(chunkId, fullhref, resolve, reject)
      //       }, __webpack_require__.cssChunksRetryDelay || 0);
      //     }
          
      //     var errorType = event && (event.type === 'load' ? 'missing' : event.type);
      //     var realHref = event && event.target && event.target.href || fullhref;
      //     var err = new Error("Loading CSS chunk " + chunkId + " failed.\n(" + realHref + ")");
      //     err.code = "CSS_CHUNK_LOAD_FAILED";
      //     err.type = errorType;
      //     err.request = realHref;
      //     linkTag.parentNode.removeChild(linkTag)
      //     reject(err);
      //   }
      //   linkTag.onerror = linkTag.onload = onLinkComplete;
      //   linkTag.href = fullhref;

      //   document.head.appendChild(linkTag);
      // },
    }),
    new HtmlWebpackPlugin({
      // templateParameters: {
      //   'assetsRetry': readFileSync(require.resolve('assets-retry')),
      // },
      
    }),
    new InjectAssetsRetryPlugin({
      domain: ['localhost:3000', 'localhost:3000/cdn-fallback'],
    }),
    // new RetryChunkLoadPlugin({
    //   maxRetries: 1,
    //   retryDelay: 100,
    //   lastResortScript: 'console.log("lastResortScript")',
    //   fallbackPath: '//localhost:3000/cdn-fallback-',
    // }),
  ],
  optimization: {
    chunkIds: 'named',
    // runtimeChunk: true,
    // minimize: true,
  },
  resolve: { extensions: ['.ts'] },
} as Configuration;
