var path = require('path')
  , appDir = path.dirname(require.main.filename)
  , fs = require('fs')
  , path      = require('path')
  , Sequelize = require('sequelize')
  , lodash    = require('lodash')
  , envr      = require(appDir+'/config/database')()
  , sequelize = new Sequelize(envr.database, envr.username, envr.password)
  , db        = {}
 
fs
  .readdirSync(appDir+'/app/models/')
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== 'index.js')
  })
  .forEach(function(file) {
    var model = sequelize.import(path.join(appDir+'/app/models/', file))
    db[model.name] = model
  })
 
Object.keys(db).forEach(function(modelName) {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db)
  }
})
 
module.exports = lodash.extend({
  sequelize: sequelize,
  Sequelize: Sequelize
}, db)