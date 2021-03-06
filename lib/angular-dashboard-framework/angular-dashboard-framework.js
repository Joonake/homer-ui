/*
 * The MIT License
 *
 * Copyright (c) 2015, Sebastian Sdorra
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

angular.module('adf', ['adf.provider', 'ui.bootstrap'])
  .value('adfTemplatePath', '../src/templates/')
  .value('rowTemplate', '<adf-dashboard-row row="row" adf-model="adfModel" collapsible="collapsible" edit-mode="editMode" ng-repeat="row in column.rows" />')
  .value('columnTemplate', '<adf-dashboard-column column="column" adf-model="adfModel" collapsible="collapsible" edit-mode="editMode" ng-repeat="column in row.columns" />')
  .value('adfVersion', '0.8.0-SNAPSHOT');

/*
* The MIT License
*
* Copyright (c) 2015, Sebastian Sdorra
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/


/* global angular */
angular.module('adf')
  .directive('adfDashboardColumn', function ($log, $compile, adfTemplatePath, rowTemplate, dashboard) {
    'use strict';

    /**
     * moves a widget in between a column
     */
    function moveWidgetInColumn($scope, column, evt){
      var widgets = column.widgets;
      // move widget and apply to scope
      $scope.$apply(function(){
        widgets.splice(evt.newIndex, 0, widgets.splice(evt.oldIndex, 1)[0]);
      });
    }

    /**
     * finds a widget by its id in the column
     */
    function findWidget(column, index){
      var widget = null;
      for (var i=0; i<column.widgets.length; i++){
        var w = column.widgets[i];
        if (w.wid === index){
          widget = w;
          break;
        }
      }
      return widget;
    }

    /**
     * finds a column by its id in the model
     */
    function findColumn(model, index){
      var column = null;
      for (var i=0; i<model.rows.length; i++){
        var r = model.rows[i];
        for (var j=0; j<r.columns.length; j++){
          var c = r.columns[j];
          if ( c.cid === index ){
            column = c;
            break;
          } else if (c.rows){
            column = findColumn(c, index);
          }
        }
        if (column){
          break;
        }
      }
      return column;
    }

    /**
     * get the adf id from an html element
     */
    function getId(el){
      var id = el.getAttribute('adf-id');
      return id ? parseInt(id) : -1;
    }

    /**
     * adds a widget to a column
     */
    function addWidgetToColumn($scope, model, targetColumn, evt){
      // find source column
      var cid = getId(evt.from);
      var sourceColumn = findColumn(model, cid);

      if (sourceColumn){
        // find moved widget
        var wid = getId(evt.item);
        var widget = findWidget(sourceColumn, wid);

        if (widget){
          // add new item and apply to scope
          $scope.$apply(function(){
            targetColumn.widgets.splice(evt.newIndex, 0, widget);
          });
        } else {
          $log.warn('could not find widget with id ' + wid);
        }
      } else {
        $log.warn('could not find column with id ' + cid);
      }
    }

    /**
     * removes a widget from a column
     */
    function removeWidgetFromColumn($scope, column, evt){
      // remove old item and apply to scope
      $scope.$apply(function(){
        column.widgets.splice(evt.oldIndex, 1);
      });
    }

    /**
     * enable sortable
     */
    function applySortable($scope, $element, model, column){
      // enable drag and drop
      var el = $element[0];
      var sortable = Sortable.create(el, {
        group: 'widgets',
        handle: '.fa-arrows',
        ghostClass: 'placeholder',
        animation: 150,
        onAdd: function(evt){
          addWidgetToColumn($scope, model, column, evt);
        },
        onRemove: function(evt){
          removeWidgetFromColumn($scope, column, evt);
        },
        onUpdate: function(evt){
          moveWidgetInColumn($scope, column, evt);
        }
      });

      // destroy sortable on column destroy event
      $element.on('$destroy', function () {
        sortable.destroy();
      });
    }

    return {
      restrict: 'E',
      replace: true,
      scope: {
        column: '=',
        editMode: '=',
        adfModel: '=',
        collapsible: '='
      },
      templateUrl: adfTemplatePath + 'dashboard-column.html',
      link: function ($scope, $element) {
        // set id
        var col = $scope.column;
        if (!col.cid){
          col.cid = dashboard.id();
        }

        if (angular.isDefined(col.rows) && angular.isArray(col.rows)) {
          // be sure to tell Angular about the injected directive and push the new row directive to the column
          $compile(rowTemplate)($scope, function(cloned) {
            $element.append(cloned);
          });
        } else {
          // enable drag and drop for widget only columns
          applySortable($scope, $element, $scope.adfModel, col);
        }
      }
    };
  });

