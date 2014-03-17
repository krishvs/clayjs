var path = require('path')
  , appDir = path.dirname(require.main.filename)
  , fs = require('fs');

function executeMiddleware(app,server)
{
	fs
	  .readdirSync(appDir+'/app/middleware')
	  .filter(function(file) {
	    return (file.indexOf('.') === -1)
	  })
	  .forEach(function(file) {
	    var middleware = require(appDir+'/app/middleware/'+file)
	    if(middleware.execute)
	    	middleware.execute(app,server);
	  })
}

module.exports.executeMiddleware = executeMiddleware;
