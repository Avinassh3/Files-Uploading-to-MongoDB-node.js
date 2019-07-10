const express = require("express");
const path = require("path");
const bodyparser = require("body-parser");
const app = express();
const mongoose = require("mongoose");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
const crypto = require("crypto");
const URLS = require("./Security/mydetails");

// Start of setting up middleware

//Setting up Body Parser to parse JSON data
//app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json());

// Setting up override middleware
app.use(methodOverride("_method"));

//Setting up view engine EJS
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//End of Setting middleware

//Setting up port
const port = process.env.PORT || 3000;

//creating database connection by getting uri
const mongooseuri = URLS.mongoURL;
var conn = mongoose.createConnection(mongooseuri);

// gfs init

let gfs;
conn.once("open", () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("Uploads");
  // all set!
});

//Create storage object from multer dont woory code is present in multer-gridfs api :)
var storage = new GridFsStorage({
  url: mongooseuri,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "Uploads"
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

//@route:GET
//@access:PUBLIC
//@desciption:Intro and landing page
app.get("/", (req, res) => {
  gfs.files.find().toArray((err, files) => {
    //Check if files exist or not
    if (!files || files.length === 0) {
      res.render("index", { file: false });
    } else {
      files.map(file => {
        if (
          file.contentType === "image/jpeg" ||
          file.contentType === "image/png"  ||
          file.contentType === "image/jpg"
        ) {
          file.isImage = true;
        } else {
          file.isImage = false;
        }
      });
      res.render("index", { file: files });
    }
  });
});

//@route:POST
//@access:PUBLIC
//@desciption:Uploading file BY adding created middleware between post request

app.post("/upload", upload.single("file"), (req, res) => {
    res.redirect('/')
  //res.render('index',{ files: req.file,status:true });
});
//@route:GET
//@access:PUBLIC
//@desciption:Display all files in json
app.get("/files", (req, res) => {
  gfs.files.find().toArray((err, files) => {
    //Check if files exist or not
    if (!files || files.length === 0) {
      res.status(404).json({ files: "No files Exist" });
    } else {
      res.json(files);
    }
  });
});

//@route:GET
//@access:PUBLIC
//@desciption:Display particular file
//@important: Route sholud be named files
app.get("/files/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (!file || file.length === 0) {
      res.status(404).json({ file: "No file Exist" });
    } else {
      res.json(file);
    }
  });
});

//@route:GET
//@access:PUBLIC
//@desciption:Display particular file
//@important: Route sholud be named files
app.get("/image/:filename", (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
      if (!file || file.length === 0) {
        res.status(404).json({ file: "No file Exist" });
      } else {
        const read=gfs.createReadStream(file.filename);
        read.pipe(res);
      }
    });
  });

app.listen(port, () => {
  console.log(`Server is up and it is running localhost:${port}`);
});
