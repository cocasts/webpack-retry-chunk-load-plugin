import * as path from 'path';
import * as express from 'express';

const app = express();
const port = 3000;

// app.get('/main.js', (request, response, next) => {
//   if (
//     request.query['cache-bust'] === 'true' &&
//     request.query['retry-attempt'] === '5'
//   ) {
//     next();
//   } else {
//     response.status(500).send('fail');
//   }
// });

app.get('/main.(css|js)', (request, response, next) => {
  if (
    request.query['cache-bust'] === 'true' &&
    request.query['retry-attempt'] === '5'
  ) {
    next();
  } else {
    response.status(404).send('fail');
  }
});
app.get(
  '/test_integration_fixtures_async_ts.(css|js)',
  (request, response, next) => {
    if (
      request.query['cache-bust'] === 'true' &&
      request.query['retry-attempt'] === '5'
    ) {
      next();
    } else {
      response.status(404).send('fail');
    }
  }
);
// app.get('/main.css', (request, response, next) => {
//   if (
//     request.query['cache-bust'] === 'true' &&
//     request.query['retry-attempt'] === '5'
//   ) {
//     next();
//   } else {
//     response.status(404).send('fail');
//   }
// });

// app.get(
//   '/test_integration_fixtures_async_ts.css',
//   (request, response, next) => {
//     if (
//       request.query['cache-bust'] === 'true' &&
//       request.query['retry-attempt'] === '5'
//     ) {
//       next();
//     } else {
//       response.status(500).send('fail');
//     }
//   }
// );

// app.get('/test_integration_fixtures_async_ts.js', (request, response, next) => {
//   if (
//     request.query['cache-bust'] === 'true' &&
//     request.query['retry-attempt'] === '5'
//   ) {
//     next();
//   } else {
//     response.status(500).send('fail');
//   }
// });

app.use(express.static(path.join(__dirname, 'dist')));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
