importScripts('easy5.min.js');

var doSth2 = function(callback){
 // some code here
 callback({
  someKey: 'value'
 });
};

var parent = new easy5.Worker({
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