(function (angular,_) {
angular.module('homeThingsIo')
.config(function(pluginsProvider,PluginsType){
    pluginsProvider.add(mqtt,PluginsType.INPUT);  
})
.controller('inputsModalController',function(){
    
})

;

var MqttInput = function(settings,startCallback,updateCallback,stopCallback,$interval,datasource){
    
    var self = this;
    
    this.stop = function(){
        self.onDispose();
        if(_.isFunction(stopCallback))
            stopCallback();
    }
    
    self.onDispose = function(){
       
    }
};
var mqtt={
    "type_name":"paho_mqtt_input",
    "display_name":"Paho MQTT Input",
    "description":"Paho MQTT input Subscriber",
    "external_scripts":[],
    "settings":[
        {
            "name"         :   "topic",
            "display_name" :   "Topic",
            "type"         :   "text",
            "description"  :   "The topic to subscribe to",
            "default"      :   "",
            "required"     :   true
        },
        {
            "name "        :   "datasource",
            "display_name" :   "Source de donnée",
            "type"         :   "option",
            "source_type"  :   "datasources",
            "source_filter":   "paho_mqtt"   
        }
        
    ],
    newInstance: function(settings, newInstanceCallback,startCallback, updateCallback,stopCallback,$interval,datasource) {
        newInstanceCallback(new MqttInput(settings, startCallback,updateCallback,stopCallback,$interval,datasource));
    }

}
}(angular,_));