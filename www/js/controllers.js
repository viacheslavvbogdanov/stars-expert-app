

angular.module('app.controllers', [])

.controller('starsCtrl', ['$scope', '$state', '$stateParams', '$rootScope', '$ionicHistory',
  'alerts', 'toast', 'social', 'profileFiller',
function ($scope, $state, $stateParams, $rootScope, $ionicHistory, alerts, toast, social, profileFiller) {
  $ionicHistory.clearHistory(); // This view should be root

  if (navigator['splashscreen']) {
    setTimeout(()=>{
      navigator.splashscreen.hide();
    }, 1000);
  }

  // check login
  setTimeout( ()=>{
    if (!$rootScope.profile.uid) $state.go('login');
  }, 10000 );

  $scope.hideShareYourProfileHint = (window.plugins && window.plugins.socialsharing) ? false : true;
  if (!$scope.hideShareYourProfileHint)
    getLocalStorage($scope, 'hideShareYourProfileHint', $rootScope.user.uid);

  // Share profile
  $scope.shareProfile = function() {
    const message = $rootScope.profile.displayName+' @ Stars Messenger';
    social.share(message, $rootScope.profile.link, message, function() {
      // hide hint on successful share
      $scope.$apply( ()=> {
        setLocalStorage($scope, 'hideShareYourProfileHint', true, $rootScope.user.uid);
      });
    });
  };

  $scope.searchBar = {
    show                  : false,
    searchText            : '',
    searching             : false,
    notFound              : false,
    notFoundByNick        : false,
    notFoundNyName        : false,
    lastSearchText        : '',
    searchTextFavorites   : '',
    searchTextLastDialed  : '',
    searchTextLastIncoming: '',
    searchTextFeatured    : '',
    searchTextAll         : ''
  };


  $scope.showSearchBar = function(show) {
    if (typeof(show) !== 'undefined')
      $scope.searchBar.show = show;
    else
      $scope.searchBar.show = !$scope.searchBar.show;
  };

  $scope.showHideSearchBar = function() {
    if ($scope.searchBar.show) {
      $scope.searchBar.show = false;
      $scope.searchBar.lastSearchText = $scope.searchBar.searchText;
      $scope.searchBar.searchText = '';

    } else {
      $scope.searchBar.searchText = $scope.searchBar.lastSearchText;
      $scope.searchBar.show = true;
    }
  };

  $scope.clearSearchBar = function() {
    $scope.searchBar.searchText = '';
    $scope.searchBar.lastSearchText = '';
    $scope.showSearchBar(false);
  };

  // Get favorite stars
  $scope.favoriteStars = {};
  $rootScope.$watch('private.favorites', (favorites)=>{
    log('watch favorites', favorites);
    if (favorites) {
      $scope.favoriteStars = {};
      favorites.map(function(favorite) {
        // log('favorite', favorite);
        const favDoc = api.profilesRef.doc(favorite);
        // TODO do not watch for snapshot if it already watched
        favDoc.onSnapshot(function(profile) {
          if (profile.exists) {
            $scope.$apply(function () {
              const profileData = profileFiller.fill(profile.data());
              log('favorite star updated', profileData);
              $scope.favoriteStars[profile.id] = profileData;
            });
          }
        }, err);
      });
    }
  }, true);

  // Get last dialed
  $scope.haveLastDialedStars = false;
  $scope.lastDialedStars = {};
  $rootScope.lastDialedUnsubscribe = null;
  $rootScope.$watch('profile.uid', (uid)=>{
    // log('lastDialedStars User uid', uid);
    if (uid){
      $rootScope.lastDialedUnsubscribe = api.messagesRef
        .where('from','==',uid)
        .orderBy('created','desc')
        .limit(24)
        .onSnapshot(function(calls){
        // log('Last calls', calls);
        let callsCreated = {};
        // group calls by to uid
        calls.forEach(function(call){
          const callData = call.data();
          const oldCreated = callsCreated[callData.to];
          const newCreated = callData.created ? callData.created.toDate() : null;
          callsCreated[callData.to] = (oldCreated>newCreated) ? oldCreated : newCreated;
        });
        // log('Last calls aggregated', callsCreated);
        const callsArray = [];
        for(const i in callsCreated){
          if (callsCreated.hasOwnProperty(i))
            callsArray.push({to:i, created:callsCreated[i]});
        }
        // log('Last calls array ', callsArray);
        // fetch stars' data
        // $scope.$apply(function () {
          $scope.lastDialedStars = {};
        // });
        callsArray.forEach(function(call,index) {
          // log( index, call);
          api.profilesRef.doc(call.to).onSnapshot(function (profile) {
            if (profile.exists) {
              const profileData = profileFiller.fill(profile.data());
              const c = callsArray[index].created;
              profileData.created = c;
              profileData.lastCallDateTimeStr =
                c.toLocaleDateString([], {month: "numeric", day: "numeric"}) + ' ' +
                c.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
              $scope.$apply(function () {
                $scope.lastDialedStars[profileData.uid] = profileData;
                $scope.haveLastDialedStars = true;
              });
            }
          });
        });

      }, err);
    }
  });

  // Get last incoming calls
  $scope.haveLastIncomingCalls = false;
  $scope.lastIncomingCalls = {};
  $rootScope.lastIncomingUnsubscribe = null;
  $rootScope.$watch('profile.uid', (uid)=>{
    // log('lastIncomingCalls User uid', uid);
    if (uid){
      $rootScope.lastIncomingUnsubscribe = api.messagesRef
        .where('to','==',uid)
        .orderBy('created','desc')
        .limit(24)
        .onSnapshot(function(calls){
        // TODO refactor - use same function for last dialed / last incoming calls
        // log('Last incoming calls', calls);
        let callsCreated = {};
        // group calls by 'from' uid
        calls.forEach(function(call){
          const callData = call.data();
          const oldCreated = callsCreated[callData.from];
          const newCreated = callData.created ? callData.created.toDate() : null;
          callsCreated[callData.from] = (oldCreated>newCreated) ? oldCreated : newCreated;
        });
        // log('Last calls aggregated', callsCreated);
        const callsArray = [];
        for(const i in callsCreated){
          if (callsCreated.hasOwnProperty(i))
            callsArray.push({to:i, created:callsCreated[i]});
        }
        // log('Last calls array ', callsArray);
        // fetch stars' data
        // $scope.$apply(function () {
        $scope.lastIncomingCalls = {};
        // });
        callsArray.forEach(function(call,index) {
          // log( index, call);
          api.profilesRef.doc(call.to).onSnapshot(function (profile) {
            if (profile.exists) {
              const profileData = profileFiller.fill(profile.data());
              const c = callsArray[index].created;
              profileData.created = c;
              profileData.lastCallDateTimeStr =
                c.toLocaleDateString([], {month: "numeric", day: "numeric"}) + ' ' +
                c.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
              $scope.$apply(function () {
                $scope.lastIncomingCalls[profileData.uid] = profileData;
                $scope.haveLastIncomingCalls = true;
              });
            }
          });
        });

      }, err);
    }
  });


  // Get featured stars
  log('languages', navigator.languages);

  const language = navigator.language; //|| navigator.userLanguage;
  log('language', language);

  // Get featured stars
  $scope.featuredStars = {};
  $rootScope.featuredUnsubscribe = api.profilesRef
    .where('featured.till', '>', firebase.firestore.Timestamp.now())
    .where('featured.languages', 'array-contains', language)
    .onSnapshot(function(profiles) {
      profiles.forEach(function(profile) {
        // log('profile',profile);
        $scope.$apply(function(){
          const profileData = profileFiller.fill(profile.data());
          $scope.featuredStars[profile.id] = profileData;
        });
      });
  }, err);

  $scope.getListedAtFeatured = function() {
    alerts.info('Get Listed at Featured',
      'Please send your request email to info@stars.expert Thank you!'
    );
  };


  // Get found stars
  $scope.foundStars = {};
  $scope.$watch('searchBar.searchText', ()=>{
    function getSearchText() {
      return $scope.searchBar.searchText.trim().toLowerCase();
    }
    const searchText = getSearchText();
    // log('searchText', searchText);
    $scope.foundStars = {};

    if (!searchText) {
      $scope.searchBar.searching = false;
      $scope.searchBar.notFound  = false;
      return;
    }

    $scope.searchBar.searching = true;
    $scope.searchBar.notFound  = false;

    function getFoundProfiles(profiles) {
      if (searchText!==getSearchText()) return; // Check user still looking for that star

      if (!profiles.exists) {
        $scope.$apply(function() {
          $scope.searchBar.searching = false;
          $scope.searchBar.notFound  = true;
        });
      }
      profiles.forEach(function(profile) {
        $scope.$apply(function(){
          $scope.searchBar.searching = false;
          $scope.searchBar.notFound  = false;
          const profileData = profileFiller.fill(profile.data());
          log('found profile',profileData);
          const len = searchText.length;

          if (profileData.nickLowerCase.substr(0,len)===searchText) {
            profileData.nickFoundPart = profileData.nick.substr(0, len);
            profileData.nickOtherPart = profileData.nick.substr(len);
          } else
            profileData.nickOtherPart = profileData.nick;

          if (profileData.displayNameLC.substr(0,len)===searchText) {
            profileData.nameFoundPart = profileData.displayName.substr(0, len);
            profileData.nameOtherPart = profileData.displayName.substr(len);
          } else
            profileData.nameOtherPart = profileData.displayName;

          $scope.foundStars[profile.id] = profileData;
        });
      });
    }

    api.profilesRef
      .orderBy('nickLowerCase')
      .limit(12)
      .startAt(searchText)
      .endAt(searchText+'\uf8ff')
      .get()
      .then(getFoundProfiles)
      .catch(function(error){
        err(error);
        $scope.$apply(function() {
          $scope.searchBar.searching = false;
        });
      });

    api.profilesRef
      .orderBy('displayNameLC')
      .limit(12)
      .startAt(searchText)
      .endAt(searchText+'\uf8ff')
      .get()
      .then(getFoundProfiles)
      .catch(function(error){
        err(error);
        $scope.$apply(function() {
          $scope.searchBar.searching = false;
        });
      });
  });

  // Get all stars
  // $scope.stars = {};
  // api.profilesRef.onSnapshot(function(profiles) {
  //   profiles.forEach(function(profile) {
  //     // log('profile',profile);
  //     $scope.$apply(function(){
  //       const profileData = profileFiller.fill(profile.data());
  //       $scope.stars[profile.id] = profileData;
  //     });
  //   });
  // });

  // Redirect when r param in url (for browsers) see 404.html
  const redirect = getCookie('redirect');
  if (redirect) {
    eraseCookie('redirect');
    $state.go('star', {uid:'@'+redirect.substr(1)});
  }

  log('Stars $rootScope.redirect',$rootScope.redirect);
  if ($rootScope['redirect']) { // if have redirect (to profile, passed from intent)
    log('$rootScope.redirect',$rootScope.redirect);
    $state.go($rootScope.redirect.state, $rootScope.redirect.params);
    $rootScope.redirect = null;
  }
}])

