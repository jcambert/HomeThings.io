(function(angular,_,watch,head) {
  'use strict';
  angular
  .module('homeThingsIo')
  .service('datasourcePlugins',function(){
      var self=this;
      self.plugins={};
      
  })
  .factory('Datasource', function($log,$rootScope,datasourcePlugins){
    function Datasource(data) {
        var self = this;
        
        self.instance = undefined;
        self.name = "";
        self.latestData = {};
        self.settings = {};
        self.type = {};
        self.last_updated = {}
        self.last_error = {};
        
       /* observeOnScope(self, 'name').subscribe(function(newValue) {
            if(!_.isUndefined(self.instance) && _.isFunction(self.instance.onNameChanged)){
                self.instance.onNameChanged(newValue);
            }
        });*/
        setPropertyChanged('name','onNameChanged');
        setPropertyChanged('last_updated','onLastUpdated');
        setPropertyChanged('last_error','OnLastError');
        
        setPropertyChanged('type',function(oldValue,newValue){
           self.disposeInstance();
           if( (newValue in datasourcePlugins.plugins) && _.isFunction(datasourcePlugins[newValue].newInstance)){
               var datasourceType = datasourcePlugins.plugins[newValue];
               function finishLoad()
                {
                    datasourceType.newInstance(self.settings(), function(instance)
                    {

                        self.instance = instance;
                        instance.updateNow();

                    }, self.updateCallback);
                }
                if(datasourceType.external_scripts)
                {
                    head.js(datasourceType.external_scripts.slice(0), finishLoad); // Need to clone the array because head.js adds some weird functions to it
                }
                else
                {
                    finishLoad();
                }
           }
        });
        
        function setPropertyChanged(propertyName,callback){
            function isFunctionDefined(functionName) {
                var fn = window["self.instance"+functionName];
                if(typeof fn === 'function') {
                   return fn;
                }
                return undefined;
            }
            if(_.isFunction(callback)){
                watch(self,'name', function (prop, action, newvalue, oldvalue) {
                    $log.log('Datasource.factory:'+ prop + ' changed from ' + oldvalue + ' to ' + newvalue);
                    callback(oldvalue,newvalue);
                });
            }else if(_.isString(callback)){
                watch(self,'name', function (prop, action, newvalue, oldvalue) {
                    $log.log('Datasource.factory:'+prop + ' changed from ' + oldvalue + ' to ' + newvalue);
                    var fn=isFunctionDefined(callback);
                    if(!_.isUndefined(fn) ){
                        $log.log('Datasource.factory:'+'execute:'+callback);
                        fn(oldvalue,newvalue);
                    }
                });
            }
        };
        
        self.disposeInstance = function(){
            if(!_.isUndefined(self.instance))
            {
                if(_.isFunction(self.instance.onDispose))
                {
                    self.datasourceInstance.onDispose();
                }

                self.instance = undefined;
            }
        }
        
        if (data) {
            this.setData(data);
        }
    };
    Datasource.prototype = {
        setData: function(data) {
            angular.extend(this, data);
        },
        updateCallback:function(newData){
            //theFreeboardModel.processDatasourceUpdate(self, newData);
            $rootScope.$broadcast('DATASOURCE.UPDATE',{object:self,data:newData});

            self.latestData(newData);

            var now = new Date();
            self.last_updated(now.toLocaleTimeString());
        },
        serialize : function()
        {
            return {
                name    : self.name,
                type    : self.type,
                settings: self.settings
            };
        },
        deserialize : function(object)
        {
            self.settings=object.settings;
            self.name=object.name;
            self.type=object.type;
        },
        getDataRepresentation : function(dataPath)
        {
            var valueFunction = new Function("data", "return " + dataPath + ";");
            return valueFunction.call(undefined, self.latestData());
        },
        updateNow : function()
        {
            if(!_.isUndefined(self.instance) && _.isFunction(self.instance.updateNow))
            {
                self.instance.updateNow();
            }
        },
        dispose : function()
        {
            self.disposeInstance();
        }
    };
    return Datasource;
  })
})(angular,_,WatchJS.watch,head);