/*
 * The MIT License
 *
 * Copyright (c) 2015, Sebastian Sdorra
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * @ngdoc directive
 * @name adf.directive:adfDashboard
 * @element div
 * @restrict EA
 * @scope
 * @description
 *
 * `adfDashboard` is a directive which renders the dashboard with all its
 * components. The directive requires a name attribute. The name of the
 * dashboard can be used to store the model.
 */

angular.module('adf')
  .directive('adfDashboard', function ($rootScope, $log, $modal, dashboard, adfTemplatePath) {
    'use strict';

    function copyWidgets(source, target) {
      if ( source.widgets && source.widgets.length > 0 ){
        var w = source.widgets.shift();
        while (w){
          target.widgets.push(w);
          w = source.widgets.shift();
        }
      }
    }

    /**
    * Copy widget from old columns to the new model
    * @param object root the model
    * @param array of columns
    * @param counter
    */
    function fillStructure(root, columns, counter) {
      counter = counter || 0;

      if (angular.isDefined(root.rows)) {
        angular.forEach(root.rows, function (row) {
          angular.forEach(row.columns, function (column) {
            // if the widgets prop doesn't exist, create a new array for it.
            // this allows ui.sortable to do it's thing without error
            if (!column.widgets) {
              column.widgets = [];
            }

            // if a column exist at the counter index, copy over the column
            if (angular.isDefined(columns[counter])) {
              // do not add widgets to a column, which uses nested rows
              if (!angular.isDefined(column.rows)){
                copyWidgets(columns[counter], column);
                counter++;
              }
            }

            // run fillStructure again for any sub rows/columns
            counter = fillStructure(column, columns, counter);
          });
        });
      }
      return counter;
    }

    /**
    * Read Columns: recursively searches an object for the 'columns' property
    * @param object model
    * @param array  an array of existing columns; used when recursion happens
    */
    function readColumns(root, columns) {
      columns = columns || [];

      if (angular.isDefined(root.rows)) {
        angular.forEach(root.rows, function (row) {
          angular.forEach(row.columns, function (col) {
            columns.push(col);
            // keep reading columns until we can't any more
            readColumns(col, columns);
          });
        });
      }

      return columns;
    }

    function changeStructure(model, structure){
      var columns = readColumns(model);
      var counter = 0;

      model.rows = angular.copy(structure.rows);

      while ( counter < columns.length ){
        counter = fillStructure(model, columns, counter);
      }
    }

    function createConfiguration(type){
      var cfg = {};
      var config = dashboard.widgets[type].config;
      if (config){
        cfg = angular.copy(config);
      }
      return cfg;
    }

    return {
      replace: true,
      restrict: 'EA',
      transclude : false,
      scope: {
        structure: '@',
        name: '@',
        collapsible: '@',
        editable: '@',
        adfModel: '=',
        adfWidgetFilter: '='
      },
      controller: function($scope){
        var model = {};
        var structure = {};
        var widgetFilter = {};
        var structureName = {};
        var name = $scope.name;

        // Watching for changes on adfModel
        $scope.$watch('adfModel', function(oldVal, newVal) {
          // has model changed or is the model attribute not set
          if (newVal !== null || (oldVal === null && newVal === null)) {
            model = $scope.adfModel;
            widgetFilter = $scope.adfWidgetFilter;
            if ( ! model || ! model.rows ){
              structureName = $scope.structure;
              structure = dashboard.structures[structureName];
              if (structure){
                if (model){
                  model.rows = angular.copy(structure).rows;
                } else {
                  model = angular.copy(structure);
                }
                model.structure = structureName;
              } else {
                $log.error( 'could not find structure ' + structureName);
              }
            }

            if (model) {
              if (!model.title){
                model.title = '';
                model.protect =  false;
                model.selectedItem = "fa-home";
		model.alias = "";
		model.weight = 10;
                
              }
              $scope.model = model;
            } else {
              $log.error('could not find or create model');
            }
          }
        }, true);

        // edit mode
        $scope.editMode = false;
        $scope.editClass = '';

        $scope.toggleEditMode = function(){
          $scope.editMode = ! $scope.editMode;
    		  if ($scope.editMode){
            $scope.modelCopy = angular.copy($scope.adfModel, {});
    		  }

          if (!$scope.editMode){
            $rootScope.$broadcast('adfDashboardChanged', name, model);
          }
        };

        $scope.cancelEditMode = function(){
          $scope.editMode = false;
		      $scope.modelCopy = angular.copy($scope.modelCopy, $scope.adfModel);
        };
        
        $scope.deleteBoard = function(){
          $rootScope.$broadcast('adfDashboardRequestedForDelete', name);
        };

        // edit dashboard settings
        $scope.editDashboardDialog = function(){

	  $scope.icons = ['fa-home','fa-search','fa-dashboard','fa-tasks','fa-gear','fa-warning'];
	  $scope.selectedItem = $scope.icons[0];

          var editDashboardScope = $scope.$new();
          // create a copy of the title, to avoid changing the title to
          // "dashboard" if the field is empty
          editDashboardScope.copy = {
            title: model.title,
            protect: model.protect,
            selectedItem: model.selectedItem,
	    alias: model.alias,
	    weight: model.weigth
          };
          
          editDashboardScope.structures = dashboard.structures;
          var instance = $modal.open({
            scope: editDashboardScope,
            templateUrl: adfTemplatePath + 'dashboard-edit.html'
          });
          $scope.changeStructure = function(name, structure){
            $log.info('change structure to ' + name);
            changeStructure(model, structure);
          };
          editDashboardScope.closeDialog = function(){
            // copy the new title back to the model
            
            model.title = editDashboardScope.copy.title;	    
            //
            model.protect = editDashboardScope.copy.protect;
            model.selectedItem = editDashboardScope.copy.selectedItem;
            model.alias = editDashboardScope.copy.alias;
            model.weight = editDashboardScope.copy.weight;
            // close modal and destroy the scope
            instance.close();
            editDashboardScope.$destroy();
          };
        };

        // save as json dashboard 
        $scope.saveAsJson = function(){
	  $scope.toJSON = '';
	  $scope.toJSON = angular.toJson($scope.adfModel);
	  var blob = new Blob([$scope.toJSON], { type:"application/json;charset=utf-8;" });			
	  var downloadLink = angular.element('<a></a>');
          downloadLink.attr('href',window.URL.createObjectURL(blob));
          downloadLink.attr('download', name+'.json');
	  downloadLink[0].click();
        };

        // add widget dialog
        $scope.addWidgetDialog = function(){
          var addScope = $scope.$new();
          var widgets;
          if (angular.isFunction(widgetFilter)){
            widgets = {};
            angular.forEach(dashboard.widgets, function(widget, type){
              if (widgetFilter(widget, type)){
                widgets[type] = widget;
              }
            });
          } else {
            widgets = dashboard.widgets;
          }
          addScope.widgets = widgets;
          var opts = {
            scope: addScope,
            templateUrl: adfTemplatePath + 'widget-add.html'
          };
          var instance = $modal.open(opts);
          addScope.addWidget = function(widget){
            var w = {
              type: widget,
              config: createConfiguration(widget)
            };
            addScope.model.rows[0].columns[0].widgets.unshift(w);
            instance.close();

            addScope.$destroy();
          };
          addScope.closeDialog = function(){
            instance.close();
            addScope.$destroy();
          };
        };
      },
      compile: function($element, $attrs){
        if (!angular.isDefined($attrs.editable)){
          $attrs.editable = true;
        }
      },
      link: function ($scope, $element, $attr) {
        // pass attributes to scope
        $scope.name = $attr.name;
        $scope.structure = $attr.structure;
        $scope.editable = $attr.editable;
      },
      templateUrl: adfTemplatePath + 'dashboard.html'
    };
  });