.controller('callLogCtrl', ['$scope', '$stateParams',
function ($scope, $stateParams) {

}])

.controller('myCtrl', ['$scope', '$stateParams', '$state', '$rootScope','alerts',
  '$ionicHistory', '$ionicActionSheet', 'toast', 'social', 'apiUI', 'gettextCatalog',

function ($scope, $stateParams, $state, $rootScope, alerts, $ionicHistory,
          $ionicActionSheet, toast, social, apiUI, gettextCatalog) {

  $rootScope.hideTapForMoreHint = false;
  getLocalStorage($rootScope, 'hideTapForMoreHint');

  $scope.editProfile = function() {
    $state.go('editProfile');
  };

  $scope.copyMyProfileLinkToClipboard = function() {
    tools.copyTextFromInput('myProfileLinkInput');

    toast.show(gettextCatalog.getString('Profile link copied to clipboard'));
  };

  $scope.shareProfileLink = function() {
    if (!social.share('Call me on Stars Messenger', $rootScope.profile.link, $rootScope.profile.displayName + ' @ Stars Messenger ')) {
      $scope.copyMyProfileLinkToClipboard();
    }
  };

  $scope.logOut = function() {
    alerts.ask('Log Out', 'Do you really want to exit from your account?', 'Log out', ()=>{
      if ($rootScope.userProfileUnsubscribe)  $rootScope.userProfileUnsubscribe();
      if ($rootScope.userAccountUnsubscribe)  $rootScope.userAccountUnsubscribe();
      if ($rootScope.userMessagesUnsubscribe) $rootScope.userMessagesUnsubscribe();
      if ($rootScope.userPrivateUnsubscribe)  $rootScope.userPrivateUnsubscribe();
      if ($rootScope.lastDialedUnsubscribe)   $rootScope.lastDialedUnsubscribe();
      if ($rootScope.lastIncomingUnsubscribe) $rootScope.lastIncomingUnsubscribe();
      if ($rootScope.featuredUnsubscribe)     $rootScope.featuredUnsubscribe();

      $rootScope.userProfileUnsubscribe  = null;
      $rootScope.userAccountUnsubscribe  = null;
      $rootScope.userMessagesUnsubscribe = null;
      $rootScope.userPrivateUnsubscribe  = null;
      $rootScope.lastDialedUnsubscribe   = null;
      $rootScope.lastIncomingUnsubscribe = null;
      $rootScope.featuredUnsubscribe     = null;

      $rootScope.profile = null;
      $ionicHistory.clearCache().then(function () {
        $ionicHistory.clearHistory();
      });
      firebase.database().goOffline();
      // $ionicHistory.nextViewOptions({
      //   historyRoot: true,
      //   disableBack: true,
      // });
      firebase.auth().signOut()
        .then(function() {
          // Sign-out successful.
          $state.go('login');
        })
        .catch(function(error) {
          // An error happened. Anyway go to login view
          warn('signOut error', error);
          $state.go('login');
        });
    })
  };


  $scope.topUpBalance = function() {
    apiUI.topup()
  };

  $scope.topUpFromRevenues = function() {
    if ($rootScope.account['revenues']===0) {
      alerts.error('You have no revenues yet');
    } else {
      $rootScope.topup = {amount: Math.floor($rootScope.account['revenues']*10000)/10000};
      alerts.input('Transfer Revenues to Balance', 'Enter amount', 'Transfer',
        '<input type="number" ng-model="topup.amount">',
        () => {
          api.topUpFromRevenues({amount:$rootScope.topup.amount})
            .then(()=>{
              alerts.info('Transfer Successful', `$${$rootScope.topup.amount} transferred from revenues to your balance`);
             })
            .catch((error)=>{
              alerts.info('Transfer Error', error.message);
            })
        });
    }
  };

  $scope.withdrawRevenues = function() {
    if ($rootScope.account['revenues']===0) {
      alerts.error('You have no revenues yet');
    } else {
      $rootScope.withdraw = {
        amount: Math.floor($rootScope.account['revenues']*10000)/10000, //TODO minus txFee
        toAddress: $rootScope.account.lastWithdrawalAddress,
      };
      alerts.input('Withdraw Revenues', null, 'Withdraw',
        `
<label class="item item-input" style="padding: 0;">
        <span class="input-label" translate>Amount to withdraw ETH*</span>
        <input ng-model="withdraw.amount" type="number">
</label>

<label class="item item-input item-stacked-label" style="padding: 0;">
        <span class="input-label" translate>To address</span>
        <input id="toAddress" style="font-size:12px;text-align:center" 
        ng-model="withdraw.toAddress" type="text" placeholder="0x...">
</label>
<div class="center-horizontally">
<a class="button button-small button-block button-balanced" ng-click="pasteToAddress()" translate>paste</a>
</div>
<div class="center-horizontally padding-top" style="font-size: 10px">

*Ethereum transaction fee will be deducted</div>
<a class="button button-small button-block button-dark padding-right" onclick="window.open('https://localethereum.com/r/vbogdanov', '_system', 'location=yes'); return false;" translate>Sell ETH online</a>

`,
        () => {
          //todo check address and values
          //todo store and show last address in input
          api.withdraw({amount:$rootScope.withdraw.amount, toAddress:$rootScope.withdraw.toAddress})
            .then(()=>{
              alerts.info('Withdrawal Requested', `${$rootScope.withdraw.amount}ETH will be paid out within 5-10 minutes.`);
            })
            .catch((error)=>{
              alerts.info('Withdrawal Error', error.message);
            })
        });
    }
  };

  // function to paste from clipboard into input text toAddress
  $rootScope.pasteToAddress = function() {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(
        clipText =>  $rootScope.$apply( ()=>{ $rootScope.withdraw.toAddress = clipText })
      );
    }
  };



  $scope.about = function() {
    $state.go('about');
  };



  $scope.showActionSheet = function() {

    setLocalStorage($rootScope, 'hideTapForMoreHint', true);

    const buttons = [
      { text: '<i class="icon ion-edit"></i> '+gettextCatalog.getString('Edit profile'),          f: $scope.editProfile },
      { text: '<i class="icon ion-share"></i> '+gettextCatalog.getString('Share link to profile'),f: $scope.shareProfileLink },
      { text: '<i class="icon ion-card"></i> '+gettextCatalog.getString('Top up balance'),        f: $scope.topUpBalance },
      { text: '<i class="icon ion-arrow-return-left"></i> '+gettextCatalog.getString('Transfer revenues to balance'),
                                                                     f: $scope.topUpFromRevenues },
      { text: '<i class="icon ion-cash"></i> '+gettextCatalog.getString('Withdraw revenues'),     f: $scope.withdrawRevenues },
      { text: '<i class="icon ion-log-out"></i> '+gettextCatalog.getString('Log out'),            f: $scope.logOut },
      { text: '<i class="icon ion-information-circled"></i> '+gettextCatalog.getString('About'),  f: $scope.about },
    ];

    $ionicActionSheet.show({
      // titleText: null,
      cssClass : 'popup-menu',
      buttons: buttons,
      // destructiveText: 'Delete',
      // cancelText: 'Cancel',
      cancel: function() {
      },
      buttonClicked: function(index) {
        const button = buttons[index];
        if ('f' in button) {
          const action = button.f;
          if (action) action();
          return true;
        } else
          return false;
      },
      destructiveButtonClicked: function() {
        console.log('DESTRUCT');
        return true;
      }
    });
  };
}])

