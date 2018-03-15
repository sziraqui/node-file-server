const express = require('express');
const fs = require('fs');
const fileUploader = require('express-fileupload');
const mongodb = require('mongodb');

const app = express();
const MongoClient = mongodb.MongoClient;

app.use(fileUploader());

const dbname = 'szi_data';
const db_url =  "mongodb://localhost/";

let file_index_json = {};
// Init
fs.stat(__dirname+'/uploads', (err, files) => {
  if (err) {
    console.log('fs.stat Error:',err);
    console.log('Attempting to create uploads directory...');
    fs.mkdir(__dirname+'/uploads', (err) => {
      if (err) console.log("fs.mkdir Error:",err);
      else 
        console.log("Succesfully created uploads directory");
    });
  } else
      console.log("INFO: uploads directory exists");
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
    console.log(file_index_json);
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
      "src": __dirname + '/uploads',
    };

    MongoClient.connect(db_url, (err, db) => {
      db.db(dbname)
      .collection("file_index")
      .insert(new_file_index, (err, result) => {
        if (err) return console.log("db.insert Error:", err.message);

        console.log("INFO: New file index added to database");
      });
    });

    response.writeHeader(200, {"Content-Type": "text/html"});
    response.write("file uploaded");
    response.end();
});
const port = 3000;
app.listen(port, () => { console.log(`Listening to port ${port}`)});