/*
 * The MIT License
 *
 * Copyright (c) 2015, Sebastian Sdorra
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

/**
 * @ngdoc object
 * @name adf.dashboardProvider
 * @description
 *
 * The dashboardProvider can be used to register structures and widgets.
 */
angular.module('adf.provider', [])
  .provider('dashboard', function(){

    var widgets = {};
    var widgetsPath = '';
    var structures = {};
    var messageTemplate = '<div class="alert alert-danger">{}</div>';
    var loadingTemplate = '\
      <div class="progress progress-striped active">\n\
        <div class="progress-bar" role="progressbar" style="width: 100%">\n\
          <span class="sr-only">loading ...</span>\n\
        </div>\n\
      </div>';
      
   /**
    * @ngdoc method
    * @name adf.dashboardProvider#widget
    * @methodOf adf.dashboardProvider
    * @description
    *
    * Registers a new widget.
    *
    * @param {string} name of the widget
    * @param {object} widget to be registered.
    *
    *   Object properties:
    *
    *   - `title` - `{string=}` - The title of the widget.
    *   - `description` - `{string=}` - Description of the widget.
    *   - `config` - `{object}` - Predefined widget configuration.
    *   - `controller` - `{string=|function()=}` - Controller fn that should be
    *      associated with newly created scope of the widget or the name of a
    *      {@link http://docs.angularjs.org/api/angular.Module#controller registered controller}
    *      if passed as a string.
    *   - `controllerAs` - `{string=}` - A controller alias name. If present the controller will be
    *      published to scope under the `controllerAs` name.
    *   - `template` - `{string=|function()=}` - html template as a string.
    *   - `templateUrl` - `{string=}` - path to an html template.
    *   - `reload` - `{boolean=}` - true if the widget could be reloaded. The default is false.
    *   - `resolve` - `{Object.<string, function>=}` - An optional map of dependencies which should
    *      be injected into the controller. If any of these dependencies are promises, the widget
    *      will wait for them all to be resolved or one to be rejected before the controller is
    *      instantiated.
    *      If all the promises are resolved successfully, the values of the resolved promises are
    *      injected.
    *
    *      The map object is:
    *      - `key` – `{string}`: a name of a dependency to be injected into the controller.
    *      - `factory` - `{string|function}`: If `string` then it is an alias for a service.
    *        Otherwise if function, then it is {@link http://docs.angularjs.org/api/AUTO.$injector#invoke injected}
    *        and the return value is treated as the dependency. If the result is a promise, it is
    *        resolved before its value is injected into the controller.
    *   - `edit` - `{object}` - Edit modus of the widget.
    *      - `controller` - `{string=|function()=}` - Same as above, but for the edit mode of the widget.
    *      - `template` - `{string=|function()=}` - Same as above, but for the edit mode of the widget.
    *      - `templateUrl` - `{string=}` - Same as above, but for the edit mode of the widget.
    *      - `resolve` - `{Object.<string, function>=}` - Same as above, but for the edit mode of the widget.
    *      - `reload` - {boolean} - true if the widget should be reloaded, after the edit mode is closed.
    *        Default is true.
    *
    * @returns {Object} self
    */
    this.widget = function(name, widget){
      var w = angular.extend({reload: false}, widget);
      if ( w.edit ){
        var edit = {reload: true};
        angular.extend(edit, w.edit);
        w.edit = edit;
      }
      widgets[name] = w;
      return this;
    };

    /**
     * @ngdoc method
     * @name adf.dashboardProvider#widgetsPath
     * @methodOf adf.dashboardProvider
     * @description
     *
     * Sets the path to the directory which contains the widgets. The widgets
     * path is used for widgets with a templateUrl which contains the
     * placeholder {widgetsPath}. The placeholder is replaced with the
     * configured value, before the template is loaded, but the template is
     * cached with the unmodified templateUrl (e.g.: {widgetPath}/src/widgets).
     * The default value of widgetPaths is ''.
     *
     *
     * @param {string} path to the directory which contains the widgets
     *
     * @returns {Object} self
     */
    this.widgetsPath = function(path){
      widgetsPath = path;
      return this;
    };

   /**
    * @ngdoc method
    * @name adf.dashboardProvider#structure
    * @methodOf adf.dashboardProvider
    * @description
    *
    * Registers a new structure.
    *
    * @param {string} name of the structure
    * @param {object} structure to be registered.
    *
    *   Object properties:
    *
    *   - `rows` - `{Array.<Object>}` - Rows of the dashboard structure.
    *     - `styleClass` - `{string}` - CSS Class of the row.
    *     - `columns` - `{Array.<Object>}` - Columns of the row.
    *       - `styleClass` - `{string}` - CSS Class of the column.
    *
    * @returns {Object} self
    */
    this.structure = function(name, structure){
      structures[name] = structure;
      return this;
    };

   /**
    * @ngdoc method
    * @name adf.dashboardProvider#messageTemplate
    * @methodOf adf.dashboardProvider
    * @description
    *
    * Changes the template for messages.
    *
    * @param {string} template for messages.
    *
    * @returns {Object} self
    */
    this.messageTemplate = function(template){
      messageTemplate = template;
      return this;
    };

   /**
    * @ngdoc method
    * @name adf.dashboardProvider#loadingTemplate
    * @methodOf adf.dashboardProvider
    * @description
    *
    * Changes the template which is displayed as
    * long as the widget resources are not resolved.
    *
    * @param {string} loading template
    *
    * @returns {Object} self
    */
    this.loadingTemplate = function(template){
      loadingTemplate = template;
      return this;
    };

   /**
    * @ngdoc object
    * @name adf.dashboard
    * @description
    *
    * The dashboard holds all options, structures and widgets.
    *
    * @returns {Object} self
    */
    this.$get = function(){
      var cid = 0;

      return {
        widgets: widgets,
        widgetsPath: widgetsPath,
        structures: structures,
        messageTemplate: messageTemplate,
        loadingTemplate: loadingTemplate,
        id: function(){
          return ++cid;
        }
      };
    };

  });