.controller('settingsCtrl', ['$scope', '$stateParams',
function ($scope, $stateParams) {


}])

.controller('aboutCtrl', ['$scope', '$stateParams',
function ($scope, $stateParams) {
  // jitsi.info();
  $scope.imageClick = function() {
    err(new Error('Test err'));
    const a = 1/0;
    throw new Error('Test error'+a);
  }

}])

.controller('avatarCtrl', ['$scope', '$state', '$stateParams', '$rootScope', '$ionicHistory', 'alerts',
function ($scope, $state, $stateParams, $rootScope, $ionicHistory, alerts) {

  $scope.continue = false; // used for first-time wizard mode
  $scope.uploading = false;

  // const uploader = document.getElementById('newAvatarUploader');
  const fileButton = document.getElementById('newAvatarFile');
  fileButton.addEventListener('change', function(e) {
    const file = e.target.files[0];
    console.log('file', file);
    if (file.size>=5*1024*1024) {
      alerts.error('Image too Big. Maximum file size 5 Mb');
      return false;
    }

    const storageRef = avatarsRef.child($rootScope.user.uid).child(file.name);
    const task = storageRef.put(file);

    $scope.$apply(()=>{ $scope.uploading = true; });

    task.on('state_changed', function progress(snapshot) {
      $scope.$apply(()=>{
        $scope.uploading = true;
      });
      const percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      // uploader.value = percentage;
      log('percentage',percentage);

    }, function error(error) {
      log('upload error', error);
      alerts.error(error.message);
      $scope.$apply(()=>{ $scope.uploading = false; });

    }, function complete() {
      log('upload complete');

      task.snapshot.ref.getDownloadURL().then(function(downloadURL) {
        console.log('File available at', downloadURL);
        $scope.$apply(()=>{ $rootScope.profile.photoURL = null; });
        $scope.$apply(()=>{ $rootScope.profile.photoURL = downloadURL; });
        api.updateProfile({'photoURL':downloadURL})
          .then(()=> {
            $scope.$apply(()=>{ $scope.uploading = false; });
            $ionicHistory.clearCache(); // clear views with old avatar (stars for example)
            const backView = $ionicHistory.backView();
            if (backView && backView.stateName === 'my') {
              $state.go('my');
            } else {
              // $scope.$apply(()=>{ $scope.continue = true; });
              $state.go('stars');
            }
          })
          .catch(function(error) {
            $scope.$apply(()=>{ $scope.uploading = false;  });
            err(error);
            warn( 'updateProfile error', error);
            alerts.error( error.message );
          });

      });
    });
  });

}])

