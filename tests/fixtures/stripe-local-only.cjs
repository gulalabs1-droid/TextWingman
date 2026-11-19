const http = require('node:http');
const https = require('node:https');
const originalRequest = https.request;

// Redirect Stripe SDK calls to the test's loopback server, never the network.
https.request = function (options, ...args) {
  if (typeof options !== 'object' || options.host !== 'api.stripe.com') return originalRequest.call(this, options, ...args);
  const request = http.request({
    host: '127.0.0.1', port: Number(process.env.CHECKOUT_TEST_PORT),
    path: `/stripe${options.path}`, method: options.method, headers: options.headers, agent: false,
  }, ...args);
  request.on('socket', socket => {
    if (socket.connecting) socket.once('connect', () => socket.emit('secureConnect'));
  });
  return request;
};
