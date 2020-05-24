const express = require('express');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());

app.get('/', (req, res) => {
  res.status(200).send('Hello World');
});

app.set('port', port);
app.listen(app.get('port'), () => {
  console.log(`Listen at PORT number ${app.get('port')}`);
});

module.exports = app;
