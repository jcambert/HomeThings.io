(function (angular) {

angular.module('homeThingsIo')
.config(
    function(widgetPluginsProvider){
        console.log('config from widget');
        widgetPluginsProvider.add(textWidget);
        widgetPluginsProvider.add(textWidget_copy);
    })  
;
var TextWidget = function (settings) {

    var self = this;

    self.getTemplate = function(){return "app/components/homethings/temp.widget.html";}
    

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
                default:'datasource["clock"].full_string_value'
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
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new TextWidget(settings));
        }
};

var textWidget_copy = {
    type_name: "text_widget",
        display_name: "Text Copy",
        "external_scripts" : [
            "plugins/thirdparty/jquery.sparkline.min.js"
        ],
        settings: [
            {
                name: "title",
                display_name: "Title",
                type: "text"
            },
            {
                name: "size",
                display_name: "Size",
                type: "option",
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
                type: "calculated"
            },
            {
                name: "sparkline",
                display_name: "Include Sparkline",
                type: "boolean"
            },
            {
                name: "animate",
                display_name: "Animate Value Changes",
                type: "boolean",
                default_value: true
            },
            {
                name: "units",
                display_name: "Units",
                type: "text"
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new TextWidget(settings));
        }
}

}(angular));