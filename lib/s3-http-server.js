const express = require("express");
const app = express();
const stream = require("stream");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");

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
      s3.getObject({
        Bucket: bucket,
        Key: decodeURI(req.originalUrl.substring(1)),
      })
        .on("error", (err) => {
          console.log(err);
        })
        .on("httpData", (chunk) => {
          readStream.push(chunk);
        })
        .on("httpDone", () => {
          readStream.end();
        })
        .send();
      readStream.pipe(res);
      return;
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

module.exports = { createServer };
