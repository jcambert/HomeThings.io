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
}(angular,_,$));