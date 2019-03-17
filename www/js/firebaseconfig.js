// Initialize Firebase
firebase.initializeApp(envConfig.firebaseConfig);
firebase.auth().useDeviceLanguage();

const storage = firebase.storage();
const storageRef = storage.ref();
const avatarsRef = storageRef.child('avatars');

const db = firebase.firestore();
const dbSettings = {timestampsInSnapshots: true};
db.settings(dbSettings);


// Initialize Cloud Functions through Firebase
const functions = firebase.functions();
const api = {
  profilesRef : db.collection('profiles'),
  accountsRef : db.collection('accounts'),
  privatesRef : db.collection('privates'),
  messagesRef : db.collection('messages'),

  topUp             : functions.httpsCallable('topUp'),
  topUpFromRevenues : functions.httpsCallable('topUpFromRevenues'),
  withdraw          : functions.httpsCallable('withdraw'),
  createCall        : functions.httpsCallable('createCall'),
  callDelivered     : functions.httpsCallable('callDelivered'),
  callAnswered      : functions.httpsCallable('callAnswered'),
  callJoined        : functions.httpsCallable('callJoined'),
  finishCall        : functions.httpsCallable('finishCall'),
  updateProfile     : functions.httpsCallable('updateProfile'),
  updatePrivate     : functions.httpsCallable('updatePrivate'),
  setAffiliate      : functions.httpsCallable('setAffiliate'),
  pingCall          : functions.httpsCallable('pingCall')
};

// Get Server Time offset
api.serverTimeOffset = null;
const offsetRef = firebase.database().ref(".info/serverTimeOffset");
offsetRef.on("value", function(snap) {
  api.serverTimeOffset = snap.val();
  log('API serverTimeOffset', api.serverTimeOffset );
});


// Firebase Cloud Messaging
const messaging = firebase.messaging();
let messagingToken = null;
let messagingTokenSent = false;

messaging.usePublicVapidKey('BJHuQmb7SaVbyiSmiXdqneHCtyENjfl7v5NUixzVmgctyTSG_TVCRFD5xqw4vV63BQoDV3Ish3SHIjNkFo3yXLM');
messaging.requestPermission().then(function() {
  console.log('Notification permission granted.');
  messaging.getToken().then(function(currentToken) {
    messagingTokenSent = false;
    if (currentToken) {
      log('FCM Token', currentToken);
      messagingToken = currentToken;
      // sendTokenToServer(currentToken);
    } else {
      // Show permission request.
      console.warn('No Instance ID token available. Request permission to generate one.');
      // Show permission UI.
      // updateUIForPushPermissionRequired();
    }
  }).catch(function(err) {
    console.warn('An error occurred while retrieving token. ', err);
    messagingTokenSent = false;
  });
}).catch(function(err) {
  console.warn('Unable to get permission to notify.', err);
});


messaging.onMessage(function(payload) {
  console.warn('Message received. ', payload);
  // ...
});












