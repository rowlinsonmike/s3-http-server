#!/usr/bin/env node

const argv = require("minimist")(process.argv.slice(2));

process.title = "s3-http-server";

if (argv.h || argv.help || !argv._.length) {
  console.log(`
  usage: s3-http-server [bucket] [options]
  -h --help          Print this list and exit.
  `);
  process.exit();
}
const bucket = argv._[0];
const port = 8080;
const httpServer = require("../lib/s3-http-server").createServer({ bucket });

httpServer.listen(port, function () {
  console.log(`
    Available on:
    - http://0.0.0.0:${port}
    - http://localhost:${port}
    `);
});
