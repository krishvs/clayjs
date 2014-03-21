var path = require('path')
  , appDir = path.dirname(require.main.filename)
  , fs = require('fs')
  , routes = require('../routes');

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
	  });
	routes.addRoutes(app);
}

module.exports.executeMiddleware = executeMiddleware;
