(function(angular,mqtt) {
  'use strict';
  angular
  .module('homeThingsIo')
  .factory('mqttSocket', function($rootScope,$log){
        var service = {};
        var client = {};
        var onConnectionLost =function(response){};
        var onMessageArrived = function(message){};
        var onConnect = function(){};
        service.connect = function(host, port,clientId) {
            
            $log.log("Try to connect to MQTT Broker " + host + " with user " + clientId);
            client = new mqtt.Client(host,parseInt(port),clientId);

            client.onConnectionLost = function(response){
                if (response.errorCode !== 0)
	                   $log.log("onConnectionLost:"+response.errorMessage);
                onConnectionLost(response);
                $log.log('Mqtt connection is lost');
                $rootScope.$broadcast("MQTT.CONNECTION_CLOSE");
            } ;
            client.onMessageArrived =function(message){
                onMessageArrived(message);
                $log.log('Message arrived:'+message.payloadString);
            } 
            client.connect({onSuccess:function(){
                 onConnect();
                 $log.log("Mqtt connection is open");
                 $rootScope.$broadcast("MQTT.CONNECTION_OPEN")
            }});
        }



        service.publish = function(topic, payload) {
            client.publish(topic,payload, {retain: true});
            $log.log('publish-Event sent '+ payload + ' with topic: ' + topic + ' ' + client);
        }

        service.onMessage = function(callback) {
            onMessageArrived = callback;
        }

        service.onConnectionLost = function(callback){
            onConnectionLost=callback;
            
        }
        
        service.onConnect = function(callback){
            onConnect = callback;
           
        }
        
        service.subscribe = function(topic){
            client.subscribe(topic);
            $log.log('subscribe to topic:'+topic);
        }
        
        return service;
  })
})(angular,Paho.MQTT);

