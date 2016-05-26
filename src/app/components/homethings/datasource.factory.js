(function(angular,_,watch,head,$) {
  'use strict';
  angular
  .module('homeThingsIo')
  .constant('_',_)
  .constant('PluginState',{CREATED:0,INSTANCIED:1,PAUSED:2,RUNNING:3})
  .constant('FormState',{ADD:0,MODIFY:1})
  .controller('dashboardController',function(){})
  .directive('dashboardUi',function($log, $uibModal,$animate,Dashboard,Datasource,Pane,Widget,datasourcePlugins,widgetPlugins,FormState){
      return{
          restrict:'E',
          transclude:true,
          replace:true,
          template:'<div ng-transclude></div>',
         
          controller: function($scope,$rootScope){
              var self=$scope;
              self.dashboard = new Dashboard();
              
              self.datasources = {};
              self.panes = [];
              
           
              
              self.$on("#main-header_toggle",function(event,data){
                 
                 self.dashboard.allowEdit=!data.toggle; 
              });
              
              
              //$log.log('datasources plugins:');$log.log(datasourcePlugins.all());
              self.addDatasource = function(){
                 var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'app/components/homethings/datasource.modal.html',
                    controller: 'DatasourceModalController',
                    size: 'lg',
                    resolve: {
                        options:function() {
                            return{
                                mode:FormState.ADD
                                }
                            }
                        }
                    });

                  modalInstance.result.then(function (selectedItem) {
                    var datasource=new Datasource(selectedItem);
                    datasource.setType(_.find(datasourcePlugins.all(),function(datasource){return selectedItem.type == datasource.type_name}));
                    self.datasources[datasource.settings.name]=datasource;
                     $log.log('list of datasources after adding');
                    $log.log(self.datasources);
                  }, function () {
                    $log.info('Modal dismissed at: ' + new Date());
                  });

              };
            self.modifyDatasource = function(name){
                var ds=self.datasources[name];
                $log.log(ds);$log.log(name);
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'app/components/homethings/datasource.modal.html',
                    controller: 'DatasourceModalController',
                    size: 'lg',
                    resolve: {
                        options:function() {
                            return{
                                datasource: ds,
                                mode: FormState.MODIFY
                                }
                            }
                        }
                    });


                  modalInstance.result.then(function (selectedItem) {
                    $log.log(selectedItem);
                    self.datasources[name]=new Datasource(selectedItem);
                    self.datasources[name].setType(_.find(datasourcePlugins.all(),function(datasource){return selectedItem.type == datasource.type_name}));
                   
                  }, function () {
                    $log.info('Modal dismissed at: ' + new Date());
                  });
            };
            
            self.deleteDatasource = function(name){
                self.datasources[name].dispose();
                delete self.datasources[name];
            };
            self.updateDatasourceData = function(name){
                self.datasources[name].updateNow();
            };
            self.stopDatasourceData = function(name){
                self.datasources[name].stop();
            };
            self.startDatasourceData = function(name){
                self.datasources[name].start();
            };
            
            self.addPane = function(){
                self.panes.push(new Pane({x:0,y:0,width:2,height:1}));
                $log.log(self.panes);
            };
           
            self.removePane = function(index){
                self.panes.splice(index,1);
            };
            
            self.editPane = function(index){
                var pane=angular.copy(self.panes[index].settings);
                $log.log('edit pane ');$log.log(pane);
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'app/components/homethings/pane.modal.html',
                    controller: 'PaneModalController',
                    size: 'lg',
                    resolve: {
                        options:function() {
                            return{
                                pane: pane,
                                mode: FormState.MODIFY
                                }
                            }
                        }
                    });


                  modalInstance.result.then(function (settings) {
                        self.panes[index].settings=settings;
                  }, function () {
                    $log.info('Modal dismissed at: ' + new Date());
                  });
            };
            
            
            self.addWidget = function(indexPane){
                $log.log('add widget to pane '+indexPane);
                $log.log(self.panes[indexPane]);
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'app/components/homethings/widget.modal.html',
                    controller: 'WidgetModalController',
                    size: 'lg',
                    resolve: {
                        options:function() {
                            return{
                                mode: FormState.ADD
                                }
                            }
                        }
                    });


                  modalInstance.result.then(function (selectedItem) {
                        var widget=new Widget(selectedItem);
                        widget.setType(_.find(widgetPlugins.all(),function(widget){return selectedItem.type == widget.type_name}));
                        self.panes[indexPane].addWidget(widget);
                  }, function () {
                    $log.info('Modal dismissed at: ' + new Date());
                  });
            };
            
            self.editWidget = function(indxPane,indexWidget){
                
            }
            
             self.addPane();
             self.dashboard.allowEdit = true;
          /* _.forEach(widgetPlugins.all(),function(widget){
               widget.newInstance({},function(instance){
                   self.panes[0].addWidget(instance); 
               });
              
           })*/
          },
          link:function($scope,$element,attrs){
              
          }
      }
  })
  
   
  .controller('DatasourceModalController',function($log,$scope,$uibModalInstance,datasourcePlugins,FormState,PluginState,options){
     var self=$scope;
     self.datasources=datasourcePlugins.all();
     self.datasource = options.datasource;
     
     self.mode = options.mode;
     self.selected={
         item:{}
     };
     if(self.mode == FormState.MODIFY){
        self.selected.item = datasourcePlugins.get(self.datasource.settings.type);
        $log.log(self.datasource);
        $log.log(self.selected.item);
        self.plugin=angular.copy(self.datasource.settings);
     }
     
     self.ok = function () {
        $uibModalInstance.close(self.plugin);
    };

    self.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
    self.addRow = function(name){
      var setting=_.find(self.selected.item.settings,function(setting){return setting.name==name});
      if(setting){
          var s={};
          s=createDefaultSettings(setting.settings);
          self.plugin[name].push(s);
      }else
        self.plugin[name].push({});
        
    };
    
   self.deleteRow = function(name,index){
       self.plugin[name].splice(index,1);
   }
    self.createPlugin = function(){
        if(self.mode == FormState.MODIFY) return;
        self.plugin=createDefaultSettings(self.selected.item.settings);
        self.plugin.state=PluginState.CREATED;
    };
    
    
    function createDefaultSettings(settings){
        $log.log('createDefaultSettings');
        var dest={'name':'','type':self.selected.item.type_name};
        
       _.forEach(settings,function(setting){
           switch (setting.type) {
               case 'integer':
                   dest[setting.name]= setting.default || 0;
                   break;
               case 'text':
                    dest[setting.name]= setting.default || "";
                    break;
               case 'boolean':
                    dest[setting.name]=setting.default ||false;
                    break;
               case 'option':   
                    dest[setting.name]= setting.default || "";
                    break;
               case 'array':
                    dest[setting.name]= [];
                    break;
               default:
                   break;
           }
       });
       $log.log(dest);
       return dest;
    }
    
    
     self.createPlugin();
  })
  
  .controller('PaneModalController',function($log,$scope,$uibModalInstance,options){
    var self = $scope;
    self.pane = options.pane;
    self.ok = function () {
        $uibModalInstance.close(self.pane);
    };

    self.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
  })
  
