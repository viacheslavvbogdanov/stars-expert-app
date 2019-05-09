// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js



angular.module('app', [
  'ionic',
  'app.controllers',
  'app.routes',
  'app.directives',
  'app.services',
  'gettext',
])

.config(function($ionicConfigProvider, $sceDelegateProvider){

  $sceDelegateProvider.resourceUrlWhitelist([ 'self','*://www.youtube.com/**', '*://player.vimeo.com/video/**']);

})

.filter('object2Array', function() {
  return function(input) {
    const out = [];
    for(const i in input){
      if (input.hasOwnProperty(i))
        out.push(input[i]);
    }
    return out;
  }
})


.run(function($ionicPlatform, $rootScope, $state, $ionicHistory, gettextCatalog, profileFiller, $ionicPopup, $http) {
  $rootScope.production = PRODUCTION;
  // Error monitoring
  Pro.init(envConfig.proID, {
    appVersion: appConfig.version
  });

  // Localization
  const language = navigator.language;
  const lang = language.substr(0,2);
  log('language', language, lang);
  gettextCatalog.setCurrentLanguage(lang);
  gettextCatalog.debug = !PRODUCTION;


  // referrer get from URL
  log('window.location.href', window.location.href);
  const referrer = tools.getQueryParam('referrer',window.location.href);
  log('referrer',referrer);
  if (!getCookie('referrer') && referrer) {
    setCookie('referrer', referrer, 365);
  }

  $rootScope.profile = {};
  $rootScope.account = {};
  $rootScope.private = { favorites:[] };
  $rootScope.accessToken = null;
  $rootScope.app = {
    version: appConfig.version
  };

  $rootScope.userProfileUnsubscribe  = null;
  $rootScope.userAccountUnsubscribe  = null;
  $rootScope.userMessagesUnsubscribe = null;
  $rootScope.userPrivateUnsubscribe  = null;

  // $rootScope.callLogFilter

  // Global refresh topup balance function
  $rootScope.refreshTopupBalance = function() {
    if ($rootScope.account.topupAddress) {
      // TODO Subscribe / refresh
      $rootScope.account.topupBalanceNum = null;
      $rootScope.account.topupBalanceStr = null;

      const address = $rootScope.account.topupAddress;
      log('Account balance address 0x', address);
      web3.eth.getBalance(address, (error, balanceWei) => {
        if (!error) {
          $rootScope.$apply(function () {
            const topupBalanceBN = web3.fromWei(balanceWei, 'ether');
            $rootScope.account.topupBalanceNum = topupBalanceBN.toNumber();
            $rootScope.account.topupBalanceStr = topupBalanceBN.toFixed(4);
            log('topupBalanceStr', $rootScope.account.topupBalanceStr);
          });
        } else warn('web3.eth.getBalance error', error);
      });
    }
  };


  // override Back hard button handler (minimize instead of close)
  $ionicPlatform.registerBackButtonAction(function (event) {
    log('Back button pressed');
    event.preventDefault();
    if ($ionicHistory.backView()) {
      $ionicHistory.goBack();
    } else {
      // window.plugins.appMinimize.minimize();
      cordova.plugins.backgroundMode.moveToBackground();
    }
  }, 100);


  ionic.Platform.ready(()=>{
    if (typeof(BuildInfo) !== 'undefined') log('BuildInfo', BuildInfo);
    // Show version data in development build
    const devVersionElem = window.document.getElementById('dev-version');
    devVersionElem.style.display = PRODUCTION ? 'none' : 'block';

    function getFirstDomain(str) {
      return str.substring(
        str.indexOf("//") + 2,
        str.indexOf(".")
      );
    }
    devVersionElem.innerText = appConfig.version + ' '+
      getFirstDomain(envConfig.web3HttpProvider) + ' '+
      envConfig.firebaseConfig.projectId;

    // Exception tracking in compiled apps
    if((typeof cordova !== 'undefined')) {
      Sentry.init({
        release: appConfig.name+'@'+appConfig.version,
        dsn: envConfig.sentryDSN
      });
    }
    // Analytics
    $rootScope.$on('$ionicView.enter', function(){
      const details = window.location;
      log('Entered to view:', $state.current.name, details, $state);
      ha.setCurrentScreen($state.current.name);
      ha.logEvent('View',{category: $state.current.name, label:details});
    });

    log( 'ionic.Platform.device()',ionic.Platform.device());
    log( 'ionic.Platform.platform()',ionic.Platform.platform());
    log( 'ionic.Platform.version()',ionic.Platform.version());
    log( 'typeof cordova:',typeof cordova);

    // Android permissions
    if ((typeof cordova !== 'undefined') && ionic.Platform.isAndroid()) {
      const permissions = cordova.plugins['permissions'];
      const list = [
        permissions.CAMERA,
        permissions.RECORD_AUDIO
      ];
      permissions.checkPermission(list, callback, warn('checkPermission error'));

      function callback( status ) {
        log('check permission status', status);
        if( !status.hasPermission ) {
          permissions.requestPermissions(
            list,
            function(status) {
              log('request permission status', status);
              if( !status.hasPermission ) warn('permission not granted');
            },
            warn('requestPermissions error'));
        }
      }
    }


    // Lock Screen orientation
    log('window.screen.orientation', window.screen['orientation'] );
    if (window.screen['orientation']['lock']) {
      window.screen['orientation'].lock('portrait').catch(function(e){
        warn('Lock screen error', e);
      });
    }


    // Open profile links in app
    // (Intent handlers)
    const intentHandler = function (intent, instantRedirect) {
      if (intent) {
        log('Intent', intent);

        // Handle open URLs
        if (intent.data && (intent.data.substr(0,4)==='http')) {
          const url = new URL(intent.data);
          log('URL', url);
          const starId = '@'+url.pathname.substr(1); // remove slash / from pathname

          log('$state.current.name',$state.current.name);
          if ((instantRedirect && $rootScope.user) || ($state.current.name==='stars')) {
            $state.go('star', {uid:starId});
          } else {

            $rootScope.$apply( ()=>{
              $rootScope.redirect = { // will be redirected in starsCtrl
                state:'star',
                params:{uid:starId}
              };
              log('App set $rootScope.redirect',$rootScope.redirect);
            });
          }
          // to do support other links (not stars only)
        }

        // Handle auto start
        if (intent && intent.extras && intent.extras.cordova_autostart) {
          log('App launched at phone boot. Hiding...');
          cordova.plugins.backgroundMode.moveToBackground();
        }
      }
    };

    // https://github.com/napolitano/cordova-plugin-intent DEPRECATED
    if (window.plugins && window.plugins.intent) {
      log('Enable napolitano/cordova-plugin-intent');
      //To get the intent and extras when the app it's open for the first time
      window.plugins.intent.getCordovaIntent(function (intent) {
        log('getCordovaIntent', intent);
        intentHandler(intent, false); // delayed redirect (in stars view)
      });

      //To get the intent and extras if the app is running in the background
      window.plugins.intent.setNewIntentHandler(function (intent) {
        log('setNewIntentHandler', intent);
        intentHandler(intent, true); // instant redirect
      });
    }

    // https://www.npmjs.com/package/com-darryncampbell-cordova-plugin-intent
    if (window.plugins && window.plugins.intentShim) {
      log('Enable com-darryncampbell-cordova-plugin-intent');
      window.plugins.intentShim.registerBroadcastReceiver({
          filterActions: [
            'android.intent.action.VIEW'
          ]
        },
        function (intent) {
          log('Received broadcast intent: ', intent.extras);
          intentHandler(intent, true); // instant redirect
        }
      );

      window.plugins.intentShim.onIntent(function (intent) {
        log('Received Intent: ',  intent.extras);
        intentHandler(intent, false); // instant redirect
      });
    }

    // Enable background mode
    if((typeof cordova !== 'undefined')  && cordova['plugins'] && cordova['plugins']['backgroundMode']) {
      log('Enable background mode');
      cordova.plugins.backgroundMode.setDefaults({
        title: ' ',
        text: gettextCatalog.getString('Waiting for an incoming call'),
        icon: 'icon',
        // color: String // hex format like 'F14F4D'
        resume: true,
        hidden: true,
        // bigText: true
      });
      cordova.plugins.backgroundMode.on('activate', function() {
        log('!!! backgroundMode disableWebViewOptimizations');
        cordova.plugins.backgroundMode.disableWebViewOptimizations();
      });
      cordova.plugins.backgroundMode.enable();
    }

    // Internet connection changed
    if (navigator.connection) {
      log('navigator.connection', navigator.connection);

      function updateConnectionStatus() {
        console.log('Internet connection changed');
        // console.log(navigator.connection);
      }
      navigator.connection.onchange=updateConnectionStatus;
    }
    // Internet connection status
    let noInternetPopup;
    document.addEventListener("offline", function(e){
      noInternetPopup = $ionicPopup.show({
        title: gettextCatalog.getString('Internet Connection Lost'),
        cssClass: 'custom-popup',
        template: '<div class="icon ion-heart-broken" style="font-size: 128px; color:lightgrey; text-align: center"></div><br/><p style="text-align: center">'+
          gettextCatalog.getString('This message will disappear when the connection is restored.')+'</p>'
      });
    }, false);

    document.addEventListener("online", function(e){
      if (noInternetPopup) noInternetPopup.close();
    }, false);


    // Native ring tones
    // TODO install plugin https://www.npmjs.com/package/cordova-plugin-native-ringtones
    // TODO for now troubles with install https://github.com/apache/cordova-plugin-media
    $rootScope.nativeRingtones = [];
    if((typeof cordova !== 'undefined')  && cordova['plugins'] && cordova['plugins']['NativeRingtones']) {
      log('Native Ringtones Available');
      cordova.plugins.NativeRingtones.getRingtone(function (ringtones) {
          $rootScope.nativeRingtones = ringtones;
          log('Native Ringtones', ringtones);
        },
        function (err) {
          warn(err);
        });
    }

  }); // ionic.Platform.ready


  // Firebase user Auth
  $rootScope.user = {
    uid: null
  };
  firebase.auth().onAuthStateChanged(function(user) {
    log('onAuthStateChanged user', user?'TRUE':'FALSE');
    $rootScope.user = user;

    if (user) {      // User is signed in.

      ha.setUserId(user.uid);

      // Auto Start on phone boot (if user signed in)
      // https://github.com/ToniKorin/cordova-plugin-autostart
      if((typeof cordova !== 'undefined') &&  cordova['plugins'] && cordova['plugins']['autoStart']) {
        log('Enabling auto start...');
        cordova.plugins.autoStart.enable();
      }

      // Set auth persistence
      firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(function () { log('Persistence was set to LOCAL');  });

      // Get Phone number
      if ((typeof cordova !== 'undefined') && cordova['plugins'] && cordova['plugins']['phonenumber']) {
        window.plugins['phonenumber'].get(function success(phoneNumber) {
          console.log("Phone number: " + phoneNumber);
          $rootScope.userPhoneNumber = phoneNumber;
        }, log('Can not get phone number'));
      }


      // == Presence system ==
      firebase.database().goOnline();
      const uid = firebase.auth().currentUser.uid;
      // Create a reference to this user's specific status node.
      // This is where we will store data about being online/offline.
      const userStatusDatabaseRef = firebase.database().ref('/status/' + uid);
      const isOfflineForDatabase = {
        online: false,
        last_changed: firebase.database.ServerValue.TIMESTAMP,
      };
      const isOnlineForDatabase = {
        online: true,
        last_changed: firebase.database.ServerValue.TIMESTAMP,
      };

      firebase.database().ref('.info/connected').on('value', function(snapshot) {
        if (!snapshot.val()) { // disconnected
           return;
        }
        console.log('.info/connected', snapshot.val());
        // userStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase).then(function() {
        //   userStatusDatabaseRef.set(isOnlineForDatabase);
        // });
        userStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase);
        userStatusDatabaseRef.set(isOnlineForDatabase);
      });
      // == end presence system ==

      api.userProfileRef = api.profilesRef.doc(user.uid);
      api.userAccountRef = api.accountsRef.doc(user.uid);
      api.userPrivateRef = api.privatesRef.doc(user.uid);

      // auto Update $rootScope variables
      // user Profile
      $rootScope.profile = {
        displayName : null,
        displayNameLC : null,
        featured : null,
        nick: null,
        nickLowerCase : null,
        online : true,
        onlineLastChanged : null,
        priceCall : null,
        status : null,
        uid : null
      };


      $rootScope.userProfileUnsubscribe = api.userProfileRef
        .onSnapshot(function(profile) {
          if (profile) {
            $rootScope.$apply(function () {
              const profileData = profile.data();
              $rootScope.profile =  profileFiller.fill(profileData);

              if((typeof cordova !== 'undefined') && cordova['plugins'] && cordova['plugins']['backgroundMode']) {
                cordova.plugins.backgroundMode.setDefaults({
                  title: profileData.displayName ? profileData.displayName : ''
                });
              }
            });

            log(Date.now(),'Current profile data: ', $rootScope.profile);
          } else { // Open Edit profile view if no profile
            if ($state.current.name!=='editProfile') $state.go('editProfile');
          }
        }, err);

      // User Account
      $rootScope.account = {
        balance : null,
        revenues : null,
        affiliate : null
      };
      $rootScope.userAccountUnsubscribe = api.userAccountRef
        .onSnapshot(function(account) {
          if (account.exists) {
            const accountData = account.data();
            // set user affiliate referrer if it is not set
            if (!('affiliate' in accountData)) {
              log('No affiliate set');
              const referrer = getCookie('referrer');
              log('cookie referrer', referrer);
              api.setAffiliate({'affiliate': referrer})
                .then(() => {
                  eraseCookie('referrer');
                  log('Affiliate was successfully set');
                })
                .catch((error) => {
                  err(error);
                  warn('Error setting affiliate', error);
                });
            } else log('Affiliate', accountData['affiliate']);

            // Account Data
            $rootScope.$apply(function () {
              accountData.topupAddress  = '0x'+accountData.balanceEnc.address;
              $rootScope.account = accountData;

            });
            log("Current account data: ", accountData);

            // ETH balance
            // if (accountData.topupAddress) {
            //   // TODO Subscribe / refresh
            //   const address = accountData.balanceEnc.address;
            //   log('Account balance address 0x', accountData.balanceEnc.address);
            //   web3.eth.getBalance(address, (error, balanceWei) => {
            //     if (!error) {
            //       $rootScope.$apply(function () {
            //         log('balanceWei', balanceWei);
            //         const balance = web3.fromWei(balanceWei, 'ether').toFixed();
            //         log('balance', balance);
            //         // $rootScope.account.topupBalance = balance;
            //       });
            //     } else warn('web3.eth.getBalance error', error);
            //   });
            //
            // }


          }
        }, err);

      // User Private Data
      $rootScope.userPrivateUnsubscribe = api.userPrivateRef
        .onSnapshot(function(privateProfile) {
          if (privateProfile.exists) {
            $rootScope.$apply(function () {
              $rootScope.private = privateProfile.data();
            });
            // log("Current private data: ", privateProfile.data());
          } else {

          }
        }, err);

      // user.getIdToken().then(function(accessToken) {
      //   $rootScope.accessToken = accessToken;
      //   // log('accessToken',accessToken);
      // });

      // === Incoming calls ===
      $rootScope.busy = null;
      $rootScope.userMessagesUnsubscribe = api.messagesRef
        .where('to',        '==', user.uid)
        .where('call',      '==', true)
        .where('finished',  '==', false)
        .where('delivered', '==', false).limit(1)
        .onSnapshot(function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
            if (!$rootScope.busy) {
              $rootScope.busy = true;
              log('IncomingCall', doc.id, doc.data());
              api.callDelivered({callId:doc.id});
              log('$state', $state);
              if (!($state.params.callId && $state.params.callId===doc.id)) {
                $ionicHistory.nextViewOptions({ disableAnimate: true });
                $state.go('incomingCall', {callId: doc.id});
              } else {
                log('We already on this call view');
              }
            } else { // if at busy already
              log('Busy. Incoming call cancelled', doc.id, doc.data());
              api.finishCall({callId:doc.id, busy:true});
              //TODO show missed call notification
            }
          });
        }, err);
      // === Messages ===
      $rootScope.newMessages = {};
      /*
      $rootScope.userTextMessagesUnsubscribe = db.collection("messages")
        .where('to', '==', user.uid).where('viewed','==',false).where('call','==',false)
        .onSnapshot(function(querySnapshot) {
          const newMessages = {};
          const newMessagesArray = [];
          querySnapshot.forEach(function(doc) {
            const msg = doc.data();
            if (!newMessages[msg.from]) newMessages[msg.from] = [];
            newMessages[msg.from].push(msg);
            newMessagesArray.push(msg);

          });
          $rootScope.$apply(function(){
            $rootScope.newMessages =newMessages;
          });
          if (appconfig.showNotifications && newMessagesArray.length>0) { // if any new messages
            Notification.requestPermission().then(function(permission) {
              if( permission != "granted" ) return false;
              const notify = new Notification('Stars Expert',{
                tag: 'stars.expert',
                body: newMessagesArray.length+' new '+(newMessagesArray.length>1?'messages':'message'),
                icon: 'img/icon192.png'
              });
              notify.onclick = function(){
                //TODO set chat uid (open chat with message sender)
                $state.go(Object.keys(newMessages).length==1?'chat':'stars');
              }
            });
          }
          log("New messages: ", newMessages);
        }, err);
        */
    } else { // user not logged in

      // Disable background mode
      if((typeof cordova !== 'undefined') && cordova['plugins'] && cordova['plugins']['backgroundMode']) {
        log('Disable background mode');
        cordova.plugins.backgroundMode.disable();
      }

      // Disable Auto Start on phone boot (if user not signed in)
      if((typeof cordova !== 'undefined') && cordova['plugins'] && cordova['plugins']['autoStart']) {
        log('Disabling auto start...');
        cordova.plugins.autoStart.disable();
      }
    }
  }, function(error) {
    warn('Firebase onAuthStateChanged',error);
  });

  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window['StatusBar']) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

  });

  // Get Exchange rate
  $rootScope.exchangeRate = null;
  function updateExchangeRate() {
    $http.get('https://api.coinmarketcap.com/v1/ticker/ethereum/').then(function (response) {
      // log('updateExchangeRate response', response);
      if (response.status === 200) {
        $rootScope.exchangeRate = response.data[0].price_usd;
        log('updateExchangeRate $rootScope.exchangeRate', $rootScope.exchangeRate);
      }
    });
  }

  updateExchangeRate();
  setInterval( updateExchangeRate, 1000*60*60*12 ); // update every 12 hours


})
.config(function($ionicConfigProvider) {
    // Remove back button text completely
    $ionicConfigProvider.backButton.previousTitleText(false).text('');
})

