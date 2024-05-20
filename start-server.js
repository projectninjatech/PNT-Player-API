require('dotenv').config();
const httpServer = require('http-server');
const path = require('path');

const directory = process.env.HTTP_SERVER_MEDIA_DIR
const absolutePath = path.resolve(directory);

console.log(`Starting HTTP server for ${absolutePath}`);

const server = httpServer.createServer({
  root: absolutePath,
  cache: -1,
});

server.listen(8080, () => {
  console.log(`Server running at http://localhost:8080/`);
});