.controller('WidgetModalController',function($log,$scope,$uibModalInstance,FormState,PluginState,widgetPlugins,options){
    var self = $scope;
    self.mode = options.mode;
    self.widgets = widgetPlugins.all();
    self.selected={
        item:{}
    };
     
    self.ok = function () {
        $uibModalInstance.close(self.selected.item);
    };

    self.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
    
    self.createPlugin = function(){
        if(self.mode == FormState.MODIFY) return;
        self.plugin=createDefaultSettings(self.selected.item.settings);
        self.plugin.state=PluginState.CREATED;
    };
    
    function createDefaultSettings(settings){
        $log.log('createDefaultSettings');
        var dest={'name':'','type':self.selected.item.type_name};
        
       _.forEach(settings,function(setting){
           switch (setting.type) {
               case 'integer':
                   dest[setting.name]= setting.default || 0;
                   break;
               case 'text':
                    dest[setting.name]= setting.default || "";
                    break;
               case 'boolean':
                    dest[setting.name]=setting.default ||false;
                    break;
               case 'option':   
                    dest[setting.name]= setting.default || "";
                    break;
               case 'array':
                    dest[setting.name]= [];
                    break;
               case 'calculated':
                    dest[setting.name]=setting.default || "";
                    break;
               default:
                   break;
           }
       });
       $log.log(dest);
       return dest;
    }
    self.createPlugin();
  })
  
  .directive('dashboardHeader',function($animate){
      return{
          restrict:'E',
          replace:true,
          templateUrl:'app/components/homethings/dashboard.header.html'
          
      }
  })
  .directive('dashboardToggleHeader',function(){
      return{
          restrict:'E',
          replace:true,
         // template:'<div id="toggle-header" slide-toggle="#main-header" toggle-value="false" expanded="false" ng-show="dashboard.allowEdit==false"><i id="toggle-header-icon" class="fa fa-cogs" aria-hidden="true"></i></div>'
          template:'<div id="toggle-header" ng-show="!dashboard.allowEdit" ng-click="dashboard.allowEdit=true"><i id="toggle-header-icon" class="fa fa-cogs" aria-hidden="true"></i></div>'
          
      }
  })

 .directive('dashboardContent',function(){
    return{
        restrict:'E',
        replace:true,
        transclude:true,
        template:'<div ng-transclude></div>'
        
    }
  })
