var express  = require('express');
var cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());

app.get('/', (req, res) => {
    res.status(200).send('Hello World');
})

app.listen(app.get('port'), () => {
    console.log(`Listen at PORT number ${app.get('port')}`);
});

module.exports = app;