angular.module('app.services', [])

  .factory('profileFiller', [ 'gettextCatalog', function(gettextCatalog) {
    return {
      fill: function (profileData) {
        if (!profileData) return null;
        if (!profileData.photoURL) profileData.photoURL = '../img/profile_image.png';
        profileData.displayNameUnfilled = profileData.displayName;
        if (!profileData.displayName) profileData.displayName = gettextCatalog.getString('Unknown');
        // profileData.priceCallParts = getPriceParts(profileData.priceCall);
        profileData.priceCallStr = 'Ξ'+ profileData.priceCall.toFixed(4);
        profileData.link = getProfileLink(profileData);
        return profileData;
      }
    }
  }])

  .factory('apiUI', [ 'alerts', 'gettextCatalog', '$rootScope', 'toast',
    function(alerts, gettextCatalog, $rootScope, toast) {
      $rootScope.copyTopupAddressToClipboard = function() {
        tools.copyTextFromInput('topupAddress');
        toast.show(gettextCatalog.getString('Address copied to clipboard'));
      };
    return {
      topup: function () {
        $rootScope.refreshTopupBalance();
        const refreshTopupBalanceInterval = setInterval(function(){
          $rootScope.refreshTopupBalance();
        }, 10*1000);
        alerts.input(
          gettextCatalog.getString('Top Up Your Balance'),
          gettextCatalog.getString('Send ETH to this one-time address, wait for the address balance increased and press ACCEPT'),
          gettextCatalog.getString('Accept'),
          `
<div class="center-horizontally"><span style="font-size: 12px" translate>click address to copy</span>
<script src="lib/qrcode.min.js"></script>
<div style="display: flex; justify-content: center; text-align: center;" id="qrcode" ng-click="copyTopupAddressToClipboard()"></div>
<script type="text/javascript">
new QRCode(document.getElementById("qrcode"), {
  text:"ethereum:${$rootScope.account.topupAddress}", 
  width: 168, height: 168
});
</script>
<input id="topupAddress" ng-click="copyTopupAddressToClipboard()" type="text"
style="font-size: 12px; text-align:center" readonly ng-model="account.topupAddress">
<!--<a class="button button-small" ng-click="copyTopupAddressToClipboard()" translate>Copy to clipboard</a>-->
<label ng-click="refreshTopupBalance()" class="item item-input" id="balance" style="padding: 0;">
        <span class="input-label" ng-class="{'energized':account.topupBalanceNum==0}" translate>Address Balance ETH</span>
        <input id="topupBalance" ng-model="account.topupBalanceStr" type="text" class="energized"
               placeholder="Refreshing..." readonly>
          <a class="button button-small button-block button-balanced padding-left ion-refresh" ng-click="refreshTopupBalance()"></a>
</label>
<a class="button button-small button-block button-dark padding-right" onclick="window.open('https://localethereum.com/r/vbogdanov', '_system', 'location=yes'); return false;" translate>Buy ETH online</a>

</div>`,
          () => {
            clearInterval(refreshTopupBalanceInterval);
            api.topUp()
              .then(()=>{
                alerts.info(
                  gettextCatalog.getString('Top Up Successful'),
                  gettextCatalog.getString('Address balance minus Ethereum transaction fee added to your service balance.')+'<br/><br/>'+
                  gettextCatalog.getString('*Urgent Note: Please DO NOT send ETH to this address again. For next top-up you will have another address.')
                );
              })
              .catch((error)=>{
                alerts.info(gettextCatalog.getString('Top Up Error'), error.message);
              })
          },
          null,
          ()=>{
            log('Cancel');
            clearInterval(refreshTopupBalanceInterval);
          });

      } //topup end
    }
  }])

  .factory('social', [ function() {
    return {
      share: function(message, url, subject=null, onSuccessCallback=null, onErrorCallback=null) {

        const onSuccess = function (result) {
          log("Share completed? " + result.completed); // On Android apps mostly return false even while it's true
          log("Shared to app: " + result.app); // On Android result.app since plugin version 5.4.0 this is no longer empty. On iOS it's empty when sharing is cancelled (result.completed=false)
          if (onSuccessCallback) onSuccessCallback();
        };
        const onError = function (msg) {
          log("Sharing failed with message: ", msg);
          if (onErrorCallback) onErrorCallback();
        };

        if (window.plugins && window.plugins.socialsharing ) {
          const options = {
            message: message, // not supported on some apps (Facebook, Instagram)
            subject: subject, // fi. for email
            url: url,
          };
          window.plugins.socialsharing.shareWithOptions(options, onSuccess, onError);

        } else onError('No socialsharing plugin found');
      }
    }
  }])

  .factory('toast', ['$ionicActionSheet', '$timeout', function($ionicActionSheet, $timeout) {
    return {
      show: function(title, timeout=2000) {
        const hideToast = $ionicActionSheet.show({
          titleText: title,
        });

        $timeout(function() {
          hideToast();

        }, timeout);

        return hideToast;
      }
    }
  }])

.factory('alerts', ['$ionicPopup', 'gettextCatalog', function($ionicPopup, gettextCatalog) {

  return {
    error: error,
    info: info,
    ask: ask,
    input: input
  };

  function info( title, subTitle='', buttonText=null, callback=null) {
    if (!buttonText) buttonText = gettextCatalog.getString('OK');

    $ionicPopup.show({
      title: title,
      subTitle: subTitle,
      cssClass: 'custom-popup',
      buttons: [{
        text: buttonText,
        type: 'button-dark',
        onTap: function(e) {
          if (callback) callback();
          return true;
        }
      }]
    });
  }

  function error( title, subTitle='', buttonText=null, callback=null) {
    if (!buttonText) buttonText = gettextCatalog.getString('OK');

    $ionicPopup.show({
      title: title,
      subTitle: subTitle,
      cssClass: 'custom-popup',
      buttons: [{
        text: buttonText,
        type: 'button-energized',
        onTap: function(e) {
          if (callback) callback();
          return true;
        }
      }]
    });
  }

  function ask( title, subTitle='', buttonText=null, callback=null, cancelText=null) {
    if (!buttonText) buttonText = gettextCatalog.getString('OK');
    if (!cancelText) cancelText = gettextCatalog.getString('Cancel');
    const myPopup = $ionicPopup.show({
      title: title,
      subTitle: subTitle,
      cssClass: 'custom-popup',
      buttons: [
        {
          text: buttonText,
          type: 'button-dark',
          onTap: function(e) {
            if (callback) callback();
            return true;
          }
        },
        { text: cancelText,
          type: 'button-energized',
        }
      ]
    })
  }


  function input( title, subTitle='', buttonText=null, template, callback=null, cancelText=null, cancelCallback) {
    if (!buttonText) buttonText = gettextCatalog.getString('OK');
    if (!cancelText) cancelText = gettextCatalog.getString('Cancel');
    const myPopup = $ionicPopup.show({
      // template: '<input type="password" ng-model="data.wifi">',
      template: template,
      title: title,
      subTitle: subTitle,
      // scope: scope,
      cssClass: 'custom-popup',
      buttons: [
        {
          text: buttonText,
          type: 'button-dark',
          onTap: function(e) {
            if (callback) callback();
            return true;
          }
        },
        { text: cancelText,
          type: 'button-energized',
          onTap: function(e) {
            if (cancelCallback) cancelCallback();
            return true;
          }
        }
      ]
    })
  }
}])

.service('Stars', [function(){

  this.isFavorite = function(uid) {
    return
  };
  this.setFavorite = function(uid, isFavorite=true) {
  };

}]);

