/*global WorkerGlobalScope, self*/

var easy5 = {

	Worker: function(){

		var constants = {
			EASY5_FUNCTION_PREFIX: 'easy5.FUNCTION:'
		};

		var isSelfWorker = function(){ // check if code is running inside Worker
			return typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
		};

		var args = Array.prototype.slice.call(arguments), // convert arguments passed to constructor into standard JS array
			callbacks = [], // stores functions exchanged between Web Worker and its parent
			freeCallbacks = [], // stores callbacks free keys
			config = {}, // default config value
			jsonRpcConfig = {}, // default jsonRpcConfig value
			worker; // Web Worker or window object (see line 30)

		if(args.length > 1){ // check which version of constructor is used
			config = args[0];
			jsonRpcConfig = args[1];
		} else{
			jsonRpcConfig = args[0];
		}

		jsonRpcConfig.local = jsonRpcConfig.local || {};
		jsonRpcConfig.remote = jsonRpcConfig.remote || {};

		worker = config.worker && !isSelfWorker() ? new Worker(config.worker) : self; // check if code is not running inside Web Worker and there's config.worker property; if so - set worker to new Worker object, otherwise - set it to self (WorkerGlobalScope)

		var returnResult = function(id, result, called){ // return result from Web Worker to parent or vice versa using JSON-RPC protocol; "called" argument is true when function is called from code, not by returning result using "return" keyword
			worker.postMessage({
				result: called ? result[0] : result,
				error: null,
				id: id
			});
		};

		worker.addEventListener('message', function(e){
			if(e.data.hasOwnProperty('method') && jsonRpcConfig.local.hasOwnProperty(e.data.method)){
				for(var i in e.data.params){
					if(e.data.params.hasOwnProperty(i) && typeof e.data.params[i] === "string" && e.data.params[i].indexOf(constants.EASY5_FUNCTION_PREFIX) === 0){ // check if arg[i] should be converted to function
						var id = e.data.params[i].split(':').pop();
						e.data.params[i] = function(){
							returnResult(id, Array.prototype.slice.call(arguments), true);
						};
					}
				}
				var result = jsonRpcConfig.local[e.data.method].apply(null, e.data.params);
				if(result && e.data.hasOwnProperty('id')){ // check if local function returned any data and we know where to hand on it
					returnResult(e.data.id, result);
				}
			} else if(e.data.hasOwnProperty('result') && callbacks[e.data.id]){
				callbacks[e.data.id].apply(null, [e.data.result]);
				callbacks[e.data.id] = null; // function has been already called so we can delete it from callbacks array
				freeCallbacks.push(e.data.id); // add e.data.id to freeCallbacks "cache"; next time callback won't be added to the end of callbacks array, but placed in free space; it prevents callbacks array to be like [null, null, ..., null, some_function]
			}
		}, false);

		var call = function(name, args){ // "call" remote function
			args = Array.prototype.slice.call(args); // convert arguments into standard JS array
			var id = null; // set id for response to null (default)
			if(jsonRpcConfig.remote[name].hasOwnProperty('return') && jsonRpcConfig.remote[name].return === true){ // check if remote function should return result using "return" keyword
				if(freeCallbacks.length > 0){ // check if there are free callbacks keys
					id = freeCallbacks.shift();
					callbacks[id] = args.pop();
				} else{
					id = callbacks.push(args.pop())-1; // there's no free keys, add callback function to the end of callbacks array
				}
			}
			for(var i in args){
				if(args.hasOwnProperty(i) && typeof args[i] === "function"){ // check if any of args is function; if so - add it to callbacks array and replace this arg with string indicating that receiver should convert it back to function (postMessage() doesn't allow you to send functions, only primitive data types)
					var fid;
					if(freeCallbacks.length > 0){      //
						fid = freeCallbacks.shift();     //
						callbacks[fid] = args[i];        // do almost the same as above
					} else{                            //
						fid = callbacks.push(args[i])-1; //
					}
					args[i] = constants.EASY5_FUNCTION_PREFIX+fid;
				}
			}
			worker.postMessage({
				method: name,
				params: args,
				id: id
			});
		};

		for(var name in jsonRpcConfig.remote){ // "stub" remote functions; it allows you to use remote functions like normal functions (e.g. remote.functionName(arguments))
			if(jsonRpcConfig.remote.hasOwnProperty(name)){
				(function(o, name){
					o[name] = function(){
						call(name, arguments);
					};
				})(this, name);
			}
		}

		this.terminate = function(){ // check if code is running inside Web Worker; if so - return false, otherwise - terminate worker and return true
			if(isSelfWorker()){
				return false;
			} else{
				worker.terminate();
				return true;
			}
		};

	}

};
