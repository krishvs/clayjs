var path = require('path')
  , appDir = path.dirname(require.main.filename)
var fs = require('fs');

function executeAfterStart(app)
{
	fs
	  .readdirSync(appDir+'/config/after-start')
	  .filter(function(file) {
	    return (file.indexOf('.') === -1)
	  })
	  .forEach(function(file) {
	    require(appDir+'/config/after-start/'+file).execute(app);
	  })
}

module.exports.executeAfterStart = executeAfterStart;