.directive('calculatedField',function(){
    return{
        restrict:'E',
        replace:true,
        templateUrl:'app/components/homethings/calculatedField.html'
        
    }
})
  
.animation('.slide', function($log) {
  return {
    // make note that other events (like addClass/removeClass)
    // have different function input parameters
    enter: function(element, doneFn) {
        $log.log('enter slide');
      angular.element(element).fadeIn(1000, doneFn);

      // remember to call doneFn so that angular
      // knows that the animation has concluded
    },

    move: function(element, doneFn) {
     angular.element(element).fadeIn(1000, doneFn);
    },

    leave: function(element, doneFn) {
      angular.element(element).fadeOut(1000, doneFn);
    }
  }
})

.directive('datasourceTypeSelect',function(){
    return {
        restrict:'E',
        replace:true,
        template:'<select ng-model="selected.item" ng-options="datasource.display_name for datasource in datasources"><option value="">Select a type ...</option></select>'
    }
})

.directive('widgetTypeSelect',function(){
    return {
        restrict:'E',
        replace:true,
        template:'<select ng-model="selected.item" ng-options="widget.display_name for widget in widgets"><option value="">Select a type ...</option></select>'
    }
})

.directive('pane',function(){
    return{
        restrict:'E',
        replace:true,
        templateUrl:'app/components/homethings/pane.html'
    }
})

.directive('widget',function(){
    return {
        restrict:'E',
        replace:true,
        templateUrl:'app/components/homethings/widget.html',
        /*scope:{
            datasources:'=',
            
        },*/
        controller:function($log,$scope){
            $log.log('Widget controller start');
            $log.log($scope.datasources)
        }
    }    
})

.provider('datasourcePlugins',function(_){
    var self=this;
    self.plugins=[];
    return{
        add:function(datasource){self.plugins.push(datasource);},
        all:function(){return self.plugins;},
        $get:function(){
            return{
                add:function(datasource){self.plugins.push(datasource);},
                all:function(){return self.plugins;},
                get:function(name){return _.find(self.plugins,function(plugin){return plugin.type_name==name;});},
                has:function(datasource){return _.find(self.plugins,function(plugin){return plugin.type_name==datasource.type_name;})!= undefined}
            };
        }  
    };    
  })