.controller('signinCtrl', ['$scope', '$stateParams', '$rootScope', '$state', '$timeout', '$ionicHistory',
function ($scope, $stateParams, $rootScope, $state, $timeout, $ionicHistory) {

  function goToStars() {
    $ionicHistory.nextViewOptions({ disableAnimate: true });
    $state.go('stars');
  }

  // Wait while user auth in background
  let unwatchUser = $rootScope.$watch('user', function(val){
    log('watch $rootScope.user', val);
    if ($rootScope && $rootScope.user) {
      log('Logged in');
      unwatchUser();
      $timeout.cancel(timeout);
      goToStars();
    }
  }, false);

  const timeout = $timeout( ()=>{
    unwatchUser();
    if ($rootScope && $rootScope['user']) {
      log('Timeout Logged in');
      goToStars();
    } else {
      log('Timeout Not logged in');
      $state.go('login');
    }
  }, 5000);
}])

.controller('loginCtrl', ['$scope', '$stateParams', '$state', 'alerts', '$ionicHistory', 'gettextCatalog',
function ($scope, $stateParams, $state, alerts, $ionicHistory, gettextCatalog ) {
  $ionicHistory.clearCache().then(function () {
    $ionicHistory.clearHistory();
  });
  // The start method will wait until the DOM is loaded.
  // ui.start('#firebaseui-auth-container', uiConfig);
  $scope.otpPhone = true;
  $scope.otpSending = false;
  $scope.otpMode = false;
  $scope.otpChecking = false;
  $scope.captchaVerified = false;

  window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('login-button-otp', {
    'size': 'invisible',
    'badge': 'bottomright',
    'callback': function(response) {
      // reCAPTCHA solved, allow signInWithPhoneNumber.
      log('reCAPTCHA callback response', response);
      $scope.$apply(()=>{  $scope.captchaVerified = true; });
      // onSignInSubmit();
    },
    'expired-callback': function() {
      log('Response expired. Ask user to solve reCAPTCHA again.');
      $scope.otpPhone = true;
      $scope.otpSending = false;
    }
  });

  log('lastUserPhone',localStorage.getItem('lastUserPhone'));
  $scope.user = {
    phone: localStorage.getItem('lastUserPhone'),
    email: localStorage.getItem('lastUserEmail'),
    password:  '',
    otp: ''
  };

  $scope.otp = function () {
    $scope.otpPhone = false;
    $scope.otpSending = true;
    const phoneNumber = $scope.user.phone;
    localStorage.setItem('lastUserPhone', phoneNumber);
    const appVerifier = window.recaptchaVerifier;
    firebase.auth().signInWithPhoneNumber(phoneNumber, appVerifier)
      .then(function (confirmationResult) {
        log('signInWithPhoneNumber confirmationResult', confirmationResult );
        // SMS sent. Prompt user to type the code from the message, then sign the
        // user in with confirmationResult.confirm(code).
        window.confirmationResult = confirmationResult;
        $scope.$apply(()=>{
          $scope.otpSending = false;
          $scope.otpMode = true;
          $scope.user.otp = '';
        });
      })
      .catch(function (error) {
        alerts.error(gettextCatalog.getString('Invalid phone number'),
          gettextCatalog.getString('Your phone must be in international format<br> and starts from + sign. For example +12223334455'));
        log('SMS not sent', error);
        $scope.$apply(()=>{
          $scope.otpPhone = true;
          $scope.otpSending = false;
        });
        err(error);
    });
  };

  $scope.otpCheck = function () {
    $scope.otpMode = false;
    $scope.otpChecking = true;
    const code = $scope.user.otp.toString();
    confirmationResult.confirm(code)
      .then(function (result) {
      log('User signed in successfully.', result);
      // var user = result.user;
      $state.go('stars');
    })
      .catch(function (error) {
        alerts.error(gettextCatalog.getString('Bad verification code'));
      log('User couldn\'t sign in (bad verification code?)', error);
      $scope.$apply(()=>{
        $scope.otpMode = true;
        $scope.otpChecking = false;
      });
      err(error);
    });
  };

  $scope.changePhone = function () {
    $scope.otpPhone = true;
    $scope.otpMode = false;
  };

}])

