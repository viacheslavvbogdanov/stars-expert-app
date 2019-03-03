angular.module('app.directives', [])

  .directive('myEnter', function () {
    return function (scope, element, attrs) {
      element.bind("keydown keypress", function (event) {
        if(event.which === 13) {
          scope.$apply(function (){
            scope.$eval(attrs.myEnter);
          });

          event.preventDefault();
        }
      });
    };
  })

  .directive('focusMe', function($timeout) {
    return {
      link: function(scope, element, attrs) {
        $timeout(function() {
          element[0].focus();
        });
      }
    };
  })

  .directive('imgFadeInOnload', function () {
    const transition = 'opacity 0.5s';
    return {
      restrict: 'A',
      link: function postLink(scope, element, attr) {
        element.css('opacity', 0);
        element.css('-moz-transition', transition);
        element.css('-webkit-transition', transition);
        element.css('-o-transition', transition);
        element.css('transition', transition);
        element.bind("load", function () {
          element.css('opacity', 1);
        });
        element.attr('src', attr.imgFadeInOnload);
      }
    };
  });