/*
  This directive is used to disable the "drag to open" functionality of the Side-Menu
  when you are dragging a Slider component.
*/
.directive('disableSideMenuDrag', ['$ionicSideMenuDelegate', '$rootScope', function($ionicSideMenuDelegate, $rootScope) {
    return {
        restrict: "A",
         // controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
        controller: ['$scope', '$element', function ($scope, $element) {

            function stopDrag(){
              $ionicSideMenuDelegate.canDragContent(false);
            }

            function allowDrag(){
              $ionicSideMenuDelegate.canDragContent(true);
            }

            $rootScope.$on('$ionicSlides.slideChangeEnd', allowDrag);
            $element.on('touchstart', stopDrag);
            $element.on('touchend', allowDrag);
            $element.on('mousedown', stopDrag);
            $element.on('mouseup', allowDrag);

        }]
    };
}])

/*
  This directive is used to open regular and dynamic href links inside of inappbrowser.
*/
.directive('hrefInappbrowser', function() {
  return {
    restrict: 'A',
    replace: false,
    transclude: false,
    link: function(scope, element, attrs) {
      let href = attrs['hrefInappbrowser'];

      attrs.$observe('hrefInappbrowser', function(val){
        href = val;
      });

      element.bind('click', function (event) {

        window.open(href, '_system', 'location=yes');

        event.preventDefault();
        event.stopPropagation();

      });
    }
  };
});
