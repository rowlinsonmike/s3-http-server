const express = require("express");
const app = express();
const stream = require("stream");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const mime = require("mime");

const awsHeaders = ["content-type", "last-modified"];

const getObjectMiddleware = (req, res, bucket, key = null, headers = true) => {
  const Key = key || req.originalUrl.substring(1);
  res.header("x-s3-key", Key);
  res.header("cache-control", "no-cache");
  const readStream = new stream.PassThrough();
  s3.getObject({
    Bucket: bucket,
    Key,
  })
    .on("error", (err) => {
      console.log(err);
    })
    .on("httpData", (chunk) => {
      readStream.push(chunk);
    })
    .on("httpHeaders", (statusCode, s3Headers) => {
      if (!headers) {
        return;
      }
      awsHeaders.forEach((header) => {
        let value = s3Headers[header];
        if (header === "content-type" && value === "application/octet-stream") {
          value = mime.lookup(req.path);
        }
        res.set(header, value);
      });
    })
    .on("httpDone", () => {
      readStream.end();
    })
    .send();
  readStream.pipe(res);
  return;
};

const createServer = ({ bucket }) => {
  //setup pug view engine
  app.set("views", path.join(__dirname, "/views"));
  app.set("view engine", "pug");
  app.use("/static", express.static(path.join(__dirname, "/public")));
  //upload route
  app.post("*", async (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {
      const { originalFilename, filepath } = files.filetoupload;
      const rawData = fs.readFileSync(filepath);
      await s3
        .upload({
          Bucket: bucket,
          Key: req.originalUrl.substring(1) + originalFilename,
          Body: rawData,
        })
        .promise();
      return res.redirect(".");
    });
  });
  //get route, download route
  app.get("*", async (req, res) => {
    if (req.originalUrl.charAt(req.originalUrl.length - 1) !== "/") {
      const readStream = new stream.PassThrough();
      const fileName = req.originalUrl.substring(1).split("/").pop();
      res.set("Content-disposition", "attachment; filename=" + fileName);
      return getObjectMiddleware(req, res, bucket);
    }
    const Prefix =
      req.originalUrl.length > 1 ? req.originalUrl.substring(1) : "";
    const s3Res = await s3
      .listObjectsV2({
        Bucket: bucket,
        Prefix,
        Delimiter: "/",
        MaxKeys: 1000,
      })
      .promise();
    const data = [
      ...s3Res.CommonPrefixes.map(({ Prefix }) => ({
        Key: Prefix,
        isDir: true,
      })),
      ...s3Res.Contents.filter((c) => c.Key !== Prefix).map(({ Key }) => ({
        Key,
        isDir: false,
      })),
    ];
    res.render("index", {
      Prefix,
      bucket,
      data,
    });
  });
  return app;
};

const createWebServer = ({ bucket }) => {
  app.get("/", async (req, res) => {
    res.setHeader("Content-Type", "text/html");
    return getObjectMiddleware(req, res, bucket, "index.html", false);
  });
  app.get("*", async (req, res) => {
    return getObjectMiddleware(req, res, bucket);
  });
  return app;
};

module.exports = { createServer, createWebServer };
