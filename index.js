var path = require('path')
  , appDir = path.dirname(require.main.filename)
  , express = require('express')
  , middleware = require('./config/middleware')
  , routes = require('./config/routes')
  , cons = require('consolidate')
  , envr = require(appDir+'/config/environment')()
  , async = require('async')
  , view = require(appDir+'/config/view')
  , after_start = require('./config/after-start')
  , db  = require('./config/database');

var app = express();

function setViewEngine()
{
  app.engine(view.engine,cons[view.engine]);
  app.set('template_engine',view.engine);
  app.set('view engine',view.engine);
}

function start()
{
  setViewEngine();
  var server = app.listen(envr.port);
  set(server,server);
  app.use(express.cookieParser());
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.multipart());
  app.use(express.bodyParser());
  app.use(express.session({ secret: 'so secret' }));
  app.use(express.static(appDir+'/public'));
  app.set('views',appDir+'/app/views');
  db.startDb(app,server,middleware.executeMiddleware);
  console.log('The app is listening in the port '+envr.port)
}

function set(key,value)
{
  module.exports[key] = value;
}

module.exports = {
  start : start,
  app : app,
  db: db,
  set : set
}
