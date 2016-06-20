(function(angular,_,watch,head,$) {
  'use strict';
  angular
  .module('homeThingsIo')
  .constant('_',_)
  .constant('PluginState',{CREATED:0,INSTANCIED:1,PAUSED:2,RUNNING:3})
  .constant('FormState',{ADD:0,MODIFY:1})
  .constant('DashboardPanesIndex',{INPUTS:'inputs',OUTPUTS:'outputs'})
  .constant('PluginsType',{DATASOURCE:0,WIDGET:1,INPUT:2,OUTPUT:3})
  .directive('dashboardUi',function($log, $uibModal,$animate,$q,Dashboard,Datasource,plugins,PluginsType,FormState,DashboardPanesIndex){
      
      return{
          restrict:'E',
          transclude:true,
          replace:true,
          template:'<div ng-transclude></div>',
          controller: function($scope,$rootScope, $localStorage){
              $log.log("Create Dashboard UI Controller");
              var self=$scope;
              self.$storage = $localStorage.$default();
              
              self.dashboards={};
              self.dashboards[DashboardPanesIndex.INPUTS]=self.$storage.dashboardInputs || new Dashboard(DashboardPanesIndex.INPUTS,PluginsType.INPUT);
              self.dashboards[DashboardPanesIndex.OUTPUTS]=self.$storage.dashboardOutputs ||  new Dashboard(DashboardPanesIndex.OUTPUTS,PluginsType.OUTPUT);
              
              self.dashboard = undefined;
              
              self.datasources =self.$storage.datasources || {};

              self.showSettings = function(){
                  self.dashboard.allowEdit = true;
              } 
              self.changeDashboardTo = function(dashboardname){
                  $log.log(self.dashboards);
                  $log.log('want change dashboard to:'+dashboardname);
                  self.dashboard=self.dashboards[dashboardname];
                  $log.log('Current dashboard is '+self.dashboard.name);
                 
              }
              self.dashboardAction = function(){
                  if( !self.dashboard.allowEdit) return;
                  return 'app/components/homethings/dashboard.header.'+self.dashboard.name+'.action.html';
              };
              self.dashboardContent = function(){
                  if( !self.dashboard.allowEdit) return;
                  return 'app/components/homethings/dashboard.header.'+self.dashboard.name+'.content.html';
              }
              
              self.saveDashboard = function(mode){
                  self.$storage.datasources = self.datasources;
              };
              
              self.wantAddPlugin = function(){
                  var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'app/components/homethings/'+self.dashboard.name+'.modal.html',
                    controller: self.dashboard.name + 'ModalController',
                    size: 'lg',
                    resolve: {
                        options:function() {
                            return{
                                mode:FormState.ADD
                                }
                            }
                        }
                    });
                    modalInstance.result.then(function (result) {
                        self.dashboard.addPlugin(new Plugin(result.plugin,result.type,self.dashboard.pluginType));
                    }, function () {
                        $log.info('Modal dismissed at: ' + new Date());
                    });
              };
              
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

                  modalInstance.result.then(function (result) {
                    var datasource=new Datasource(result.plugin,result.type);
                    //datasource.setType(_.find(datasourcePlugins.all(),function(datasource){return selectedItem.type == datasource.type_name}));
                    self.datasources[datasource.settings.name]=datasource;
                     $log.log('list of datasources after adding');
                    $log.log(self.datasources);
                  }, function () {
                    $log.info('Modal dismissed at: ' + new Date());
                  });

              };
              
              self.wantModifyPlugin = function(index){
                  var plugin = self.dashboard.getPlugin(index);
                  
                  var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'app/components/homethings/'+self.dashboard.name+'.modal.html',
                    controller:  self.dashboard.name+'ModalController',
                    size: 'lg',
                    resolve: {
                        options:function() {
                            return{
                                plugin: plugin,
                                mode: FormState.MODIFY
                                }
                            }
                        }
                    });
                    
                     modalInstance.result.then(function (result) {
                        $log.log(result);
                        plugin.setSettings(result.plugin);
                    }, function () {
                        $log.info('Modal dismissed at: ' + new Date());
                    });
              }
            self.modifyDatasource = function(name){
                var ds=self.datasources[name];
                $log.log(ds);$log.log(name);
                ds.edit(function(){
                    var deferred = $q.defer();
                    
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

                    
                    modalInstance.result.then(function (result) {
                        $log.log(result);
                        ds.setSettings(result.plugin);
                        //self.datasources[name]=new Datasource(selectedItem);
                        //self.datasources[name].setType(_.find(datasourcePlugins.all(),function(datasource){return selectedItem.type == datasource.type_name}));
                        deferred.resolve();
                    }, function () {
                        $log.info('Modal dismissed at: ' + new Date());
                        deferred.resolve();
                    });
                    
                    return deferred.promise;
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
                self.dashboard.createPane();
               // self.panes.push(new Pane({x:0,y:0,width:2,height:1}));
                $log.log(self.dashboard.panes);
            };
           
            self.deletePane = function(index){
                self.dashboard.deletePane(index);
                
                //self.panes[index].deleteWidgets();
                //self.panes.splice(index,1);
            };
            
            self.editPane = function(index){
                var settings=angular.copy(self.panes[index].settings);
                var pane=self.dashboard.panes[index];
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'app/components/homethings/pane.modal.html',
                    controller: 'PaneModalController',
                    size: 'lg',
                    resolve: {
                        options:function() {
                            return{
                                settings: settings,
                                mode: FormState.MODIFY
                                }
                            }
                        }
                    });


                  modalInstance.result.then(function (settings) {
                        pane.settings=settings;
                  }, function () {
                    $log.info('Modal dismissed at: ' + new Date());
                  });
            };
            
            
            self.addWidget = function(indexPane){
              //  $log.log('add widget to pane '+indexPane);
              //  $log.log(self.dashboard.panes[indexPane]);
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


                  modalInstance.result.then(function (result) {
                       $log.log('adding widget');
                        $log.log(result);
                        var widget=new Widget(result.plugin,result.type);
                        //widget.setType(_.find(widgetPlugins.all(),function(widget){return selectedItem.type_name == widget.type_name}));
                        self.dashboard.panes[indexPane].addWidget(widget);
                        //$log.log(self.panes);
                  }, function () {
                    $log.info('Modal dismissed at: ' + new Date());
                  });
            };
            
            self.editWidget = function(indexPane,indexWidget){
                $log.log('edit widget ' + indexWidget + ' of pane '+indexPane );
                var widget=self.dashboard.panes[indexPane].getWidget(indexWidget);
                
                
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'app/components/homethings/widget.modal.html',
                    controller: 'WidgetModalController',
                    size: 'lg',
                    resolve: {
                        options:function() {
                            return{
                                mode: FormState.MODIFY,
                                widget:widget
                                }
                            }
                        }
                    });


                  modalInstance.result.then(function (result) {
                       widget.setSettings(result.plugin);
                  }, function () {
                    $log.info('Modal dismissed at: ' + new Date());
                  });
            }
            
            self.deleteWidget = function(indexPane,indexWidget){
                $log.log('delete widget ' + indexWidget + ' of pane '+indexPane );
                self.panes[indexPane].deleteWidget(indexWidget);
            }
            self.changeDashboardTo('inputs');
            self.addPane();
            //self.dashboard.allowEdit = false;
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
  
   
  .controller('DatasourceModalController',function($log,$scope,$uibModalInstance,plugins/*datasourcePlugins*/,PluginsType,FormState,PluginState,options){
     var self=$scope;
     self.datasources=plugins.all(PluginsType.DATASOURCE);
     self.datasource = options.datasource;
     
     self.mode = options.mode;
     self.selected={
         item:{}
     };
     if(self.mode == FormState.MODIFY){
        self.selected.item = plugins.get(self.datasource.settings.type,PluginsType.DATASOURCE);
        $log.log(self.datasource);
        $log.log(self.selected.item);
        self.plugin=angular.copy(self.datasource.settings);
     }
     
     self.ok = function () {
        $uibModalInstance.close({plugin:self.plugin,type:self.selected.item});
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
    self.settings = options.settings;
    self.ok = function () {
        $uibModalInstance.close(self.settings);
    };

    self.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
  })
  
.controller('WidgetModalController',function($log,$scope,$uibModalInstance,FormState,PluginState,plugins/*widgetPlugins*/,PluginsType,options){
    var self = $scope;
    self.mode = options.mode;
    self.widgets = plugins.all(PluginsType.WIDGET);
    self.widget = options.widget;
    self.plugin= {};
    self.selected={
        item:{}
    };

    if(self.mode == FormState.MODIFY){
        self.selected.item = plugins.get(self.widget.settings.type,PluginsType.WIDGET);
        
        self.plugin=angular.copy(self.widget.settings);
     }
     
    self.ok = function () {
        $uibModalInstance.close({plugin:self.plugin,type:self.selected.item});
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
  
  .directive('dashboardHeader',function(){
      return{
          restrict:'E',
          replace:true,
          templateUrl:'app/components/homethings/dashboard.header.html'
          
      }
  })
  .directive('dashboardPane',function($log){
      return{
          restrict:'E',
          replace:true,
         
          template:'<div  class="toggle-header"><i class="fa" aria-hidden="true"></i></div>',
          link:function($scope,element,attrs){
              $log.log('Header toggler:');$log.log(attrs.command);
             angular.element(element).click(function(e){
                  e.preventDefault();
                  $scope.changeDashboardTo(attrs.command);
                  $scope.$apply();
              });
              element.find('i').addClass('fa-'+attrs.icon);
              /*$scope.toolboxAction = function(){
                  return 'app/components/homethings/dashboard.header.'+attrs.command+'.action.html';
              };
              $scope.toolboxContent = function(){
                  return 'app/components/homethings/dashboard.header.'+attrs.command+'.content.html';
              }
              $scope.icon=attrs.icon;*/
          }
          
          
      }
  })

.directive('dashboardSettings',function($log){
    return{
        restrict:'E',
        replace:true,
        template:'<div  class="toggle-header" ng-show="!dashboard.allowEdit"><i class="fa fa-cogs" aria-hidden="true"></i></div>',
        link:function($scope,element,attrs){
             angular.element(element).click(function(e){
                  e.preventDefault();
                  $log.log('Show settings');
                  $scope.showSettings();
                  $scope.$apply();
              });
        }
        
    };
})
 
 /*.directive('dashboardContent',function(){
    return{
        restrict:'E',
        replace:true,
        transclude:true,
        template:'<div ng-transclude></div>'
        
    };
  })*/
.directive('calculatedField',function(){
    return{
        restrict:'E',
        replace:true,
        templateUrl:'app/components/homethings/calculatedField.html'
        
    }
})
.directive('paneResize',function($log){
    return {
        restrict:'A',
        link:function($scope,$element,attrs){
            $log.log('link pane resize');
            angular.element($element).resize(function(){
                $log.log('Element '+$element.id +' was resized');
            });
        }
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

.directive('widget',function($rootScope,$log,$interpolate,$parse){
    return {
        restrict:'E',
        replace:true,
        templateUrl:'app/components/homethings/widget.html',
        /*scope:{
            datasources:'=',
            
        },*/
        controller:function($scope){
            $log.log('scope widget');
            
            $log.log($scope.widget.settings.value);
            var listeners=[];
           
            $scope.$watch('widget.settings',function(){
                $log.log('widget settings change');
                
                calculate();
            },true);
            
            function unsubscribe(){
                _.forEach(listeners,function(listener){
                    $rootScope.$$listeners[listener] = [];
                })
                listeners.splice(0,listeners.length);
            }
            function calculate(){
                unsubscribe();
                var ds=$scope.widget.settings.value.split('.');
                if(ds[0] == 'datasources'){
                    $log.log('calculate field as datasource');
                    var s=ds[0]+"['"+ds[1]+"']";
                    //var dds=$parse(s)($scope);
                    $log.log(ds[2]);
                    $scope.value="";
                    listeners.push('DATASOURCE.'+ds[1].toUpperCase());
                    $rootScope.$on(listeners[0],function(event,data){
                        $log.log(ds[1] + ' datasource change'); 
                        $log.log(data.data);
                        $scope.value = data.data[ds[2]];
                        $scope.$apply();
                    });
                }else{
                    $log.log('calculate field as function');
                    var script = $scope.widget.settings.value;
                    var fn = new Function("datasources",script);
                    var datasourceRegex = new RegExp("datasources.([\\w_-]+)|datasources\\[['\"]([^'\"]+)", "g");
                    // Are there any datasources we need to be subscribed to?
					var matches;
                    
					while (matches = datasourceRegex.exec(script)) {
						var dsName = (matches[1] || matches[2]);
						$log.log('find datasource in script');$log.log(dsName);
                        //TODO
                        var listener='DATASOURCE.'+dsName.toUpperCase();
                        listeners.push(listener);
                        $rootScope.$on(listener,function (event,data) {
                            $scope.value = fn($scope.datasources);
                        },true);
					}
                    
                    
                   // $scope.$watch('')
                    //var s=$parse($scope.widget.settings.value)($scope);
                    //$rootScope.$on('DATASOURCE.'+ds[1].toUpperCase(),function(event,data){
                        $scope.value = fn($scope.datasources);
                // });            
                }
            }
            //calculate();
        }/*,
        link:function($scope,$element,attr){
            
           
        }*/
    }    
})

.directive('saveDashboard',function(){
    return{
        restrict:'E',
        replace:true,
        templateUrl:'app/components/homethings/dashboard.save.html',
        link:function($scope,element,attrs){
            var target = angular.element(element).find('label').first();
            target.on('click',function(){
                var siblingsShown = target.data('siblings-shown') || false;
                if(!siblingsShown){
                    $(event.currentTarget).siblings('label').fadeIn('slow');
                }else{
                    $(event.currentTarget).siblings('label').fadeOut('slow');
                }
                target.data('siblings-shown', !siblingsShown);
            });
            
        }
    }
    
})

/*.provider('datasourcePlugins',function(_){
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
      
  })*/
   
  .provider('plugins',function(_){
      var self=this;
      self.plugins={};
      self._check = function(type){
          if( !(type in self.plugins))
                self.plugins[type]=[];
      }
      return{
          add:function(plugin,type){
            self._check(type);
            self.plugins[type].push(plugin);
          },
          all:function(type){
            self._check(type);
            return self.plugins[type];
          },
          $get:function(){
              return{
                    add:function(plugin,type){
                        self._check(type);
                        self.plugins[type].push(plugin);
                    },
                    all:function(type){
                        self._check(type);
                        return self.plugins[type];
                    },
                    get:function(name,type){
                        self._check(type);
                        return _.find(self.plugins[type],function(plugin){return plugin.type_name==name;});
                    },
                    has:function(plugin,type){
                        self._check(type);
                        return _.find(self.plugins,function(plugin){return plugin.type_name==plugin.type_name;})!= undefined
                    }
              }
              
          }
      }
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
  .factory('Dashboard',function($log,Pane){
      function Dashboard(name,pluginType){
          $log.log('Create new Dashboard :'+name);
          var self=this;
          self.name=name;
          self.pluginType;
          self.version = 0;
          self.isEditing = false;
          self.allowEdit = false;
          self.panes = [];
          self.plugins = [];
      }
      
      Dashboard.prototype={
          processDatasourceUpdate:function(datasource,newData){
              
          },
          addPlugin:function(plugin){
              self.plugins.push(plugin);
          },
          getPlugin:function(index){
            return self.plugins[index];  
          },
          serialize:function(){
              
          },
          
          deserialize : function(object, finishedCallback){
              
          },
          clearDashboard : function(){
              _.forEach(self.panes,function(pane,index){
                 self.deleteWidgets(index);
              });
              self.panes.splice(0,self.panes.length);
           },
          loadDashboard : function(dashboardData, callback){
              
          },
          loadDashboardFromLocalFile : function(){
              
          },
          saveDashboardClicked:function(){
              
          },
          saveDashboard: function(_thisref, event){},
          
          createPane : function(){
              this.panes.push(new Pane());
          },
          deletePane : function(index){
              this.panes[index].deleteWidgets();
              this.panes.splice(index,1);
          },
          deleteWidget : function(indexPane,indexWidget){
              this.panes[indexPane].deleteWidget(indexWidget);
          },
          deleteWidgets:function(indexPane){
              this.panes[indexPane].deleteWidgets();
          },
          setEditing : function(editing){
              this.allowEdit=editing;
          },
          toggleEditing : function(){
              this.allowEdit=!self.allowEdit;
          }
          
      };

      return Dashboard;
  })
  
  
  .factory('Plugin',function($log,$interval,$rootScope,plugins,PluginsType,PluginState){
      function Plugin(settings,type,pluginType){
          var self = this;
          self.instance = undefined;
          self.settings = {};
          self.type = undefined;
          self.pluginType=pluginType;
          
          function setType(type){
            $log.log('try to set type to:'+type);
            if(type == undefined)return;
           
            $log.log('Datasource.type change to:');$log.log(type);
            self.disposeInstance();
            if(plugins.has(type,pluginType) && _.isFunction(type.newInstance)){
                $log.log('try instantiate');
                function finishLoad()
                    {
                        type.newInstance(self.settings,  function(instance)
                        {
                           self.instance = instance;
                           self.type = type;
                          //  instance.updateNow();
                          self.settings.state = PluginState.CREATED;
                          $log.log(type.display_name +' was created');
                          
                          self.start();

                        }, self.startCallback,self.updateCallback,self.stopCallback ,$interval);
                    }
                if(_.isArray(type.external_scripts) && type.external_scripts>0)
                {
                    head.js(type.external_scripts.slice(0), finishLoad); // Need to clone the array because head.js adds some weird functions to it
                }
                else
                {
                    finishLoad();
                }
            } 
          }
          self.disposeInstance=function(){
                if(!_.isUndefined(this.instance))
                {
                    if(_.isFunction(this.instance.onDispose))
                    {
                        this.instance.onDispose();
                    }

                    this.instance = undefined;
                }
            };
            
          self.startCallback = function(){
                self.isRunning = true;
                $log.log(self.settings.name+ " is started in callback");
            };
            
            self.updateCallback=function(newData){
                self.latestData=newData;
                var now = new Date();
                self.last_updated=now.toLocaleTimeString();
                $rootScope.$broadcast('DATASOURCE.'+self.settings.name.toUpperCase(),{object:self,data:newData});
            };
            
            self.stopCallback = function(){
                self.isRunning = false;
                $log.log(self.settings.name+ " is stopped in callback");
            }
            
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
            
            
            self.edit = function(callback){
                if(_.isUndefined(self.instance))return;
                var tmprunning=self.isRunning;
                self.stop();
                callback().then(function(){
                    if(tmprunning)
                        self.start();
                });
            
            }
        
          if (settings) {
            this.setSettings(settings);
          }
          setType(type);
      }
      
        
      Plugin.prototype = {
        
        setSettings: function(settings) {
            angular.extend(this.settings, settings);
        },

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
      }
      
      return Plugin;
  })
   .factory('Datasource', function($log,$rootScope,$interval,propertyChanged,plugins,PluginsType,PluginState,_,Plugin){
    function Datasource(settings,type,pluginType) {
        Plugin.call(this,settings,type,pluginType)
    }
    Datasource.prototype = Object.create(Plugin.prototype,{
        
    });
    
    return Datasource;
 })
  /** DatasourceModel */
  /*
  .factory('Datasource', function($log,$rootScope,$interval,propertyChanged,plugins,PluginsType,PluginState,_){
    function Datasource(settings,type) {
        var self = this;
        
        self.instance = undefined;
        //self.name = "";
        self.latestData = {};
        self.settings = {};
        self.type = undefined;
        self.last_updated = new Date().toLocaleTimeString();
        self.last_error = {};
        self.isRunning=false;
 
        function setType (datasource){
            $log.log('try to set type to:'+datasource);
            if(datasource == undefined)return;
            type=datasource;
            $log.log('Datasource.type change to:');$log.log(datasource);
            self.disposeInstance();
            if(   plugins.has(datasource,PluginsType.DATASOURCE) && _.isFunction(datasource.newInstance)){
                $log.log('try instantiate');
                var datasourceType =datasource;
                function finishLoad()
                    {
                        datasourceType.newInstance(self.settings,  function(instance)
                        {

                           self.instance = instance;
                           self.type = type;
                          //  instance.updateNow();
                          self.settings.state = PluginState.CREATED;
                          $log.log(datasourceType.display_name +' was created');
                          
                          self.start();

                        }, self.startCallback,self.updateCallback,self.stopCallback ,$interval);
                    }
                if(_.isArray(datasourceType.external_scripts) && datasourceType.external_scripts>0)
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
        
        self.startCallback = function(){
            self.isRunning = true;
            $log.log(self.settings.name+ " is started in callback");
        };
        
        self.updateCallback=function(newData){
            self.latestData=newData;
            var now = new Date();
            self.last_updated=now.toLocaleTimeString();
            $rootScope.$broadcast('DATASOURCE.'+self.settings.name.toUpperCase(),{object:self,data:newData});
        };
        
        self.stopCallback = function(){
            self.isRunning = false;
            $log.log(self.settings.name+ " is stopped in callback");
        }
        
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
        
        
        self.edit = function(callback){
            if(_.isUndefined(self.instance))return;
            var tmprunning=self.isRunning;
            self.stop();
            callback().then(function(){
                if(tmprunning)
                    self.start();
            });
           
        }
        
        if (settings) {
            this.setSettings(settings);
        }
        setType(type);
    };

    
    Datasource.prototype = {
        
        setSettings: function(settings) {
            angular.extend(this.settings, settings);
        },

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
  })*/
  
  /** PaneModel */
  .factory('Pane',function($log){
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
          deleteWidget:function(index){
               $log.log('Delete widget:'+index);
               $log.log(this.widgets[index]);
               this.widgets[index].dispose();
              this.widgets.splice(index,1);
          },
          deleteWidgets:function(){
            _.forEach(this.widget,function(widget){widget.dispose();});
            self.widgets=[];  
          },
          getWidget : function(index){
            return this.widgets[index];  
          },
          getWidgets:function(){return this.widgets;},
          

          widgetCanMoveUp:function(widgetIndex){
              return widgetIndex>0;
          },
          widgetCanMoveDown:function(widgetIndex){
              return (widgetIndex+1)<this.widgets.length;
          },
          widgetMoveUp:function(widgetIndex){
              if(!this.widgetCanMoveUp)return;
              var w=this.widgets[widgetIndex-1];
              this.widgets[widgetIndex-1]= this.widgets[widgetIndex];
              this.widgets[widgetIndex]=w;
          },
          widgetMoveDown:function(widgetIndex){
              if(!this.widgetCanMoveDown)return;
              var w=this.widgets[widgetIndex+1];
              this.widgets[widgetIndex+1]= this.widgets[widgetIndex];
              this.widgets[widgetIndex]=w;
              
          },
          processSizeChange:function(){},
          getCalculateHeight:function(){},
          serialize:function(){},
          deserialize:function(){},
          
      }
      
      
        
      return Pane;
      
  })
  
  /**WidgetModel */
  .factory('Widget',function($log,$templateCache,widgetPlugins){
      function Widget(settings,type){
          var self=this;
          self.datasourceRefreshNotifications={};
          self.calculatedSettingScripts={};
          self.fillSize = false;
          self.type = undefined;
          self.settings={};
          self._heightUpdate=undefined;
          self.shouldRender=false;
          self.instance=undefined;
          
          function setType(type){
              $log.log('Widget set type to ');$log.log(type);
              if(type == undefined) return;
              self.disposeInstance();
              $log.log('widget set type');$log.log(widgetPlugins.has(type));$log.log(_.isFunction(type.newInstance));
              if ( widgetPlugins.has(type) && _.isFunction(type.newInstance)) {
                 $log.log('toto');
               

                function finishLoad() {
                    $log.log('start finishLoad')
                    type.newInstance(self.settings, function (instance) {
                        self.type=type;
                        self.instance=instance;
                        self.fillSize=(type.fill_size === true);
                        self.shouldRender=true;
                        self.type=type;
                        //self._heightUpdate.valueHasMutated();
                        $log.log('widget end new instance');
                    },$templateCache);
                }

                // Do we need to load any external scripts?
                if (_.isArray(type.external_scripts) && type.external_scripts.lengh>0) {
                    head.js(type.external_scripts.slice(0), finishLoad); // Need to clone the array because head.js adds some weird functions to it
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
            self.setSettings(settings);
          setType(type);
      }
      
      Widget.prototype={
          setSettings: function(settings){angular.extend(this.settings, settings);},
          processDatasourceUpdate:function(datasourceName){},
          callValueFunction:function(fn){},
          processSizeChange:function(){},
          processCalculatedSetting : function (settingName){},
          updateCalculatedSettings : function () {},
          render : function (element) {},
          dispose : function () {
             this.disposeInstance();
          },
          serialize : function () {},
          deserialize : function (object) {}
      }
      return Widget;
  })
  ;
  
  
})(angular,_,WatchJS.watch,head,$);

