Easy5
=====

Easily use HTML5 technologies such as Web Worker.

**Currently Easy5 provide wrapper only for Web Worker technology.**

easy5.Worker
------------

Extremely easy communication between Worker and main thread.

**Index:** [API](#WorkerAPI), [Examples](#WorkerExamples)

### <a name="WorkerAPI"></a>API ###
<hr />

```
easy5.Worker(config, jsonRpcConfig)
```

or

```
easy5.Worker(jsonRpcConfig)
```

Configure and initialize object.

**config** is object with following properties:
* **worker**: path to Worker .js file (do not apply this property when creating easy5.Worker object inside Worker .js)

Example:

```
{
 worker: "path/to/worker.js"
}
```

**jsonRpcConfig** is object with following properties:
* **local**: object with local functions. Key is function name, value is function
* **remote**: object with remote functions to stub. Key is remote function name, value is object with additional ***options*** or empty ``{}`` object. ***Options*** can have following properties:
  * **return**: *true* if remote function returns value using ``return`` keyword. In this case you can receive response by adding callback function as ***last argument*** when calling. This callback function won't be applied to remote function (<b><i>last argument</i></b> will be removed). More in [examples](#WorkerExamples).

Example:

```
{
 local: {
  functionOne: function(){
   return 'one';
  },
  functionTwo: function(someArg){
   doSth(someArg);
  }
 },
 remote: {
  functionThree: {},
  functionFour: {
   return: true
  }
 }
}
```

### <a name="WorkerExamples"></a>Examples ###
<hr />

**test.html**
```html
<script type="text/javascript" src="easy5.min.js"></script>
<script type="text/javascript">

 function doSth(){
  alert("I'm doing something");
 }

 var worker = new easy5.Worker({
  worker: "test.worker.js"
 }, {
  local: {
   doSth: doSth
  },
  remote: {
   doSth2: {},
   doSth3: {
    return: true
   }
  }
 });
 
 // now you can call functions in worker like "normal" functions
 
 worker.doSth2(function(data){
  alert(data.someKey); // will alert "value" (see doSth2 function in test.worker.js)
  worker.doSth3(data.someKey, function(data){
   alert(data); // will alert "VALUE" (see doSth3 function in test.worker.js)
  });
 });
 
</script>
```

**test.worker.js**

```javascript
importScripts('easy5.min.js');

var doSth2 = function(callback){
 // some code here
 callback({
  someKey: 'value'
 });
};

var parent = easy5.Worker({
 local: {
  doSth2: doSth2,
  doSth3: function(str){
   return str.toUpperCase();
  }
 },
 remote: {
  doSth: {}
 }
});

// now you can call functions in parent window like "normal" functions

parent.doSth(); // will alert "I'm doing something" (see doSth function in test.html)
```
