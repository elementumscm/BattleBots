const express = require('express');

// Initialize web server
const app = express();
app.use(express.static('web'));

const port = 8001;
const server = app.listen(port, () => {
  console.log(`Tank battle server running on port ${port}!`);
});

module.exports = server;