/*
* The MIT License
*
* Copyright (c) 2015, Sebastian Sdorra
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/


/* global angular */
angular.module('adf')
  .directive('adfDashboardRow', function ($compile, adfTemplatePath, columnTemplate) {
    'use strict';

    return {
      restrict: 'E',
      replace: true,
      scope: {
        row: '=',
        adfModel: '=',
        editMode: '=',
        collapsible: '='
      },
      templateUrl: adfTemplatePath + 'dashboard-row.html',
      link: function ($scope, $element) {
        if (angular.isDefined($scope.row.columns) && angular.isArray($scope.row.columns)) {
          $compile(columnTemplate)($scope, function(cloned) {
            $element.append(cloned);
          });
        }
      }
    };
  });

/*
 * The MIT License
 *
 * Copyright (c) 2015, Sebastian Sdorra
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

angular.module('adf')
  .directive('adfWidgetContent', function($log, $q, $sce, $http, $templateCache,
    $compile, $controller, $injector, dashboard, $rootScope) {

    function parseUrl(url){
      var parsedUrl = url;
      if ( url.indexOf('{widgetsPath}') >= 0 ){
        parsedUrl = url.replace('{widgetsPath}', dashboard.widgetsPath)
                       .replace('//', '/');
        if (parsedUrl.indexOf('/') === 0){
          parsedUrl = parsedUrl.substring(1);
        }
      }
      return parsedUrl;
    }

    function getTemplate(widget){
      var deferred = $q.defer();

      if ( widget.template ){
        deferred.resolve(widget.template);
      } else if (widget.templateUrl) {
        // try to fetch template from cache
        var tpl = $templateCache.get(widget.templateUrl);
        if (tpl){
          deferred.resolve(tpl);
        } else {
          var url = $sce.getTrustedResourceUrl(parseUrl(widget.templateUrl));
          $http.get(url)
            .success(function(response){
              // put response to cache, with unmodified url as key
              $templateCache.put(widget.templateUrl, response);
              deferred.resolve(response);
            })
            .error(function(){
              deferred.reject('could not load template');
            });
        }
      }

      return deferred.promise;
    }

    function compileWidget($scope, $element, currentScope) {
      var model = $scope.model;
      var content = $scope.content;

      // create new scope
      var templateScope = $scope.$new();

      // pass config object to scope
      if (!model.config) {
        model.config = {};
      }

      templateScope.config = model.config;

      // local injections
      var base = {
        $scope: templateScope,
        widget: model,
        config: model.config
      };

      // get resolve promises from content object
      var resolvers = {};
      resolvers.$tpl = getTemplate(content);
      if (content.resolve) {
        angular.forEach(content.resolve, function(promise, key) {
          if (angular.isString(promise)) {
            resolvers[key] = $injector.get(promise);
          } else {
            resolvers[key] = $injector.invoke(promise, promise, base);
          }
        });
      }

      // resolve all resolvers
      $q.all(resolvers).then(function(locals) {
        angular.extend(locals, base);

        // compile & render template
        var template = locals.$tpl;
        $element.html(template);
        if (content.controller) {
          var templateCtrl = $controller(content.controller, locals);
          if (content.controllerAs){
            templateScope[content.controllerAs] = templateCtrl;
          }
          $element.children().data('$ngControllerController', templateCtrl);
        }
        $compile($element.contents())(templateScope);
      }, function(reason) {
        // handle promise rejection
        var msg = 'Could not resolve all promises';
        if (reason) {
          msg += ': ' + reason;
        }
        $log.warn(msg);
        $element.html(dashboard.messageTemplate.replace(/{}/g, msg));
      });

      // destroy old scope
      if (currentScope) currentScope.$destroy();

      return templateScope;
    }

    return {
      replace: true,
      restrict: 'EA',
      transclude: false,
      scope: {
        model: '=',
        content: '='
      },
      link: function($scope, $element) {
        var currentScope = compileWidget($scope, $element, null);
        
        var globalWidgetReload;
        var globalWidgetRecreate;
        
        $scope.changeReloading = function(val) { $scope.$parent.reloadingProgress = val; };
                
        $scope.$on('$destroy', function(){
              /* unsubscribe */
              if (typeof(globalWidgetReload) === "function") globalWidgetReload();
              if (typeof(globalWidgetRecreate) === "function") globalWidgetRecreate();
        });
        
                
        $scope.$on('widgetConfigChanged', function(){
          currentScope = compileWidget($scope, $element, currentScope);
        });
        $scope.$on('widgetReload', function(){                
            if($scope.content.refresh == true) {              
                    currentScope.reloadIt();                    
            }
            else {
                    $scope.$parent.reloadingProgress = true;                                         
                    currentScope = compileWidget($scope, $element, currentScope);            
                    $scope.$parent.reloadingProgress = false;                                         
            }
          
        });
        
        if($scope.content.reload && $scope.content.reload == true) 
        {
        
          globalWidgetReload = $rootScope.$on('globalWidgetReload', function(){
          
            if($scope.content.refresh == true) {              
                    currentScope.reloadIt($scope);
            }
            else {
                    $scope.$parent.reloadingProgress = true; 
                    currentScope = compileWidget($scope, $element, currentScope);            
                    $scope.$parent.reloadingProgress = false;
            }
          
            //currentScope = compileWidget($scope, $element, currentScope);            
          });
          
          globalWidgetRecreate = $rootScope.$on('globalWidgetRecreate', function(){
          
                $scope.$parent.reloadingProgress = true; 
                currentScope = compileWidget($scope, $element, currentScope);            
                $scope.$parent.reloadingProgress = false;
          });
        }
      }
    };

  });

