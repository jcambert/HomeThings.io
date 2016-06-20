(function (angular) {

angular.module('homeThingsIo')
.config(
    function(pluginsProvider,PluginsType){
        console.log('config from widget');
        pluginsProvider.add(textWidget,PluginsType.WIDGET);
        pluginsProvider.add(gaugeWidget,PluginsType.WIDGET);
    })  
;
var TextWidget = function (settings) {

    

    this.getTemplate = function(){return "app/components/homethings/text.widget.html";}
    

    this.render = function (element) {
        
    }


    this.onDispose = function () {

    }

};

var textWidget = {
    type_name: "text_widget",
        display_name: "Text",
        "external_scripts" : [
            "plugins/thirdparty/jquery.sparkline.min.js"
        ],
        settings: [
            {
                name: "title",
                display_name: "Title",
                type: "text",
                default:"default"
            },
            {
                name: "size",
                display_name: "Size",
                type: "option",
                default: "regular",
                options: [
                    {
                        name: "Regular",
                        value: "regular"
                    },
                    {
                        name: "Big",
                        value: "big"
                    }
                ]
            },
            {
                name: "value",
                display_name: "Value",
                type: "calculated",
                //default:'datasources.clock.full_string_value'
                default:"return datasources['clock'].latestData.full_string_value"
            },
            {
                name: "sparkline",
                display_name: "Include Sparkline",
                type: "boolean",
                default:false
            },
            {
                name: "animate",
                display_name: "Animate Value Changes",
                type: "boolean",
                default_value: true,
                default:false
            },
            {
                name: "units",
                display_name: "Units",
                type: "text",
                default:'heures'
            }
        ],
        newInstance: function (settings, newInstanceCallback,$templateCache) {
            newInstanceCallback(new TextWidget(settings,$templateCache));
        }
};

var GaugeWidget =function (settings,$templateCache) {

    console.dir('GaugeWidget created');

    this.getTemplate = function(){return "app/components/homethings/gauge.widget.html";}
    

    this.render = function (element) {
        
    }


    this.onDispose = function () {

    }

};

var gaugeWidget={
    type_name: "gauge",
    display_name: "Gauge",
    /* "external_scripts" : [
        "plugins/thirdparty/raphael.2.1.0.min.js",
        "plugins/thirdparty/justgage.1.0.1.js"
    ],*/
    settings: [
        {
            
            name: "title",
            display_name: "Title",
            type: "text",
            default:'gauge'
        },
        {
            name: "value",
            display_name: "Value",
            type: "calculated",
            default:"return datasources['clock'].latestData.numeric_value"
        },
        {
            name: "units",
            display_name: "Units",
            type: "text",
            default:'pct'
        },
        {
            name: "min_value",
            display_name: "Minimum",
            type: "integer",
            min:0,
            max:100,
            default: 0
        },
        {
            name: "max_value",
            display_name: "Maximum",
            type: "integer",
            min:0,
            max:100,
            default: 100
        }
    ],
    newInstance: function (settings, newInstanceCallback,$templateCache) {
        newInstanceCallback(new GaugeWidget(settings,$templateCache));
    }
};

}(angular));