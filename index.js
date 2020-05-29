const express = require('express');
const cors = require('cors');

const app = express();
const port = 8080;



app.set('port', port);
app.listen(app.get('port'), () => {
  console.log(`Listen at PORT number ${app.get('port')}`);
});

module.exports = app;
