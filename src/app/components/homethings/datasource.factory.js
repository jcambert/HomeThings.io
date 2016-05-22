(function(angular,_,watch,head) {
  'use strict';
  angular
  .module('homeThingsIo')
  .constant('_',_)
  .controller('dashboardController',function(){})
  .directive('dashboardUi',function($log, $uibModal,Dashboard,datasourcePlugins){
      return{
          restrict:'E',
          transclude:true,
          replace:true,
          template:'<div ng-transclude></div>',
         
          controller: function($scope){
              var self=$scope;
              self.dashboard = new Dashboard();
              
              self.datasources={}
              self.$on("#main-header_toggle",function(event,data){
                 
                 self.dashboard.allowEdit=!data.toggle; 
              });
              $log.log('datasources plugins:');$log.log(datasourcePlugins.all());
              self.addDatasource = function(){
                 var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'app/components/homethings/addDatasource.html',
                    controller: 'AddDatasourceModalController',
                    size: 'lg',
                    resolve: {
                       datasources:function(){ return datasourcePlugins.all();}
                       
                        }
                    });

                  modalInstance.result.then(function (selectedItem) {
                    $scope.selected = selectedItem;
                    alert(selectedItem.display_name);
                  }, function () {
                    $log.info('Modal dismissed at: ' + new Date());
                  });

              };
              
          },
          link:function($scope,$element,attrs){
              
          }
      }
  })
  
  .controller('AddDatasourceModalController',function($scope,$uibModalInstance,datasources){
     var self=$scope;
     self.datasources=datasources;
     self.selected={
         item:{}
     };
     self.plugin={};
     self.ok = function () {
        $uibModalInstance.close($scope.selected.item);
    };

    self.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
    self.addArray = function(name){
      alert(name);  
    };
    function createPlugin(){
        self.plugin={};
       _.forEach(self.item.settings,function(setting){
           switch (setting.type) {
               case 'integer':
                   self.plugin[setting.name]= setting.default || 0;
                   break;
               case 'text':
                    self.plugin[setting.name]= setting.default || "";
                    break;
               case 'boolean':
                    self.plugin[setting.name]=setting.default ||false;
                    break;
               case 'option':   
                    self.plugin[setting.name]= setting.default || "";
                    break;
               case 'array':
                    self.plugin[setting.name]= [];
                    break;
               default:
                   break;
           }
       });
    }
  })
  
  .directive('dashboardHeader',function(){
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
          template:'<div id="toggle-header" slide-toggle="#main-header" toggle-value="false" expanded="false" ng-show="dashboard.allowEdit==false"><i id="toggle-header-icon" class="fa fa-cogs" aria-hidden="true"></i></div>'
          
      }
  })
  
 .directive('dashboardContent',function(){
    return{
        restrict:'E',
        replace:true,
        transclude:true,
        template:'<span ng-transclude></span>'
        
    }
  })
  .directive('slideable', function () {
    return {
        restrict:'C',
        compile: function (element, attr) {
            // wrap tag
            var contents = element.html();
            element.html('<div class="slideable_content" style="margin:0 !important; padding:0 !important" >' + contents + '</div>');

            return function postLink(scope, element, attrs) {
                // default properties
                attrs.duration = (!attrs.duration) ? '1s' : attrs.duration;
                attrs.easing = (!attrs.easing) ? 'ease-in-out' : attrs.easing;
                element.css({
                    'overflow': 'hidden',
                    'height': '0px',
                    'transitionProperty': 'height',
                    'transitionDuration': attrs.duration,
                    'transitionTimingFunction': attrs.easing
                });
            };
        }
    };
})
.directive('slideToggle', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
           attrs.expanded = attrs.expanded=='true' || false; 
           attrs.toggleValue = attrs.toggleValue=='true' || false;
            element.bind('click', function() {
                 var target = document.querySelector(attrs.slideToggle);
                 
                
                var content = target.querySelector('.slideable_content');
                if(!attrs.expanded) {
                    content.style.border = '1px solid rgba(0,0,0,0)';
                    var y = content.clientHeight;
                    content.style.border = 0;
                    target.style.height = y + 'px';
                    
                } else {
                    target.style.height = '0px';
                }
                if(attrs.toggleValue){
                    attrs.expanded = !attrs.expanded;
                    scope.$emit(attrs.slideToggle+"_toggle",{toggle:attrs.expanded});
                }else{
                    scope.$emit(attrs.slideToggle+"_toggle",{toggle:!attrs.expanded});
                }
            });
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

  .provider('datasourcePlugins',function(_){
      var self=this;
      self.plugins=[];
      return{
          add:function(datasource){self.plugins.push(datasource);},
          all:function(){return self.plugins;},
          $get:function(){
              return{
                  all:function(){return self.plugins;},
                  get:function(name){return _.Find(self.plugins,function(plugin){return plugin.name==name;});}
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
  .factory('Datasource', function($log,$rootScope,propertyChanged,datasourcePlugins,_){
    function Datasource(data) {
        var self = this;
        
        self.instance = undefined;
        self.name = "";
        self.latestData = {};
        self.settings = {};
        self.type = {};
        self.last_updated = {}
        self.last_error = {};
        
 
        propertyChanged.setPropertyChanged('name','onNameChanged');
        propertyChanged.setPropertyChanged('last_updated','onLastUpdated');
        propertyChanged.setPropertyChanged('last_error','OnLastError');
        
        propertyChanged.setPropertyChanged('type',function(oldValue,newValue){
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
    }
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
  
  /** PaneModel */
  .factory('Pane',function(){
      function Pane(){
           var self=this;
           self.title="";
           self.widgets=[];
           
      }
      
      Pane.prototype={
          addWidget:function(widget){},
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
  .factory('Widget',function(){
      function Widget(){
          var self=this;
          self.datasourceRefreshNotifications={};
          self.calculatedSettingScripts={};
          self.title = "";
          self.fillSize = false;
          self.type = undefined;
          self.settings={};
          self._heightUpdate=undefined;
          self.shouldRender=false;
      }
      
      Widget.prototype={
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
  })
  ;
  
  
})(angular,_,WatchJS.watch,head);

