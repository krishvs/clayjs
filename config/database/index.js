var path = require('path')
  , appDir = path.dirname(require.main.filename)
  , fs = require('fs')
  , path      = require('path')
  , Sequelize = require('sequelize')
  , lodash    = require('lodash')
  , envr      = require(appDir+'/config/database')()
  , sequelize = new Sequelize(envr.database, envr.username, envr.password)
  , db        = {};

var force = false;
if(process.argv.indexOf('migrate') != -1){
  force = true;
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


walk(appDir+'/app/models', function(err, results) {
  if (err) throw err;
  console.log(results);
  results.filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== 'index.js')
  })
  .forEach(function(file) {
    var model = sequelize.import(file)
    module.exports[model.name] = model
  })

  Object.keys(db).forEach(function(modelName) {
    if ('associate' in db[modelName]) {
      module.exports[modelName].associate(db)
    }
  })

});

function startDb(){
   sequelize
    .sync({ force : force})
    .complete(function(err) {
      if (err) {
        console.log('we have an error here');
        throw err;
      }
      else{
        console.log('Run all the db migrations');
      }
    });
}



module.exports = {
  sequelize: sequelize,
  Sequelize: Sequelize,
  startDb : startDb
}