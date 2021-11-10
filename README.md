
<p align="center">
  <img src="https://github.com/rowlinsonmike/s3-http-server/blob/main/docs/logo.svg" width="150" title="logo">
</p>
  <h1 align="center" >S3 HTTP Server</h1>
  <p align="center"><i>A simple command-line S3 http server</i></p>

<br/>
<p>
This cli makes your S3 objects available via a HTTP interface. A simple website interface is provided for navigation and uploading. Another use case is serving a static website using the `-w` switch. 
</p>


## Installation

```bash
npm install --global s3-http-server
```

## Usage

*Make sure you have AWS credentials available in the environment you execute the package in.*

```
s3-http-server [path] [options]
```

path is the unique bucket name to serve

*Now you can visit http://localhost:8080 to view your server*

## Available Options

| Command         | 	Description         | Defaults  |
| -------------  |-------------|-------------|
|`-h` or `--help` |Print this list and exit. |   |
|`-w` or `--web` |Serve a website. |   |

## Serve a static website

`index.html` file must be present at the bucket root

```bash
s3-http-server my-bucket-name -w
```

## Todo

- delete object ability

## Authors

- [@rowlinsonmike](https://www.github.com/rowlinsonmike) 
