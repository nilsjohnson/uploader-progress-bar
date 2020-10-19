## To run this example
### Install Dependencies
$ npm install

### Start the Server
$ node ./server/server.js

### Start the dev server
$ npm run start

And then you should be good to go!


## Building this example
$npm run build

and then inside of ./server/server.js, uncomment out this line to serve the build:
app.use(express.static(path.join(__dirname, '../build'), { index: 'index.html' }));



This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

