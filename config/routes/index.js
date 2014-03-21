var path = require('path')
  , appDir = path.dirname(require.main.filename)
  , config_routes = require(appDir+'/config/routes')
  , after_start = require('../after-start');
var app = null;

var resourceMap = [ {
		verb : 'get',
		addToPath : '',
		action : 'index'
	},{
		verb : 'get',
		addToPath : '/new',
		action : 'new'
	},{
		verb : 'post',
		addToPath : '',
		action : 'create'
	},{
		verb : 'get',
		addToPath : '/:id',
		action : 'show'
	},{
		verb : 'get',
		addToPath : '/:id/edit',
		action : 'edit'
	}, {
		verb : 'patch',
		addToPath : '/:id',
		action : 'update'
	},{
		verb : 'put',
		addToPath : '/:id',
		action : 'update'
	}, {
		verb : 'delete',
		addToPath : '/:id',
		action : 'destroy'
	}
]

function intermediate(next)
{
	 next.res.on('finish', (function(){
	    var res = next;
	    async.map(this,function(item,callback)
	    	{
	    		item(res);
	    		callback(null,res);
	    	},function(){
	    });
	  }).bind(this));
}

var Filters = {
};

function mapFilters(controller,controllerName)
{
	var verbs = ['*','index','new','create','show','edit','update','destroy']
	if(Filters[controllerName])
	{
		return Filters[controllerName];
	}
	Filters[controllerName] = [];
	var filters  = Filters[controllerName];
	filters.routeBeforeFilters = {};
	filters.routeAfterFilters = {};
	verbs.forEach(function(verb){
		filters.routeBeforeFilters[verb] = [];
		filters.routeAfterFilters[verb] = [];
	})
	if(controller.beforeFilters)
	{
		var beforeFilters = controller.beforeFilters;
		if(beforeFilters){
			beforeFilters.forEach(function(beforeFilter){
				if(beforeFilter.actions)
				beforeFilter.actions.forEach(function(action)
				{
					if(!filters.routeBeforeFilters[action]){
						filters.routeBeforeFilters[action] = [];
					}
					filters.routeBeforeFilters[action].push(beforeFilter.method);
				})
			});
		}
	}
	if(controller.afterFilters)
	{
		var afterFilters = controller.afterFilters;
		afterFilters.forEach(function(afterFilter){
			afterFilter.actions.forEach(function(action)
			{
				if(!filters.routeAfterFilters[action]){
					filters.routeAfterFilters[action] = [];
				}
				filters.routeAfterFilters[action].push(afterFilter.method);
			})
		});
	}
	return filters;
}

function applyFilters(map,path,key,controller,filters,alias)
{
	var finalpath = path.substring(0);
	var addToPath = map.addToPath;
	if(!alias){
		finalpath = finalpath + addToPath.replace(':id',':'+key+'_id');
	}
	else if((addToPath.length == 0) && (finalpath == 'root')){
			finalpath = '/'
	}
	if(controller[map.action])
	{
		var callbacks = [controller[map.action]];
		if(!filters.routeBeforeFilters[map.action]){
			filters.routeBeforeFilters[map.action] = [];
		}
		if(!filters.routeAfterFilters[map.action]){
			filters.routeAfterFilters[map.action] = [];
		}
		if(filters.routeBeforeFilters[map.action].length > 0)
		{
			var before_filter_callbacks = filters.routeBeforeFilters[map.action].concat(filters.routeBeforeFilters['*']);
			callbacks = before_filter_callbacks.concat(callbacks);
		}
		if(filters.routeAfterFilters[map.action].length > 0)
		{
			var after_filter_callbacks = filters.routeAfterFilters[map.action].concat(filters.routeAfterFilters['*']);
			callbacks.push(intermediate.bind(after_filter_callbacks));
		}
	   console.log(finalpath+' '+map.verb+' ',callbacks);
		app[map.verb](finalpath,callbacks);
	}
}

function generateResourceMap(route,key,path)
{
	var controller = require(appDir+'/app/controllers/'+route.resources);
	var filters = mapFilters(controller,route.resources)
	resourceMap.forEach(function(map){
		applyFilters(map, path, key, controller,filters);
	});
	if(route.nested)
	{
		for(var child in route.nested)
		{
			if(route.nested[child].resources)
			{
				var nested_path = path+'/:'+key+'_id/'+route.nested[child].resources;
				generateResourceMap(route.nested[child],route.nested[child].resources,nested_path);
			}
		}
	}
}

function findInMap(action)
{
	var found = null;
	for(var i=0;i<resourceMap.length;i++){
		if(resourceMap[i].action === action){
			found =  resourceMap[i];
			break;
		}
	}
	return found;
}

function addRoutes(express)
{
	app = express;
	var router = config_routes.routes
	for (var key in router) {
	  if (router.hasOwnProperty(key)) {
	  	var path = key;
	  	if(router[key].namespace)
	  	{
	  		for(var route in router[key].namespace)
	  		{
	  			path = '';
	  			path = key + route
	  			if(router[key].namespace.hasOwnProperty(route))
	  				generateResourceMap(router[key].namespace[route],router[key].namespace[route].resources,path);
	  		}
	  	}
	    else if(router[key].resources)
	    {
	    	generateResourceMap(router[key],router[key].resources,path)
	    }
	    else
	    {
	    	var filters= mapFilters(require(appDir+'/app/controllers/'+router[key].to),router[key].to);
	    	var alias = true;
	    	var map = findInMap(router[key].action);
	    	if(!map){
	    		map = {
					verb : router[key].verb,
					addToPath : router[key].addToPath ? router[key].addToPath : '' ,
					action : router[key].action
				}
	    	}
	    	applyFilters(map, path, key, require(appDir+'/app/controllers/'+router[key].to),filters,alias);
	    }
	  }
	}
	after_start.executeAfterStart(app);
}

module.exports.addRoutes = addRoutes;