.controller('resetPasswordCtrl', ['$scope', '$stateParams',
function ($scope, $stateParams) {


}])

.controller('registerCtrl', ['$scope', '$stateParams', '$state', 'alerts',
function ($scope, $stateParams, $state, alerts) {

}])

.controller('editProfileCtrl', ['$scope', '$stateParams', '$rootScope', '$ionicHistory',
  '$state', 'alerts', 'social', 'toast', 'gettextCatalog',
function ($scope, $stateParams, $rootScope, $ionicHistory, $state, alerts, social, toast, gettextCatalog) {

  $scope.savingProfile = false;
  $scope.newProfile = $rootScope.profile;

  const nickInput = document.getElementById('edit-profile-nick');
  const nameInput = document.getElementById('edit-profile-name');

  function editProfileNameOnBlur() {
    if (nickInput.value.trim()==='') {
      $scope.$apply(()=>{
        $scope.newProfile.nick = tools.createNick($scope.newProfile.displayNameUnfilled);
        nameInput.focus();
      });
      nameInput.focus();
    }
  }
  nameInput.addEventListener("blur", editProfileNameOnBlur);

  let unwatchRootScopeProfile = $rootScope.$watch('profile', function(){
      $scope.newProfile = $rootScope.profile; // make local copy of profile
      // $scope.newProfile.displayName = $rootScope.profile.displayNameUnfilled; // return display name to stored in DB (no Unknown)
  }, true);

  $scope.$on('$ionicView.beforeLeave', function(){
    unwatchRootScopeProfile();
  });

  $scope.$watch('newProfile.nick', function(){
    $scope.newProfile.link = getProfileLink($scope.newProfile);
  });

  $scope.copyMyProfileLinkToClipboard = function() {
    tools.copyTextFromInput('myProfileLinkInput');
    toast.show(gettextCatalog.getString('Profile link copied to clipboard'));
  };

  $scope.shareProfileLink = function() {
    if (!social.share(
      'Call me on Stars Messenger',
      $rootScope.profile.link,
      $rootScope.profile.displayName + ' @ Stars Messenger ')) {
      $scope.copyMyProfileLinkToClipboard();
    }
  };

  $scope.saveProfile = function() {
    log('Saving profile');
    log('$scope.newProfile', $scope.newProfile);
    $scope.savingProfile = true;

    //TODO Validate form
    $scope.newProfile.displayName = $scope.newProfile.displayNameUnfilled;
    $scope.newProfile.donation = $rootScope.account.donation;
    api.updateProfile($scope.newProfile)
      .then((result)=> {
        log('Profile updated', result);
        $scope.savingProfile = false;
        if ($ionicHistory.backView() && $ionicHistory.backView().stateName === 'my') {
          $state.go('my');
        } else {
          $state.go('stars');
        }
      })
      .catch(function(error) {
        $scope.savingProfile = false;
        warn( 'updateProfile error', error);
        err(error);
        alerts.error( error.message );
      });
  }
}])

.controller('incomingCallPriceCtrl', ['$scope', '$stateParams',
function ($scope, $stateParams) {


}])

.controller('withdrawCtrl', ['$scope', '$stateParams',
function ($scope, $stateParams) {


}])

.controller('withdrawalResultCtrl', ['$scope', '$stateParams',
function ($scope, $stateParams) {


}])

.controller('topUpBalanceCtrl', ['$scope', '$stateParams',
function ($scope, $stateParams) {


}])

.controller('topUpResultCtrl', ['$scope', '$stateParams',
function ($scope, $stateParams) {


}])

.controller('starCtrl', ['$scope', '$stateParams', '$rootScope', '$ionicHistory', '$state',
  'alerts', 'toast', 'social', 'apiUI', 'profileFiller', 'gettextCatalog',
function ($scope, $stateParams, $rootScope, $ionicHistory, $state, alerts, toast, social, apiUI, profileFiller, gettextCatalog) {
  // TODO find user by nick (if uid starts with @)
  // log('$stateParams',$stateParams);
  $rootScope.hideFavoritesHint = false;
  $rootScope.hideShareStarHint = false;
  getLocalStorage($rootScope, 'hideFavoritesHint');
  getLocalStorage($rootScope, 'hideShareStarHint');

  const id = $stateParams.uid;
  $scope.star = {};

  const profileRef = (id[0]==='@')
    ? api.profilesRef.where('nickLowerCase','==', id.substr(1).toLowerCase() ).limit(1)
    : api.profilesRef.doc(id);

  let starUnsubscribe = profileRef.onSnapshot(function(profile) {
    let profileData = null;
    if (profile.exists) // request by uid
      profileData = profile.data();
    else // request by nick
      if (profile.docs && profile.docs.length>0)
        profileData = profile.docs[0].data();
    // log('Star Profile', profile);
    // log('Star profileData', profileData);

    // clear image before update
    if ($scope.star.photoURL && ($scope.star.photoURL !== profileData.photoURL)) {
      $scope.$apply(function () {
        $scope.star.photoURL = null;
      });
    }

    $scope.$apply(function(){ // Updates view on change
      if (profileData) {
        $scope.star = profileFiller.fill(profileData);
      } else { // profile not found
        $scope.star.photoURL = '../img/icon2048.png';
        $scope.star.displayName = gettextCatalog.getString('Profile not found');
      }
    });
    log("Current star data: ", profileData);
  }, err);

   // Unwatch on exit from page view
  $scope.$on('$ionicView.beforeLeave', function(){
    log('$ionicView.beforeLeave');
    starUnsubscribe();
  });

  // Copy star profile link
  $scope.copyProfileLinkToClipboard = function() {
    tools.copyTextFromInput('profileLinkInput');
    toast.show(gettextCatalog.getString('Profile link copied to clipboard'));
  };

  // Share star
  $scope.shareStar = function() {
    setLocalStorage($rootScope, 'hideShareStarHint', true);
    const message = $scope.star.displayName+' @ Stars.Expert';
    if (!social.share(message, $scope.star.link, message, null, $scope.copyProfileLinkToClipboard)) {
      $scope.copyProfileLinkToClipboard();
    }
  };

  // Dial star
  $scope.dial = function() {
    // Check balance is enough to make a call
    // log('$rootScope.account.balance',$rootScope.account.balance);
    // log('$scope.star.priceCall', $scope.star.priceCall);
    if ($rootScope.account['balance']>=$scope.star['priceCall']) {
      $ionicHistory.nextViewOptions({disableAnimate: true});
      $state.go('dialing', {uid: $scope.star.uid});
    } else {
      alerts.ask(
        gettextCatalog.getString('Not enough balance'),
        gettextCatalog.getString('To make a call you need balance for one minute or more')+
        '</br></br>'+
        gettextCatalog.getString('Please top-up your balance'),
        gettextCatalog.getString('Top-up'),
        ()=>{
          apiUI.topup();
        }
      );
    }
  };

  // toggle star button
  $scope.toggleFavorite = function() {
    setLocalStorage($rootScope, 'hideFavoritesHint', true);

    if($rootScope && $rootScope.profile) {
      if (!$rootScope.private.favorites) $rootScope.private.favorites = [];
      // star's uid not in favorites array
      const index = $rootScope.private.favorites.indexOf($scope.star.uid);
      if (index===-1) {
        $rootScope.private.favorites.push($scope.star.uid);
        toast.show(gettextCatalog.getString('Star added to your favorites'));
      } else {
        $rootScope.private.favorites.splice(index, 1);
        toast.show(gettextCatalog.getString('Star removed from your favorites'));
      }

      api.updatePrivate($rootScope.private);
      log('$rootScope.private.favorites',$rootScope.private.favorites);
    }
  }

}])

