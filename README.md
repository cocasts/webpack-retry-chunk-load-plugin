# webpack-retry-chunk-load-plugin

> ! this project is forked from https://github.com/mattlewis92/webpack-retry-chunk-load-plugin

[![Build Status](https://travis-ci.org/cocasts/webpack-retry-chunk-load-plugin.svg?branch=master)](https://travis-ci.org/cocasts/webpack-retry-chunk-load-plugin)
[![codecov](https://codecov.io/gh/cocasts/webpack-retry-chunk-load-plugin/branch/master/graph/badge.svg)](https://codecov.io/gh/cocasts/webpack-retry-chunk-load-plugin)
[![npm version](https://badge.fury.io/js/webpack-retry-chunk-load-plugin.svg)](http://badge.fury.io/js/webpack-retry-chunk-load-plugin)
[![GitHub issues](https://img.shields.io/github/issues/cocasts/webpack-retry-chunk-load-plugin.svg)](https://github.com/cocasts/webpack-retry-chunk-load-plugin/issues)
[![GitHub stars](https://img.shields.io/github/stars/cocasts/webpack-retry-chunk-load-plugin.svg)](https://github.com/cocasts/webpack-retry-chunk-load-plugin/stargazers)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/cocasts/webpack-retry-chunk-load-plugin/master/LICENSE)

A webpack plugin to retry loading of async chunks that failed to load

<img width="827" alt="screenshot 2018-10-24 at 21 47 39" src="https://user-images.githubusercontent.com/37169906/173486851-20c34354-7026-456e-83f5-038d28b50638.png">

## Usage

```javascript
// webpack.config.js
const { RetryChunkLoadPlugin } = require('webpack-retry-chunk-load-plugin');

plugins: [
  new RetryChunkLoadPlugin({
    // optional stringified function to get the cache busting query string appended to the script src
    // if not set will default to appending the string `?cache-bust=true`
    cacheBust: `function() {
      return Date.now();
    }`,
    // optional value to set the amount of time in milliseconds before trying to load the chunk again. Default is 0
    // if string, value must be code to generate a delay value. Receives retryCount as argument 
    // e.g. `function(retryAttempt) { return retryAttempt * 1000 }`
    retryDelay: 3000,
    // optional value to set the maximum number of retries to load the chunk. Default is 1
    maxRetries: 5,
    // optional list of chunks to which retry script should be injected
    // if not set will add retry script to all chunks that have webpack script loading
    chunks: ['chunkName'],
    // optional code to be executed in the browser context if after all retries chunk is not loaded.
    // if not set - nothing will happen and error will be returned to the chunk loader.
    lastResortScript: "window.location.href='/500.html';",
    /**
     * optional string value to load chunk using fallback path
     * if set will try one more time using fallback path after max retries failed
     */
    fallbackPath: '//cdn-fallback.com/',
  }),
];
```

## Requirements

- webpack > 5.0.0

## License

MIT
