/* some tool functions */

// Web3
const web3 = new Web3(new Web3.providers.HttpProvider(envConfig.web3HttpProvider));
// const web3 = new Web3(new Web3.providers.WebSocketProvider(envConfig.web3WebSocketProvider));


 const log = PRODUCTION ? function() {} : console.log;
 const warn = PRODUCTION ? function() {} : console.warn;
 const err = function(error) {
   console.error(error);
   if ((typeof error !== 'undefined') && error.message)
     gtag('send', 'exception', {description:error.message} );
   // if (typeof Pro !== 'undefined') // Only works on paid Ionic PRO plans
   //   Pro.monitoring.exception(error);
 };


 // Get text price parts (dollars/cents) for UI
function getPriceParts(price, currencySign='$') {
  const dollars = Math.floor(price);
  const cents = Math.round((price-dollars)*100);
  const parts = {dollars:currencySign.concat(dollars)};
  if (cents>0) parts.cents = '.'+cents;
  return parts;
}

function setCookie(name,value,days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days*24*60*60*1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i=0;i < ca.length;i++) {
    let c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}

function eraseCookie(name) {
  document.cookie = name+'=; Max-Age=-99999999;';
}

 // hybrid analytics
function haveAnalyticsPlugin() {
 return (typeof cordova !== 'undefined')  && cordova['plugins'] && cordova['plugins']['firebase'] &&  cordova['plugins']['firebase']['analytics'];
}
 const ha = {

   setUserId : function(id) {
     if(haveAnalyticsPlugin()) { cordova.plugins.firebase.analytics.setUserId(id); }
   },

   logEvent : function(name, params) {
     if(haveAnalyticsPlugin()) { cordova.plugins.firebase.analytics.logEvent(name, params); }
     gtag('event', name, {
       'event_category': params['category'],
       'event_label': params['label'],
       'value': params['value']
     });
   },

   setUserProperty : function(name, value) {
     if(haveAnalyticsPlugin()) { cordova.plugins.firebase.analytics.setUserProperty(name, value); }
   },

   setCurrentScreen : function(name) {
     if(haveAnalyticsPlugin()) { cordova.plugins.firebase.analytics.setCurrentScreen(name); }
     gtag('event', 'screen_view', {
       'app_name': appConfig.name,
       'app_version': appConfig.version,
       'screen_name' : name
     });
   },

   setEnabled : function(enabled) {
     if(haveAnalyticsPlugin()) { cordova.plugins.firebase.analytics.setEnabled(enabled); }
   },

   resetAnalyticsData : function() {
     if(haveAnalyticsPlugin()) { cordova.plugins.firebase.analytics.resetAnalyticsData(); }
   },
 };

String.prototype.replaceAll = function(search, replacement) {
  const target = this;
  return target.split(search).join(replacement);
};

 function isEmptyObject(obj) {
  log('isEmptyObject', obj);

  for (const key in obj) {
    if (obj.hasOwnProperty(key))
      return false;
  }
  return true;
}

 function getLocalStorage( $scope, name, uid='' ) {
  $scope[name] = localStorage.getItem(uid+'-'+name);
}

 function setLocalStorage( $scope, name, value, uid='' ) {
  if (typeof value !== 'undefined' ) $scope[name] = value;
  localStorage.setItem(uid+'-'+name, value );
}

 const tools = {
  copyTextFromInput( inputId ) {
    const copyText = document.getElementById(inputId);
    copyText.select();
    document.execCommand("copy");
    log("Copied the text: " + copyText.value);
    copyText.selectionStart = copyText.selectionEnd;
  },

  createNick : function(fullName) {
    const slug = getSlug(fullName,
      {
        separator:' ',
        maintainCase: true
      }
    );
    return slug.replaceAll(' ', '').trim();
  },

  isEmptyObject: function (obj) {
    log('isEmptyObject', obj);

    for (const key in obj) {
      if (obj.hasOwnProperty(key))
        return false;
    }
    return true;
  },

  getQueryParam : function ( name, url ) {
    if (!url) url = location.href;
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    const regexS = "[\\?&]"+name+"=([^&#]*)";
    const regex = new RegExp( regexS );
    const results = regex.exec( url );
    return results == null ? null : results[1];
  }
};

 function assert(condition, message) {
  if (!condition) {
    message = message || "Assertion failed";
    if (typeof Error !== "undefined") {
      throw new Error(message);
    }
    throw message; // Fallback
  }
}

 function getProfileLink( profileData ) {
  return profileData.nick ?
    (envConfig.profileLinkMainURL + profileData.nick) : null;
}

 const analytics =  {
  plugin : function() {
    return (typeof cordova !== 'undefined') &&
      cordova['plugins'] &&
      cordova.plugins['firebase'] &&
      cordova.plugins.firebase.analytics ? cordova.plugins.firebase.analytics : false;
  },
  logEvent : function(name,params) {
    if (this.plugin()) this.plugin().logEvent(name,params);
  }
};


