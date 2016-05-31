(function(angular) {
  'use strict';

  angular
    .module('homeThingsIo')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log,mqttSocket,Datasource) {

    $log.debug('runBlock end');
    
    
   mqttSocket.onConnect (function(){
        console.dir("mqtt running");
        mqttSocket.subscribe("toto");
        
    });
    mqttSocket.connect("test.mosquitto.org",8080,"mqtt","clientid");
    
    /*var ds=new Datasource();
    ds.instance={
        onNameChanged:function(oldValue,newValue){
            $log.log('datasource name changed to:'+newValue);
        }
    };
    ds.name="OpenWeather Datasource";*/
  }

})(angular);