/*
 * The MIT License
 *
 * Copyright (c) 2015, Sebastian Sdorra
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

angular.module('adf')
  .directive('adfWidget', function($log, $modal, dashboard, adfTemplatePath) {

    function stringToBoolean(string){
      switch(angular.isDefined(string) ? string.toLowerCase() : null){
        case 'true': case 'yes': case '1': return true;
        case 'false': case 'no': case '0': case null: return false;
        default: return Boolean(string);
      }
    }

    function preLink($scope){
      var definition = $scope.definition;
      if (definition) {
        var w = dashboard.widgets[definition.type];
        if (w) {
          // pass title
          if (!definition.title){
            definition.title = w.title;
          }

          // set id for sortable
          if (!definition.wid){
            definition.wid = dashboard.id();
          }

          // pass copy of widget to scope
          $scope.widget = angular.copy(w);

          // create config object
          var config = definition.config;
          if (config) {
            if (angular.isString(config)) {
              config = angular.fromJson(config);
            }
          } else {
            config = {};
          }

          // pass config to scope
          $scope.config = config;
          $scope.title = definition.title;

          // convert collapsible to string
          $scope.collapsible = stringToBoolean($scope.collapsible);

          // collapse
          $scope.isCollapsed = false;
        } else {
          $log.warn('could not find widget ' + definition.type);
        }
      } else {
        $log.debug('definition not specified, widget was probably removed');
      }
    }

    function postLink($scope, $element) {
      var definition = $scope.definition;
      if (definition) {
        // bind close function
        $scope.close = function() {
          var column = $scope.col;
          if (column) {
            var index = column.widgets.indexOf(definition);
            if (index >= 0) {
              column.widgets.splice(index, 1);
            }
          }
          $element.remove();
        };

        // bind reload function
        $scope.reload = function(){
          $scope.$broadcast('widgetReload');
        };

        // bind edit function
        $scope.edit = function() {
          var editScope = $scope.$new();

          var opts = {
            scope: editScope,
            templateUrl: adfTemplatePath + 'widget-edit.html'
          };

          var instance = $modal.open(opts);
          editScope.closeDialog = function() {
            instance.close();
            editScope.$destroy();

            var widget = $scope.widget;
            if (widget.edit && widget.edit.reload){
              // reload content after edit dialog is closed
              $scope.$broadcast('widgetConfigChanged');
            }
          };
        };
      } else {
        $log.debug('widget not found');
      }
    }

    return {
      replace: true,
      restrict: 'EA',
      transclude: false,
      templateUrl: adfTemplatePath + 'widget.html',
      scope: {
        definition: '=',
        col: '=column',
        editMode: '=',
        collapsible: '='
      },
      compile: function compile(){

        /**
         * use pre link, because link of widget-content
         * is executed before post link widget
         */
        return {
          pre: preLink,
          post: postLink
        };
      }
    };

  });

