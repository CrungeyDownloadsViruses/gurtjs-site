const express = require("express");
app = express();
//host on 80
app.listen(80);

app.get("/", ({ req, res }) => {
  res.sendFile(path.join(__dirname, "index1.html"));
  
})