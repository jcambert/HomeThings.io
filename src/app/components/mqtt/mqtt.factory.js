(function(angular,Paho) {
  'use strict';
  angular
  .module('homeThingsIo')
  .factory('mqttSocket', function($rootScope,$log){
        var service = {};
        var client = {};

        service.connect = function(host, port, user, password) {
            var options = {
            username: user,
            password: password
            };
            $log.log("Try to connect to MQTT Broker " + host + " with user " + user);
            client = new Paho.MQTT.Client(host,parseInt(port),options);
            client.subscribe(user+"/#"); 

            client.on('error', function(err) {
                $log.log('error!', err);
                client.stream.end();
            });

            client.on('message', function (topic, message) {
            service.callback(topic,message);
            });
        }

        service.publish = function(topic, payload) {
            client.publish(topic,payload, {retain: true});
            $log.log('publish-Event sent '+ payload + ' with topic: ' + topic + ' ' + client);
        }

        service.onMessage = function(callback) {
            service.callback = callback;
        }

        return service;
  })
})(angular,Paho);