.provider('widgetPlugins',function(_){
      var self=this;
      self.plugins=[];
      return{
          add:function(widget){self.plugins.push(widget);},
          all:function(){return self.plugins;},
          $get:function(){
              return{
                  add:function(widget){self.plugins.push(widget);},
                  all:function(){return self.plugins;},
                  get:function(name){return _.find(self.plugins,function(plugin){return plugin.type_name==name;});},
                  has:function(widget){return _.find(self.plugins,function(plugin){return plugin.type_name==widget.type_name;})!= undefined}
              };
          }
          
      };
      
  })
   
  .service('propertyChanged',function($window,$log,_){
      var self=this;
      
      self.setPropertyChanged = function(propertyName,callback){
            function isFunctionDefined(functionName) {
                var fn = $window["self.instance"+functionName];
                if(typeof fn === 'function') {
                   return fn;
                }
                return undefined;
            }
            if(_.isFunction(callback)){
                watch(self,'name', function (prop, action, newvalue, oldvalue) {
                    //$log.log( prop + ' changed from ' + oldvalue + ' to ' + newvalue);
                    callback(oldvalue,newvalue);
                });
            }else if(_.isString(callback)){
                watch(self,'name', function (prop, action, newvalue, oldvalue) {
                   // $log.log(prop + ' changed from ' + oldvalue + ' to ' + newvalue);
                    var fn=isFunctionDefined(callback);
                    if(!_.isUndefined(fn) ){
                        //$log.log('execute:'+callback);
                        fn(oldvalue,newvalue);
                    }
                });
            }
        };
  })
  
  /** FreeboardModel */
  .factory('Dashboard',function($log,propertyChanged){
      function Dashboard(){
          var self=this;
          
          self.version = 0;
          self.isEditing = false;
          self.allowEdit = false;
          self.plugins = [];
          self.datasources = [];
          self.panes = [];
          self.datasourceData = {};
          self._datasourceTypes = {};
          self._widgetTypes = {};
      }
      
      Dashboard.prototype={
          processDatasourceUpdate:function(datasource,newData){},
          addPluginSource:function(pluginSource){},
          serialize:function(){},
          deserialize : function(object, finishedCallback){},
          clearDashboard : function(){ },
          loadDashboard : function(dashboardData, callback){},
          loadDashboardFromLocalFile : function(){},
          saveDashboardClicked:function(){},
          saveDashboard: function(_thisref, event){},
          addDatasource : function(datasource){},
          deleteDatasource :  function(datasource){},
          createPane : function(){},
          deletePane : function(pane){},
          deleteWidget : function(widget){},
          setEditing : function(editing, animate){},
          toggleEditing : function(){}
      };
      
      return Dashboard;
  })
  
  
  /** DatasourceModel */
  .factory('Datasource', function($log,$rootScope,$interval,propertyChanged,datasourcePlugins,PluginState,_){
    function Datasource(settings) {
        var self = this;
        
        self.instance = undefined;
        //self.name = "";
        self.latestData = {};
        self.settings = {};
        var type = {};
        self.last_updated = new Date().toLocaleTimeString();
        self.last_error = {};
        
 
        self.setType = function (datasource){
            if(datasource == undefined)return;
            type=datasource;
            $log.log('Datasource.type change to:');$log.log(datasource);
            self.disposeInstance();
            if(   datasourcePlugins.has(datasource) && _.isFunction(datasource.newInstance)){
                $log.log('try instantiate');
                var datasourceType =datasource;
                function finishLoad()
                    {
                        datasourceType.newInstance(self.settings, function(instance)
                        {

                           self.instance = instance;
                          //  instance.updateNow();
                          self.settings.state = PluginState.CREATED;
                          $log.log(datasourceType.display_name +' was created');
                          
                          self.start();

                        }, self.updateCallback,$interval);
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
            
        }
       
        
        self.disposeInstance = function(){
            if(!_.isUndefined(self.instance))
            {
                if(_.isFunction(self.instance.onDispose))
                {
                    self.instance.onDispose();
                }

                self.instance = undefined;
            }
        };
        
        self.updateCallback=function(newData){
            self.latestData=newData;
            var now = new Date();
            self.last_updated=now.toLocaleTimeString();
            $rootScope.$broadcast('DATASOURCE.UPDATE',{object:self,data:newData});
        };
        
        self.start = function(){
            if(_.isUndefined(self.instance))return;
            if(_.isFunction(self.instance.start)){
                self.instance.start();
                self.settings.state = PluginState.RUNNING;
                $log.log(self.settings.name +' was running');
            }
        };
        
        self.stop = function(){
            if(_.isUndefined(self.instance))return;
            if(_.isFunction(self.instance.stop)){
                self.instance.stop();
                self.settings.state = PluginState.PAUSED;
                $log.log(self.settings.name +' was stopped');
            }
        };
        
        if (settings) {
            this.setSettings(settings);
        }
    };

    
    Datasource.prototype = {
        
        setSettings: function(settings) {
            angular.extend(this.settings, settings);
        },
      /*  updateCallback:function(newData){
            //theFreeboardModel.processDatasourceUpdate(self, newData);
            
            $log.log(newData);console.dir(this);
            this.latestData=newData;

            var now = new Date();
            this.last_updated=now.toLocaleTimeString();
            $rootScope.$broadcast('DATASOURCE.UPDATE',{object:this,data:newData});
           // $rootScope.$digest();
        },*/
        serialize : function()
        {
            return {
                name    : this.name,
                type    : this.type,
                settings: this.settings
            };
        },
        deserialize : function(object)
        {
            this.settings=object.settings;
            this.name=object.name;
            this.type=object.type;
        },
        getDataRepresentation : function(dataPath)
        {
            var valueFunction = new Function("data", "return " + dataPath + ";");
            return valueFunction.call(undefined, this.latestData());
        },
        updateNow : function()
        {
            if(!_.isUndefined(this.instance) && _.isFunction(this.instance.updateNow))
            {
                this.instance.updateNow();
            }
        },
        dispose : function()
        {
            this.disposeInstance();
        }
    };
    return Datasource;
  })
  
  /** PaneModel */
  .factory('Pane',function(){
      function Pane(settings){
           var self=this;
           
           self.widgets=[];
           self.settings={}
           
           if (settings) {
            this.setSettings(settings);
          }
      }
      
      Pane.prototype={
          setSettings:function(settings){
              angular.extend(this.settings, settings);
          },
          addWidget:function(widget){
              this.widgets.push(widget);
          },
          removeWidget:function(index){this.widgets.splice(index,1);},
          widgetCanMoveUp:function(widget){},
          widgetCanMoveDown:function(widget){},
          widgetMoveUp:function(widget){},
          widgetMoveDown:function(widget){},
          processSizeChange:function(){},
          getCalculateHeight:function(){},
          serialize:function(){},
          deserialize:function(){},
          dispose:function(){}
      }
      
      
        
      return Pane;
      
  })
  
  /**WidgetModel */
  .factory('Widget',function($log,widgetPlugins){
      function Widget(settings){
          var self=this;
          self.datasourceRefreshNotifications={};
          self.calculatedSettingScripts={};
          self.fillSize = false;
          self.type = undefined;
          self.settings={};
          self._heightUpdate=undefined;
          self.shouldRender=false;
          
          self.setType = function(widget){
              if(widget == undefined) return;
              self.disposeInstance();
              $log.log('widget set type');
            if ( widgetPlugins.has(widget) && _.isFunction(widget.newInstance)) {
                var widgetType = widget;

                function finishLoad() {
                    widgetType.newInstance(self.settings, function (instance) {

                        self.fillSize((widgetType.fill_size === true));
                        self.widgetInstance = widget;
                        self.shouldRender(true);
                        self._heightUpdate.valueHasMutated();

                    });
                }

                // Do we need to load any external scripts?
                if (widgetType.external_scripts) {
                    head.js(widgetType.external_scripts.slice(0), finishLoad); // Need to clone the array because head.js adds some weird functions to it
                }
                else {
                    finishLoad();
                }
            }
          };
          
          self.disposeInstance = function(){
            if(!_.isUndefined(self.instance))
            {
                if(_.isFunction(self.instance.onDispose))
                {
                    self.instance.onDispose();
                }

                self.instance = undefined;
            }
        };
          if(settings)
            self.setSettings(settings)
      }
      
      Widget.prototype={
          setSettings: function(settings){angular.extend(this.settings, settings);},
          processDatasourceUpdate:function(datasourceName){},
          callValueFunction:function(fn){},
          processSizeChange:function(){},
          processCalculatedSetting : function (settingName){},
          updateCalculatedSettings : function () {},
          render : function (element) {},
          dispose : function () {},
          serialize : function () {},
          deserialize : function (object) {}
      }
      return Widget;
  })
  ;
  
  
})(angular,_,WatchJS.watch,head,$);

