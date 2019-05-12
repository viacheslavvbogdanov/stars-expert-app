angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

    .state('stars', {
      url: '/stars',
      templateUrl: 'templates/stars.html',
      controller: 'starsCtrl'
    })

    .state('callLog', {
      cache: false,
      url: '/callog',
      templateUrl: 'templates/callLog.html',
      controller: 'callLogCtrl'
    })

    .state('avatar', {
      cache: false,
      url: '/avatar',
      templateUrl: 'templates/avatar.html',
      controller: 'avatarCtrl'
    })

    .state('my', {
      cache: false,
      url: '/my',
      templateUrl: 'templates/my.html',
      controller: 'myCtrl'
    })

    .state('settings', {
      cache: false,
      url: '/settings',
      templateUrl: 'templates/settings.html',
      controller: 'settingsCtrl'
    })

    .state('about', {
      url: '/about',
      templateUrl: 'templates/about.html',
      controller: 'aboutCtrl'
    })

    .state('signin', {
      cache: false,
      url: '/signin',
      templateUrl: 'templates/signin.html',
      controller: 'signinCtrl'
    })

    .state('login', {
      cache: false,
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'loginCtrl'
    })

    .state('resetPassword', {
      cache: false,
      url: '/resetpassword',
      templateUrl: 'templates/resetPassword.html',
      controller: 'resetPasswordCtrl'
    })

    .state('register', {
      cache: false,
      url: '/register',
      templateUrl: 'templates/register.html',
      controller: 'registerCtrl'
    })

    .state('editProfile', {
      cache: false,
      url: '/editprofile',
      templateUrl: 'templates/editProfile.html',
      controller: 'editProfileCtrl'
    })

    .state('icomingCallPrice', {
      cache: false,
      url: '/setprice',
      templateUrl: 'templates/icomingCallPrice.html',
      controller: 'icomingCallPriceCtrl'
    })

    .state('withdraw', {
      cache: false,
      url: '/withdraw',
      templateUrl: 'templates/withdraw.html',
      controller: 'withdrawCtrl'
    })

    .state('withdrawalResult', {
      cache: false,
      url: '/withdrawresult',
      templateUrl: 'templates/withdrawalResult.html',
      controller: 'withdrawalResultCtrl'
    })

    .state('topUpBalance', {
      cache: false,
      url: '/topup',
      templateUrl: 'templates/topUpBalance.html',
      controller: 'topUpBalanceCtrl'
    })

    .state('topUpResult', {
      cache: false,
      url: '/topupresult',
      templateUrl: 'templates/topUpResult.html',
      controller: 'topUpResultCtrl'
    })

    .state('star', {
      cache: false,
      url: '/star/{uid}',
      templateUrl: 'templates/star.html',
      controller: 'starCtrl'
    })

    .state('dialing', {
      cache: false,
      url: '/dialing/{uid}',
      templateUrl: 'templates/dialing.html',
      controller: 'dialingCtrl'
    })

    .state('call', {
      cache: false,
      url: '/call/{callId}',
      templateUrl: 'templates/call.html',
      controller: 'callCtrl'
    })

    .state('incomingCall', {
      cache: false,
      url: '/incomingcall/{callId}',
      templateUrl: 'templates/incomingCall.html',
      controller: 'incomingCallCtrl'
    })

    .state('chat', {
      cache: false,
      url: '/chat/{uid}',
      templateUrl: 'templates/chat.html',
      controller: 'chatCtrl'
  });

$urlRouterProvider.otherwise('/signin')


});
