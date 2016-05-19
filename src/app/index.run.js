(function() {
  'use strict';

  angular
    .module('homeThingsIo')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log) {

    $log.debug('runBlock end');
  }

})();