.controller('dialingCtrl', ['$scope', '$ionicHistory', '$state', '$stateParams', '$rootScope',
'gettextCatalog', 'profileFiller',
function ($scope, $ionicHistory, $state, $stateParams, $rootScope, gettextCatalog, profileFiller) {
  $rootScope.busy = true;
  $scope.star = {uid: $stateParams.uid};
  $scope.call = {};
  /// Call
  $scope.call.status = gettextCatalog.getString('connecting');
  $scope.call.disableCancel = true;
  let call = {};
  let callUnsubscribe = null;

  function setCallStatus(text, apply=true) {
    log('Call Status:', text);
    $('audio').each(function(){
      if (this.id===(text+'Audio')) {
        this.play();
      } else {
        this.pause();
        this.currentTime = 0;
      }
    });
    if (apply){
      $scope.$apply(function(){
        $scope.call.status = text;
      })} else {
      $scope.call.status = text;
    }
  }

  db.collection("profiles").doc($stateParams.uid).get()
    .then(function(profile) {
      $scope.$apply(function(){ // Updates view on change
        $scope.star = profileFiller.fill(profile.data());
      });
      log("Current star data: ", profile.data());
      call = {
        to: $stateParams.uid,
      };
      api.createCall(call)
        .then((result)=>{
          /// Call
          setCallStatus(gettextCatalog.getString('dialing'));
          call.id = result.data;
          $scope.$apply(function(){ $scope.call.disableCancel = false; });
          log('call.id', call.id);
          // setCallStatus('connecting');
          callUnsubscribe = db.collection("messages").doc(call.id)
            .onSnapshot(function(doc) {
              const callData = doc.data();
              console.log("Current call data: ", callData);
              if (callData['delivered']) {
                /// Call
                setCallStatus(gettextCatalog.getString('calling'));
              }
              if (callData.finished) {
                /// Call
                setCallStatus(callData.busy?gettextCatalog.getString('busy'):gettextCatalog.getString('declined'));
                cleanupCall();
                $ionicHistory.goBack();
              }
              if (callData['answered']) {
                /// Call
                setCallStatus(gettextCatalog.getString('answered'));
                log('Answered.');
                navigator.vibrate(100);
                unsubscribe();
                $ionicHistory.nextViewOptions({disableAnimate: true});
                $state.go('call', {callId: call.id});
              }
            }, err);
        })
        .catch((error)=>{
          log('createCall error', error);
          err(error);
          /// Call
          setCallStatus(gettextCatalog.getString('error'));
          $scope.cancel();
        })
    });

  // Unwatch on exit from page view
  let unregisterBeforeLeave = $scope.$on('$ionicView.beforeLeave', function(){
    log('$ionicView.beforeLeave');
    finishCall();
    cleanupCall();
  });

  function unsubscribe(){
    if (callUnsubscribe) {
      callUnsubscribe();
      callUnsubscribe = null;
    }
    unregisterBeforeLeave();
  }

  function cleanupCall() {
    unsubscribe();
    $rootScope.busy = false;
  }

  function finishCall() {
    if (call.id) {
      api.finishCall({callId:call.id}).catch((error)=>{
        warn('finishCall error', error.message);
        err(error);
      });
    }
  }

  $scope.cancel = function() {
    finishCall();
    cleanupCall();
    $ionicHistory.goBack();
  }
}])

