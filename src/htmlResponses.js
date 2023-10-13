const fs = require('fs');

const index = fs.readFileSync(`${__dirname}/../hosted/index.html`);
const css = fs.readFileSync(`${__dirname}/../hosted/style.css`);
const js = fs.readFileSync(`${__dirname}/../hosted/bundle.js`);

const respond = (request, response, data, type) => {
  response.writeHead(200, { 'Content-Type': type });
  if (request.method !== 'HEAD') response.write(data);
  response.end();
};

const getIndex = (request, response) => respond(request, response, index, 'text/html');

const getCSS = (request, response) => respond(request, response, css, 'text/css');

const getJS = (request, response) => respond(request, response, js, 'application/javascript');

module.exports = {
  getIndex,
  getCSS,
  getJS,
};
