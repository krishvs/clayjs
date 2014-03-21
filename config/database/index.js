var path = require('path')
  , appDir = path.dirname(require.main.filename)
  , fs = require('fs')
  , path      = require('path')
  , Sequelize = require('sequelize')
  , config      = require(appDir+'/config/database')
  , envr = config[process.argv[2]] || config.development
  , sequelize = new Sequelize(envr.database, envr.username, envr.password, envr.options ? envr.options : null)
  , db        = {};

var force = false;
if(process.argv.indexOf('migrate') != -1){
  force = true;
}

var db = {
  sequelize: sequelize,
  Sequelize: Sequelize,
  startDb : startDb
}

var walk = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var i = 0;
    (function next() {
      var file = list[i++];
      if (!file) return done(null, results);
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            next();
          });
        } else {
          results.push(file);
          next();
        }
      });
    })();
  });
};

function startDirWalk(app,server,callback){
  walk(appDir+'/app/models', function(err, results) {
    if (err) throw err;
    results.filter(function(file) {
      return (file.indexOf('.') !== 0) && (file !== 'index.js')
    })
    .forEach(function(file) {
      var model = sequelize.import(file);
      db[model.name] = model
    })

    Object.keys(db).forEach(function(modelName) {
      if ('associate' in db[modelName]) {
        db[modelName].associate(db)
      }
    })
   sequelize
    .sync({ force : force})
    .complete(function(err) {
      if (err) {
        console.log('we have an error here');
        throw err;
      }
      else{
        console.log('Run all the db migrations');
        var parent  =  require('../../index.js')
        parent.set(db,db);
        callback(app,server)
      }
    });
  });
}


function startDb(app,server,callback){
   startDirWalk(app,server,callback);
}



module.exports = db