.controller('incomingCallCtrl', ['$scope', '$stateParams', '$rootScope', '$ionicHistory', '$state', 'profileFiller',
function ($scope, $stateParams, $rootScope, $ionicHistory, $state, profileFiller) {
  $rootScope.busy = true;
  $scope.star = null;
  let browserNotification = null;
  let isScreenWasOff = null;
  let AppWasInBackground = null;
  let moveToForegroundInterval = null;


  log('$stateParams', $stateParams);
  log('$rootScope.busy', $rootScope.busy);

  // Move app to foreground
  if((typeof cordova !== 'undefined') && cordova['plugins']['backgroundMode']) {
    log('Wake up');
    const bgMode = cordova.plugins.backgroundMode;

    // 500 ms delay to do not show previous screen on wakeup
    setTimeout( ()=> {
      AppWasInBackground = bgMode.isActive();
      if (AppWasInBackground)
        bgMode.moveToForeground();
      bgMode.moveToForeground();
      bgMode.isScreenOff(function (screenOff) {
        isScreenWasOff = screenOff;
        if (screenOff) {
          bgMode.unlock();
        }
        bgMode.moveToForeground();
      });
    }, 500 );

    // Sometimes app do not go to foreground - we trying to move it more times
    moveToForegroundInterval = setInterval( ()=>{
      if (bgMode.isActive())
        bgMode.moveToForeground();
      bgMode.isScreenOff(function (screenOff) {
        if (screenOff) {
          bgMode.unlock();
        }
        bgMode.moveToForeground();
      });
    }, 1000);
  }

  // Play ringtone
  $('audio#ringtoneAudio').each(function(){
    this.play();
  });
  // Vibrate
  const vibrationInterval = setInterval(()=>{
    log('vibrate');
    navigator.vibrate(500);
  },1000);

  // Subscribe for messages
  let callUnsubscribe = db.collection('messages').doc($stateParams.callId)
    .onSnapshot(function(call) {
      const callData = call.data();

      console.log("Current call data: ", callData);
      // if call is finished or answered at another device
      if (callData['finished'] || callData['answered']) {
        log('Call is finished or answered at another device');
        cleanupCall();
        navigateBack();
      }
      // Get caller profile once
      return $scope.star || db.collection("profiles").doc(callData.from).get()
        .then(function(profile) {
          const profileData = profileFiller.fill(profile.data());

          log('Current star data:', profileData);
          $scope.$apply(()=>{ $scope.star = profileData });
          // Show browser notification
          showIncomingCallNotification();
        });
    }, err);

  // Showing incoming call browser notification
  function showIncomingCallNotification(){
    if (typeof Notification!=='undefined') {

      function showNotification() {
        if (!browserNotification) {
          const displayName = $scope.star.displayName;
          const photoURL = $scope.star.photoURL;
          browserNotification = new Notification(
            `${displayName} calling you`,
            {body: 'click to answer', icon: photoURL}
          );
          setTimeout(browserNotification.close.bind(browserNotification), 10000);
          browserNotification.onclick = function (event) {
            log('browserNotification.onclick event', event);
            parent.focus();
            window.focus();
            $scope.answer();
            this.close();
          };
        }
      }

      if (Notification.permission === "granted") {
        log('Notification permission granted already');
        showNotification();
      }
      // Otherwise, we need to ask the user for permission
      else if (Notification.permission !== 'denied') {
        log('Asking for Notification permission');
        Notification.requestPermission().then(function (permission) {
          if (permission === "granted") {
            log('Notification permission granted');
            showNotification();
          }
        });
      }
    }
  }

  // Before leave
  let unregisterBeforeLeave = $scope.$on('$ionicView.beforeLeave', function(){
    log('$ionicView.beforeLeave');
    finishCall();
    cleanupCall();
  });

  function finishCall() {
    api.finishCall({callId:$stateParams.callId}).catch((error)=>{
      err(error);
      log('finishCall error', error.message);
    });
  }

  function unsubscribe() {

    // Stop ringtone
    $('audio#ringtoneAudio').each(function(){
      this.pause();
      this.currentTime = 0;
    });
    // Stop vibration
    if (vibrationInterval) clearInterval(vibrationInterval);

    // Stop moving to foreground
    if (moveToForegroundInterval) clearInterval(moveToForegroundInterval);

    if (callUnsubscribe) {
      callUnsubscribe();
      callUnsubscribe = null;
    }
    unregisterBeforeLeave();
    if (browserNotification) {
      log('Close notification');
      browserNotification.close();
    }
  }

  function cleanupCall(){
    unsubscribe();
    $rootScope.busy = false;
  }

  function navigateBack(){
    if (isScreenWasOff || AppWasInBackground) {
      cordova.plugins.backgroundMode.moveToBackground();
    }

    // 500 ms delay to do not show previous screen before moved to background
    setTimeout( ()=> {
      if ($ionicHistory.backView()) {
        $ionicHistory.nextViewOptions({disableAnimate: true});
        $ionicHistory.goBack();
      } else {
        // ? if no back view close app?
        $state.go('stars');
      }
    }, 500 );
  }

  $scope.cancel = function() {
    finishCall();
    cleanupCall();
    navigateBack();
  };

  $scope.answer = function () {
    log('Answering...');
    unsubscribe();
    api.callAnswered({callId:$stateParams.callId})
      .then((data)=>{
        log('Answered', data);
      })
      .catch((error)=>{
        warn('Answer error', error);
        err(error);
        $scope.cancel();
      });
    $ionicHistory.nextViewOptions({disableAnimate: true});
    $state.go('call', {callId: $stateParams.callId});
  };


}])

