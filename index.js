const express = require('express');
const fs = require('fs');
const fileUploader = require('express-fileupload');
const app = express();

app.use(fileUploader());

app.get('/', (request, response) => {
  fs.readFile('index.html', (err, data) => {
    response.writeHeader(200, {"Content-Type": "text/html"});
    response.write(data);
    response.end();
  });
});

app.post('/upload', (request, response) => {
  if(!request.files) return response.status(400).send("No file uploaded");
    let file = request.files.uploaded_file;
    let filename = file.name;
    file.mv('uploads/'+filename);
    response.writeHeader(200, {"Content-Type": "text/html"});
    response.write("file uploaded");
    response.end();
});
const port = 3000;
app.listen(port, () => { console.log(`Listening to port ${port}`)});
