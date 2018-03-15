const express = require('express');
const fs = require('fs');
const fileUploader = require('express-fileupload');
const mongodb = require('mongodb');
const path = require('path');
const thumb = require('video-thumbnail');

const app = express();
const MongoClient = mongodb.MongoClient;

app.use(fileUploader());

const dbname = 'szi_data';
const db_url =  "mongodb://localhost/";

let file_index_json = {};
// Init
fs.stat(path.join(__dirname,'uploads'), (err, files) => {
  if (err) {
    console.log('fs.stat Error:',err);
    console.log('Attempting to create uploads directory...');
    fs.mkdir(path.join(__dirname,'uploads'), (err) => {
      if (err) console.log("fs.mkdir Error:",err);
      else {
        fs.chmodSync(path.join(__dirname,'uploads'), 0o777);
        console.log("Succesfully created uploads directory");
      }
    });
  } else 
      console.log("INFO: uploads directory exists");
});

fs.stat(path.join(__dirname,'thumbs'), (err, files) => {
  if (err) {
    console.log('fs.stat Error:',err);
    console.log('Attempting to create thumbs directory...');
    fs.mkdir(path.join(__dirname,'thumbs'), (err) => {
      if (err) console.log("fs.mkdir Error:", err);
      else {
        fs.chmodSync(path.join(__dirname,'thumbs'), 0o777);
        console.log("Succesfully created thumbs directory");
      }
    });
  } else
      console.log("INFO: thumbs directory exists");
});

//Db Init
MongoClient.connect(db_url, (err, db) => {
  if (err) return console.log("MongoClient.connect Error:", err.message);
  let collection = db.db(dbname).collection('file_index');
  collection.find().toArray((err, docs) => {
    file_index_json = docs;
  });
});

app.get('/', (request, response) => {
  fs.readFile('index.html', (err, data) => {
    response.writeHeader(200, {"Content-Type": "text/html"});
    response.write(data);

    if (Object.keys(request.query).length > 0 && typeof request.query.status === 'string') {
      let last_status = `<span style="margin: 8px">${request.query.status}</span><br>`;
      response.write(last_status);
    }
    imgs_header = `<span style="margin:16px">All uploads</span><br><hr>`
    response.write(imgs_header);
    file_index_json.forEach(element => {
      img_entry = `<img style="margin:16px" alt="Thumb" src=${element.src}/><br>`
      response.write(img_entry);
    });

    response.end();
  });
});

app.post('/upload', (request, response) => {
  if(!request.files) return response.status(400).send("No file uploaded");
    let file = request.files.uploaded_file;
    let filename = file.name;
    file.mv('uploads/'+filename);

    let new_file_index = {
      "name": file.name,
      "src": path.join(__dirname, 'uploads'),
    };
    thumb.video(new_file_index.src, path.join(__dirname,path.join('thumb',)), {width: 200, silent:true}).then(()=>{
      console.log('Done!')
  }).catch((err)=>{
      console.log(err)
  });
    MongoClient.connect(db_url, (err, db) => {
      db.db(dbname)
      .collection("file_index")
      .insert(new_file_index, (err, result) => {
        if (err) {
          response.redirect('/?valid=FAILED');
          return console.log("db.insert Error:", err.message);
      }
        console.log("INFO: New file index added to database");
        response.redirect('/?status=SUCCESS');
      });
    }); 
});
const port = 3000;
app.listen(port, () => { console.log(`Listening to port ${port}`)});