.controller('callCtrl', ['$scope', '$stateParams', '$rootScope', '$ionicHistory', '$state', '$interval',
function ($scope, $stateParams, $rootScope, $ionicHistory, $state, $interval) {
  // Remove incoming call / dialing views from history
  $ionicHistory.removeBackView();

  // Unlock screen orientation for call mode
  if (window.screen.orientation.unlock) {
    log('unlocking screen orientation...');
    window.screen.orientation.unlock();
    log('window.screen.orientation', window.screen.orientation );
  }

  $rootScope.busy = true;
  $scope.star = null;
  $scope.call = null;
  $scope.bill = null;
  $scope.incoming = null;
  $scope.connected = true;
  $scope.joined = false;
  log('$stateParams', $stateParams);
  log('$rootScope.busy', $rootScope.busy);
  let interval = null;
  let price = null;
  let connected  = false;



  // Ping call
  const pingInterval = $interval(function () {
    log('pingInterval');
    api.pingCall({callId:$stateParams.callId})
      .then(log('api.pingCall'))
      .catch( (e)=> {
        err(error);
        warn('api.pingCall error', e );
      });
  }, appConfig.pingIntervalSeconds*1000 );

  // Track call
  const callUnsubscribe = db.collection('messages').doc($stateParams.callId)
    .onSnapshot(function(call) {
      const callData = call.data();
      console.log("Current call data: ", callData);
      $scope.$apply(()=>{ $scope.call = callData });

      // Connect to jitsi room
      if (!connected) {
        connected = true;
        jitsi.connect($stateParams.callId.toLowerCase(), callData.password,
          function () { // onRemoteTrackCallback
            log('onRemoteTrackCallback - audio/video connection established');
            api.callJoined({callId: $stateParams.callId})
              .then((data) => {
                log('Joined', data);
                $scope.$apply(() => {
                  $scope.joined = true;
                });
              })
              .catch((error) => {
                err(error);
                warn('Join error', error);
              });

          }, function () { // onUserLeftCallback
            log('User left detected. Finishing call...');
            $scope.finish();
          });
      }

      // Finish call when it finished at other side
      if (callData.finished) {
        navigator.vibrate(100); //small vibration
        cleanupCall();
        navigateBack();
      }

      // Get caller profile once
      const incoming = $rootScope.user.uid===callData.to;
      $scope.$apply(()=>{
        $scope.incoming = incoming;
      });
      const another = incoming ? callData.from : callData.to;

      // Get another person profile and setup timer
      if (!$scope.star) {
        return db.collection("profiles").doc(another).get()
          .then(function (starProfile) {
            log('Current star data:', starProfile.data());
            $scope.$apply(() => {
              $scope.star = starProfile.data()
            });
            price = incoming
              ? $rootScope.profile['priceCall']
              : starProfile.data()['priceCall'];

            // setup cost/revenue calc / ping check interval
            if (!interval) interval = $interval(function () {
              if ($scope.call.finished && $interval.clear) $interval.clear(interval);

              // finish call when it not pinged long lime
              if ($scope.call['lastPingCallee'] && $scope.call['lastPingCaller']) {
                const pingDiffSeconds =
                  Math.abs($scope.call['lastPingCallee'].seconds - $scope.call['lastPingCaller'].seconds);
                log('pingDiff', pingDiffSeconds );
                // when long time no ping from other side then finish call
                if (pingDiffSeconds > appConfig.maxPingDiffSeconds) {
                  log('last ping difference too big. Finishing call...');
                  $scope.finish();
                }
              }

              // starts call billing when it joined
              const joined = $scope.call['joined'];
              // log('joined', joined);
              if (joined) {
                const estimatedServerTimeMs = new Date().getTime() + api.serverTimeOffset;
                // log('estimatedServerTimeMs', estimatedServerTimeMs);
                const callDuration = Math.floor(estimatedServerTimeMs / 1000 - joined.seconds);
                // log('callDuration',callDuration);
                const minutes = Math.floor(callDuration / 60);
                const seconds = callDuration - minutes * 60;

                function str_pad_left(string, pad, length) {
                  return (new Array(length + 1).join(pad) + string).slice(-2);
                }
                const timeStr = str_pad_left(minutes, '0', 2) + ':' + str_pad_left(seconds, '0', 2);
                $scope.bill = {
                  price: price,
                  time: callDuration,
                  timeStr: timeStr,
                  total: (price * callDuration / 60)
                };

                // Finish call when maxDuration reached
                // log('callDuration',callDuration, 'maxDuration',$scope.call.maxDuration);
                // TODO play sound/show message when 60 seconds left to maxDuration
                if (callDuration>=$scope.call.maxDuration) {
                  log('maxDuration reached. Finishing call...');
                  $scope.finish();
                }


              }
            }, 1000, 0, true);
          });
      }
    }, err);

  // Before Leave View
  let unregisterBeforeLeave = $scope.$on('$ionicView.beforeLeave', function(){
    log('$ionicView.beforeLeave');
    finishCall();
    cleanupCall();
  });

  function cleanupCall() {
    unregisterBeforeLeave();
    $scope.connected = false;
    $rootScope.busy = false;
    $interval.cancel(pingInterval);
    $interval.cancel(interval);

    if (callUnsubscribe)  callUnsubscribe();
    jitsi.unload();

    // Lock Screen orientation back to portrait
    if (window.screen.orientation.lock) {
      window.screen.orientation.lock('portrait').catch(function (e) {
        warn('screen orientation lock error', e);
      });
    }
  }

  function finishCall(){
    if ($scope.call && !$scope.call.finished)
      api.finishCall({callId:$stateParams.callId}).catch((error)=>{
        err(error);
        warn('finishCall error', error.message);
      });
  }

  const navigateBack = function(){
    if($ionicHistory.backView()) {
      $ionicHistory.goBack();
    } else {
      // ? if no back views minimize app?
      $state.go('stars');
    }
  };

  $scope.finish = function() { // Used when answered and connected
    log('Finishing...');
    finishCall();
    cleanupCall();
    navigateBack();
  };



}])



  .controller('chatCtrl', ['$scope', '$stateParams', '$rootScope', '$timeout', '$ionicScrollDelegate',
function ($scope, $stateParams, $rootScope, $timeout, $ionicScrollDelegate) {
  /*
  log('$stateParams',$stateParams);
  $scope.star = {uid: $stateParams.uid};
  db.collection("profiles").doc($stateParams.uid).get()
    .then(function(profile) {
      $scope.$apply(function(){ // Updates view on change
        $scope.star = profile.data();
      });
      log("Current star data: ", profile.data());
    });

  $scope.data = {};
  $scope.myId = '12345';
  $scope.messages = [];
  $scope.hideTime = true;
  var alternate;

  // === Messages ===

  userMessagesUnsubscribe = db.collection("messages")
    .where('to', '==', $stateParams.uid).where('call','==',false)
    .onSnapshot(function(querySnapshot) {
      const messages = [];
      querySnapshot.forEach(function (doc) {
        const msg = doc.data();
        messages.push(msg);
      });
      $scope.$apply(function () { $scope.messages = messages; });
      console.log('Messages', messages);
    });

  $scope.sendMessage = function() {
    alternate = !alternate;
    var d = new Date();
    d = d.toLocaleTimeString().replace(/:\d+ /, ' ');
    $scope.messages.push({
      userId: alternate ? '12345' : '54321',
      text: $scope.data.message,
      time: d
    });
    delete $scope.data.message;
    $ionicScrollDelegate.scrollBottom(true);
  };

  $scope.closeKeyboard = function() {
    // cordova.plugins.Keyboard.close();
  };
*/
}]);
