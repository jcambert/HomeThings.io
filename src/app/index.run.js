(function() {
  'use strict';

  angular
    .module('homeThingsIo')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log,mqttSocket) {

    $log.debug('runBlock end');
    
    
    mqttSocket.onConnect (function(){
        console.dir("mqtt running");
        mqttSocket.subscribe("toto");
        
    });
    mqttSocket.connect("test.mosquitto.org",8080,"mqtt","toto");
    
  }

})();
