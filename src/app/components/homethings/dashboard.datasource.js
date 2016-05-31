(function (angular,_,$) {
var Timer = function($interval){
    var self=this;
    self._timer = null;
    self.$interval = $interval;
}
Timer.prototype = {
    start: function(time,callback){
        this._timer = this.$interval(function(){
            callback();
        },time);
    },
    stop:function(){
        if (angular.isDefined(this._timer)) {
            this.$interval.cancel(this._timer);
        }
    }
};
angular.module('homeThingsIo')
.config(
    function(datasourcePluginsProvider){
        console.log('config from datasource');
        datasourcePluginsProvider.add(clock);
        datasourcePluginsProvider.add(randomint);
        datasourcePluginsProvider.add(mqtt);
        //datasourcePluginsProvider.add(weather_plugin);
        //datasourcePluginsProvider.add(json_plugin);
        //console.dir(datasourcePluginsProvider.all());
    })  
;

var ClockDatasource = function (settings,startCallback, updateCallback,stopCallback,$interval) {
		var self = this;
		var currentSettings = settings;
		self.timer=null;
       
		this.stop = function() {
            self.timer.stop();
            if(_.isFunction(stopCallback))
                stopCallback();
		}

		this.start = function () {
			self.stop();
			//timer =  setInterval(self.updateNow, currentSettings.refresh * 1000);
            self.timer.start(currentSettings.refresh * 1000,self.updateNow);
            if(_.isFunction(startCallback))
                startCallback();
		}

		this.updateNow = function () {
			var date = new Date();

			var data = {
				numeric_value: date.getTime(),
				full_string_value: date.toLocaleString(),
				date_string_value: date.toLocaleDateString(),
				time_string_value: date.toLocaleTimeString(),
				date_object: date
			};

			updateCallback(data);
		}

		this.onDispose = function () {
			self.stop();
		}

		this.onSettingsChanged = function (newSettings) {
			currentSettings = newSettings;
			self.start();
		}
        self.timer=new Timer($interval);

	};

var clock={
    "type_name": "clock",
    "display_name": "Clock",
    "settings": [
        {
            "name": "refresh",
            "display_name": "Refresh Every",
            "type": "integer",
            "suffix": "seconds",
            "min":1,
            "placeholder":"Refresh Every",
            "default": 1
        }
    ],
    newInstance: function (settings, newInstanceCallback,startCallback, updateCallback,stopCallback,$interval) {
        newInstanceCallback(new ClockDatasource(settings, startCallback,updateCallback,stopCallback,$interval));
    }
};

var RandomIntDatasource =  function(settings,startCallback, updateCallback,stopCallback,$interval) {
    var self = this;
    var currentSettings = settings;

    self.timer=null;
    
    this.stop = function() {
        self.timer.stop();
        if(_.isFunction(stopCallback))
            stopCallback();
    }

    this.start = function () {
        self.stop();
        self.timer.start(currentSettings.refresh * 1000,self.updateNow);
        if(_.isFunction(startCallback))
            startCallback();
    }

    this.updateNow = function () {
        

        var data = {
            numeric_value:(Math.floor(Math.random() * (currentSettings.max -currentSettings.min +1)) +currentSettings.min).toString()
        };
        
        updateCallback(data);
    }

    this.onDispose = function () {
        self.stop();
    }

    this.onSettingsChanged = function (newSettings) {
        currentSettings = newSettings;
        self.start();
    }
    self.timer=new Timer($interval);
       
};
var randomint={
    "type_name": "randomint",
    "display_name": "Random Integer",
    "settings": [
        {
            "name": "min",
            "display_name": "Min Value",
            "type": "integer",
            "min":0,
            "max":999999,
            "placeholder":"Min Value",
            "default": 0
        },
        {
            "name": "max",
            "display_name": "Max Value",
            "type": "integer",
            "min":0,
            "max":999999,
            "placeholder":"Max Value",
            "default":100
        },
        {
            "name": "refresh",
            "display_name": "Refresh Every",
            "type": "integer",
            "suffix": "seconds",
            "default": 1
        }
    ],
    newInstance: function (settings, newInstanceCallback,startCallback, updateCallback,stopCallback,$interval) {
        newInstanceCallback(new RandomIntDatasource(settings, startCallback,updateCallback,stopCallback,$interval));
    }
};

var OpenWeatherMapDatasource = function (settings,startCallback, updateCallback,stopCallback) {
    var self = this;
    var updateTimer = null;
    var currentSettings = settings;

    function updateRefresh(refreshTime) {
        if (updateTimer) {
            clearInterval(updateTimer);
        }

        updateTimer = setInterval(function () {
            self.updateNow();
        }, refreshTime);
    }

    function toTitleCase(str) {
        return str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    updateRefresh(currentSettings.refresh * 1000);

    this.updateNow = function () {
        $.ajax({
            url: "http://api.openweathermap.org/data/2.5/weather?APPID="+currentSettings.api_key+"&q=" + encodeURIComponent(currentSettings.location) + "&units=" + currentSettings.units,
            dataType: "JSONP",
            success: function (data) {
                // Rejigger our data into something easier to understand
                var newData = {
                    place_name: data.name,
                    sunrise: (new Date(data.sys.sunrise * 1000)).toLocaleTimeString(),
                    sunset: (new Date(data.sys.sunset * 1000)).toLocaleTimeString(),
                    conditions: toTitleCase(data.weather[0].description),
                    current_temp: data.main.temp,
                    high_temp: data.main.temp_max,
                    low_temp: data.main.temp_min,
                    pressure: data.main.pressure,
                    humidity: data.main.humidity,
                    wind_speed: data.wind.speed,
                    wind_direction: data.wind.deg
                };

                updateCallback(newData);
            },
            error: function (xhr, status, error) {
            }
        });
    }

    this.onDispose = function () {
        clearInterval(updateTimer);
        updateTimer = null;
    }

    this.onSettingsChanged = function (newSettings) {
        currentSettings = newSettings;
        self.updateNow();
        updateRefresh(currentSettings.refresh * 1000);
    }
};

var weather_plugin={
    type_name: "openweathermap",
    display_name: "Open Weather Map API",
    settings: [
        {
            name: "api_key",
            display_name: "API Key",
            type: "text",
            placeholder: "Your personal API Key from Open Weather Map"
        },
        {
            name: "location",
            display_name: "Location",
            type: "text",
            placeholder: "Example: London, UK"
        },
        {
            name: "units",
            display_name: "Units",
            type: "option",
            default: "imperial",
            options: [
                {
                    name: "Imperial",
                    value: "imperial"
                },
                {
                    name: "Metric",
                    value: "metric"
                }
            ]
        },
        {
            name: "refresh",
            display_name: "Refresh Every",
            type: "integer",
            suffix: "seconds",
            default_value: 5
        }
    ],
    newInstance: function (settings, newInstanceCallback, startCallback,updateCallback,stopCallback) {
        newInstanceCallback(new OpenWeatherMapDatasource(settings, startCallback,updateCallback,stopCallback));
    }
};
var JsonDatasource = function (settings, startCallback,updateCallback,stopCallback) {
		var self = this;
		var updateTimer = null;
		var currentSettings = settings;
		var errorStage = 0; 	// 0 = try standard request
		// 1 = try JSONP
		// 2 = try thingproxy.freeboard.io
		var lockErrorStage = false;

		function updateRefresh(refreshTime) {
			if (updateTimer) {
				clearInterval(updateTimer);
			}

			updateTimer = setInterval(function () {
				self.updateNow();
			}, refreshTime);
		}

		updateRefresh(currentSettings.refresh * 1000);

		this.updateNow = function () {
			if ((errorStage > 1 && !currentSettings.use_thingproxy) || errorStage > 2) // We've tried everything, let's quit
			{
				return; // TODO: Report an error
			}

			var requestURL = currentSettings.url;

			if (errorStage == 2 && currentSettings.use_thingproxy) {
				requestURL = (location.protocol == "https:" ? "https:" : "http:") + "//thingproxy.freeboard.io/fetch/" + encodeURI(currentSettings.url);
			}

			var body = currentSettings.body;

			// Can the body be converted to JSON?
			if (body) {
				try {
					body = JSON.parse(body);
				}
				catch (e) {
				}
			}

			$.ajax({
				url: requestURL,
				dataType: (errorStage == 1) ? "JSONP" : "JSON",
				type: currentSettings.method || "GET",
				data: body,
				beforeSend: function (xhr) {
					try {
						_.each(currentSettings.headers, function (header) {
							var name = header.name;
							var value = header.value;

							if (!_.isUndefined(name) && !_.isUndefined(value)) {
								xhr.setRequestHeader(name, value);
							}
						});
					}
					catch (e) {
					}
				},
				success: function (data) {
					lockErrorStage = true;
					updateCallback(data);
				},
				error: function (xhr, status, error) {
					if (!lockErrorStage) {
						// TODO: Figure out a way to intercept CORS errors only. The error message for CORS errors seems to be a standard 404.
						errorStage++;
						self.updateNow();
					}
				}
			});
		}

		this.onDispose = function () {
			clearInterval(updateTimer);
			updateTimer = null;
		}

		this.onSettingsChanged = function (newSettings) {
			lockErrorStage = false;
			errorStage = 0;

			currentSettings = newSettings;
			updateRefresh(currentSettings.refresh * 1000);
			self.updateNow();
		}
	};

var json_plugin={
        display_name:"Json",
		type_name: "JSON",
		settings: [
			{
				name: "url",
				display_name: "URL",
				type: "text",
                placeholder:'The url of the json source'
			},
			{
				name: "use_thingproxy",
				display_name: "Try thingproxy",
				description: 'A direct JSON connection will be tried first, if that fails, a JSONP connection will be tried. If that fails, you can use thingproxy, which can solve many connection problems to APIs. <a href="https://github.com/Freeboard/thingproxy" target="_blank">More information</a>.',
				type: "boolean",
				default_value: true
			},
			{
				name: "refresh",
				display_name: "Refresh Every",
				type: "integer",
				suffix: "seconds",
				default_value: 5
			},
			{
				name: "method",
				display_name: "Method",
				type: "option",
				options: [
					{
						name: "GET",
						value: "GET"
					},
					{
						name: "POST",
						value: "POST"
					},
					{
						name: "PUT",
						value: "PUT"
					},
					{
						name: "DELETE",
						value: "DELETE"
					}
				]
			},
			{
				name: "body",
				display_name: "Body",
				type: "text",
				placeholder: "The body of the request. Normally only used if method is POST"
			},
			{
				name: "headers",
				display_name: "Headers",
				type: "array",
				settings: [
					{
						name: "name",
						display_name: "Name",
						type: "text"
					},
					{
						name: "value",
						display_name: "Value",
						type: "text"
					}
				]
			}
		],
		newInstance: function (settings, newInstanceCallback, startCallback, updateCallback,stopCallback) {
			newInstanceCallback(new JsonDatasource(settings,startCallback, updateCallback,stopCallback));
		}
	};
    
    
    var MqttDatasource = function(settings,startCallback, updateCallback,stopCallback,$interval) 
	{
 		var self = this;
		var data = {};
        var client = {};
		var currentSettings = settings;
        
        this.stop = function() {
           self.onDispose();
            if(_.isFunction(stopCallback))
                stopCallback();
		}

		this.start = function () {
			self.stop();
			console.dir(currentSettings);
            client = new Paho.MQTT.Client(currentSettings.server,
										parseInt(currentSettings.port),
                                        '/'+currentSettings.path,
										currentSettings.client_id);
                client.onConnectionLost = onConnectionLost;
                client.onMessageArrived = onMessageArrived;
                client.connect({onSuccess:onConnect, 
                                //userName: currentSettings.username,
                                //password: currentSettings.password,
                                //useSSL: currentSettings.use_ssl,
                                mqttVersion: 4});
             console.dir(client);
            
            if(_.isFunction(startCallback))
                startCallback();
		}
		function onConnect() {
			console.log("Connected");
			client.subscribe(currentSettings.topic);
		};
		
		function onConnectionLost(responseObject) {
			if (responseObject.errorCode !== 0)
				console.log("onConnectionLost:"+responseObject.errorMessage);
		};

		function onMessageArrived(message) {
			data.topic = message.destinationName;
			if (currentSettings.json_data) {
				data.msg = JSON.parse(message.payloadString);
			} else {
				data.msg = message.payloadString;
			}
            console.log('datasource message arrived:');
            console.dir(data);
			updateCallback(data);
		};

		// **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
		self.onSettingsChanged = function(newSettings)
		{
            currentSettings = newSettings;
            
            if(_.isFunction(client.disconnect) ){
			client.disconnect();
			data = {};
			
			client.connect({onSuccess:onConnect,
							userName: currentSettings.username,
							password: currentSettings.password,
							useSSL: currentSettings.use_ssl});
            }else{
                this.start();
            }
		}

		// **updateNow()** (required) : A public function we must implement that will be called when the user wants to manually refresh the datasource
		self.updateNow = function()
		{
			// Don't need to do anything here, can't pull an update from MQTT.
		}

		// **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
		self.onDispose = function()
		{
			if ( _.isFunction(client.isConnected) && client.isConnected()) {
				client.disconnect();
			}
			client = {};
		}

		
	};
    
var mqtt ={
		"type_name"   : "paho_mqtt",
		"display_name": "Paho MQTT",
        "description" : "Receive data from an MQTT server.",
		"external_scripts" : [
			//"<full address of the paho mqtt javascript client>"
		],
		"settings"    : [
			{
				"name"         : "server",
				"display_name" : "MQTT Server",
				"type"         : "text",
				"description"  : "Hostname for your MQTT Server",
                "default"      :"test.mosquitto.org",
                "required"     : true
			},
			{
				"name"        : "port",
				"display_name": "Port",
				"type"        : "integer", 
				"description" : "The port to connect to the MQTT Server on",
                "min"         : 0,
                "max"         : 65535,
                "default"     : 8080,
				"required"    : true
			},
            {
				"name"        : "path",
				"display_name": "Path",
				"type"        : "text", 
				"description" : "Path of broker",
                "default"     : "mqtt",
				"required"    : true
			},
			{
				"name"        : "use_ssl",
				"display_name": "Use SSL",
				"type"        : "boolean",
				"description" : "Use SSL/TLS to connect to the MQTT Server",
				"default"     : false
			},
            {
            	"name"        : "client_id",
            	"display_name": "Client Id",
            	"type"        : "text",
            	"default"     : "mqtt",
            	"required"    : false
            },
            {
            	"name"        : "username",
            	"display_name": "Username",
            	"type"        : "text",
            	"default"     : "",
            	"required"    : false
            },
            {
            	"name"        : "password",
            	"display_name": "Password",
            	"type"        : "text",
            	"default"     : "",
            	"required"    : false
            },
            {
            	"name"        : "topic",
            	"display_name": "Topic",
            	"type"        : "text",
            	"description" : "The topic to subscribe to",
                "default"     : "toto",
            	"required"    : true
            },
            {
            	"name"        : "json_data",
            	"display_name": "JSON messages?",
            	"type"        : "boolean",
            	"description" : "If the messages on your topic are in JSON format they will be parsed so the individual fields can be used in freeboard widgets",
            	"default"     : true
            }
		],
		// **newInstance(settings, newInstanceCallback, updateCallback)** (required) : A function that will be called when a new instance of this plugin is requested.
		// * **settings** : A javascript object with the initial settings set by the user. The names of the properties in the object will correspond to the setting names defined above.
		// * **newInstanceCallback** : A callback function that you'll call when the new instance of the plugin is ready. This function expects a single argument, which is the new instance of your plugin object.
		// * **updateCallback** : A callback function that you'll call if and when your datasource has an update for freeboard to recalculate. This function expects a single parameter which is a javascript object with the new, updated data. You should hold on to this reference and call it when needed.
		newInstance   : function(settings, newInstanceCallback,startCallback, updateCallback,stopCallback,$interval) {
			newInstanceCallback(new MqttDatasource(settings, startCallback,updateCallback,stopCallback,$interval));
		}
	};
}(angular,_,$));