angular.module("adf").run(["$templateCache", function($templateCache) {$templateCache.put("../src/templates/dashboard-column.html","<div adf-id={{column.cid}} class=column ng-class=column.styleClass ng-model=column.widgets> <adf-widget ng-repeat=\"definition in column.widgets\" definition=definition column=column edit-mode=editMode collapsible=collapsible>  </adf-widget></div> ");
$templateCache.put("../src/templates/dashboard-edit.html","<div class=modal-header> <button type=button class=close ng-click=closeDialog() aria-hidden=true>&times;</button> <h4 class=modal-title>Edit Dashboard</h4> </div> <div class=modal-body> <form role=form> <div class=form-group> <label for=dashboardTitle>Dashboard Title</label> <input type=text class=form-control id=dashboardTitle ng-model=copy.title required> </div> <div class=form-group> <label>Promote to Menu </label> <input type=checkbox ng-model=copy.protect name=protect />  <div class=form-group ng-if=copy.protect> <label for=dashboardAlias>Dashboard Alias</label> <input type=text class=form-control id=dashboardAlias ng-model=copy.alias >  <label for=dashboardWeight>Dashboard Weight</label> <input type=text class=form-control id=dashboardWeight ng-model=copy.weight> <p>Selected Icon : <i class=\"fa {{copy.selectedItem}}\"> {{copy.selectedItem}}</i></p><select ng-model=\"copy.selectedItem\"><option ng-repeat=\"item in icons\" value=\"{{item}}\">{{item}}</option></select></div> </div> <hr/> <div class=form-group> <label>Dashboard Structure</label> <div class=radio ng-repeat=\"(key, structure) in structures\"> <label> <input type=radio value={{key}} ng-model=model.structure ng-change=\"changeStructure(key, structure)\"> {{key}} </label> </div> </div> </form> </div> <div class=modal-footer> <button type=button class=\"btn btn-primary\" ng-click=closeDialog()>Close</button> </div> ");
$templateCache.put("../src/templates/dashboard-row.html","<div class=row ng-class=row.styleClass>  </div> ");
$templateCache.put("../src/templates/dashboard.html","<div class=dashboard-container> <h1> {{model.title}} <span class=pull-right> <a href ng-if=editMode title=\"add new widget\" ng-click=addWidgetDialog()> <i class=\"fa fa-plus-square-o\"></i> </a> <a href ng-if=editMode title=\"'save as json'\" ng-click=saveAsJson()> <i class=\"fa fa-cloud-download\"></i> </a><a href ng-if=editMode title=\"edit dashboard\" ng-click=editDashboardDialog()> <i class=\"fa fa-gear\"></i> </a> <a href ng-if=editable title=\"{{editMode ? \'save changes\' : \'enable edit mode\'}}\" ng-click=toggleEditMode()> <i class=fa x-ng-class=\"{\'fa-th-large\' : !editMode, \'fa-save\' : editMode}\"></i> </a> <a href ng-if=editMode title=\"delete dashboard\" ng-click=deleteBoard()> <i class=\"fa fa-trash-o\"></i> </a> <a href ng-if=editMode title=\"undo changes\" ng-click=cancelEditMode()> <i class=\"fa fa-undo \"></i> </a> </span> </h1> <div class=dashboard x-ng-class=\"{\'edit\' : editMode}\"> <adf-dashboard-row row=row adf-model=model collapsible=collapsible ng-repeat=\"row in model.rows\" edit-mode=editMode> </adf-dashboard-row></div> </div> ");
$templateCache.put("../src/templates/widget-add.html","<div class=modal-header> <button type=button class=close ng-click=closeDialog() aria-hidden=true>&times;</button> <h4 class=modal-title>Add new widget</h4> </div> <div class=modal-body> <div style=\"display: inline-block;\"> <dl class=dl-horizontal> <dt ng-repeat-start=\"(key, widget) in widgets\"> <a href ng-click=addWidget(key)> {{widget.title}} </a> </dt> <dd ng-repeat-end=\"\" ng-if=widget.description> {{widget.description}} </dd> </dl> </div> </div> <div class=modal-footer> <button type=button class=\"btn btn-primary\" ng-click=closeDialog()>Close</button> </div>");
$templateCache.put("../src/templates/widget-edit.html","<div class=modal-header> <button type=button class=close ng-click=closeDialog() aria-hidden=true>&times;</button> <h4 class=modal-title>{{widget.title}}</h4> </div> <div class=modal-body> <div ng-if=\"widget.edit == false\"><form role=form> <div class=form-group> <label for=widgetTitle>Title</label> <input type=text class=form-control id=widgetTitle ng-model=definition.title placeholder=\"Enter title\" required> </div> </form></div> <div ng-if=widget.edit> <adf-widget-content model=definition content=widget.edit> </adf-widget-content></div> </div> <div class=modal-footer> <button type=button class=\"btn btn-primary\" ng-click=closeDialog()>Close</button> </div>");
$templateCache.put("../src/templates/widget.html","<div adf-id={{definition.wid}} class=\"widget panel panel-default\"> <div class=\"panel-heading clearfix\"> <h3 class=panel-title> {{definition.title}} <span class=pull-right> <a href title=\"reload widget content\" ng-if=widget.reload ng-click=reload()> <i class=\"fa \" ng-class=\"{'fa-spinner fa-spin': reloadingProgress, 'fa-refresh': !reloadingProgress}\"></i> </a>  <a href title=\"change widget location\" class=adf-move ng-if=editMode> <i class=\"fa fa-arrows\"></i> </a>  <a href title=\"collapse widget\" ng-show=\"collapsible && !isCollapsed\" ng-click=\"isCollapsed = !isCollapsed\"> <i class=\"fa fa-minus\"></i> </a>  <a href title=\"expand widget\" ng-show=\"collapsible && isCollapsed\" ng-click=\"isCollapsed = !isCollapsed\"> <i class=\"fa fa-plus\"></i> </a>  <a href title=\"edit widget configuration\" ng-click=edit() ng-if=editMode> <i class=\"fa fa-gear\"></i> </a>  <a href title=\"remove widget\" ng-click=close() ng-if=editMode> <i class=\"fa fa-times\"></i> </a> </span> </h3> </div> <div class=panel-body collapse=isCollapsed> <adf-widget-content model=definition content=widget> </adf-widget-content></div> </div> ");}]);
