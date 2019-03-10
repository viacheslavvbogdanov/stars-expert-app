/* global JitsiMeetJS */
/* eslint-disable lines-around-comment */
/* eslint-disable object-shorthand, max-len */


const jitsi = (function () { // eslint-disable-line no-unused-vars
  const jitsiOptions = {
    hosts: {
      domain: 'meet.stars.expert',
      muc: 'conference.meet.stars.expert' // FIXME: use XEP-0030
    },
    bosh: 'https://meet.stars.expert/http-bind', // FIXME: use xep-0156 for that
    // The name of client node advertised in XEP-0115 'c' stanza
    clientNode: 'http://www.stars.expert'
  };

  const confOptions = {
    openBridgeChannel: true,
    // enableTalkWhileMuted: true,
    // ignoreStartMuted: true
  };

  let connection = null;
  let isJoined = false;
  let room = null;

  let localTracks = [];
  const remoteTracks = {};
  let roomName = null;
  let roomPassword = null;
  let onRemoteTrackCallbackFunc = null;
  let onUserLeftCallbackFunc = null;

  /**
   * Handles local tracks.
   * @param tracks Array with JitsiTrack objects
   */
  function onLocalTracks(tracks) {
    localTracks = tracks;
    for (let i = 0; i < localTracks.length; i++) {
      console.log('Local track', localTracks[i])
      localTracks[i].addEventListener(
        JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
        audioLevel => console.log(`Audio Level local: ${audioLevel}`));
      localTracks[i].addEventListener(
        JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
        () => console.log('local track muted'));
      localTracks[i].addEventListener(
        JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
        () => console.log('local track stopped'));
      localTracks[i].addEventListener(
        JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
        deviceId =>
          console.log(
            `track audio output device was changed to ${deviceId}`));
      if (localTracks[i].getType() === 'video') {
        // $('#tracks').append(`<video autoplay='1' id='localVideo${i}' class='-localVideoTrack'/>`);
        // localTracks[i].attach($(`#localVideo${i}`)[0]);
        // localTracks[i].attach($('#localVideo')[0]);
        const localVideo = document.getElementById('localVideo');
        localTracks[i].attach(localVideo);
        localVideo.style.display = 'block';

      } else {
        // $('#tracks').append(`<audio autoplay='1' muted='true' id='localAudio${i}' />`);
        // localTracks[i].attach($(`#localAudio${i}`)[0]);
        localTracks[i].attach(document.getElementById('localAudio'));
      }
      if (isJoined) {
        room.addTrack(localTracks[i]);
      }
    }
  }

  /**
   * Handles remote tracks
   * @param track JitsiTrack object
   */
  function onRemoteTrack(track) {
    if (track.isLocal()) {
      return;
    }
    log(`Remote track added: ${track}`, track);
    const participant = track.getParticipantId();

    if (!remoteTracks[participant]) {
      remoteTracks[participant] = [];
    }
    const idx = remoteTracks[participant].push(track);
    // remoteTracks[participant].push(track);

    track.addEventListener(
      JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
      audioLevel => console.log(`Audio Level remote: ${audioLevel}`));
    track.addEventListener(
      JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
      () => console.log('remote track muted'));
    track.addEventListener(
      JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
      () => console.log('remote track stopped'));
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
      deviceId =>
        console.log(
          `track audio output device was changed to ${deviceId}`));
    // const id = participant + track.getType() + idx;

    if (track.getType() === 'video') {
      // $('#tracks').append(
      //     `<video autoplay='1' id='${participant}video${idx}' class='remoteVideoTrack'/>`);
      const remoteVideo = document.getElementById('remoteVideo');
      track.attach(remoteVideo);
      remoteVideo.style.display = 'block';
    } else {
      const id = `${participant}audio${idx}`;
      $('#tracks').append(
          `<audio autoplay='1' id='${id}' />`);
      log( 'attaching track, id:', id );
      track.attach($(`#${id}`)[0]);
      // track.attach(document.getElementById('remoteAudio'));

    }
    if (onRemoteTrackCallbackFunc) {
      onRemoteTrackCallbackFunc();
      onRemoteTrackCallbackFunc = null;
    }

  }

  /**
   * That function is executed when the conference is joined
   */
  function onConferenceJoined() {
    console.log('conference joined!');
    isJoined = true;
    for (let i = 0; i < localTracks.length; i++) {
      room.addTrack(localTracks[i]);
    }
    log( 'getStartMutedPolicy', room.getStartMutedPolicy() );
  }

  /**
   *
   * @param id
   */
  function onUserLeft(id) {
    console.log('user left');
    if (onUserLeftCallbackFunc) onUserLeftCallbackFunc();
    if (!remoteTracks[id]) {
      return;
    }
    const tracks = remoteTracks[id];

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];

      if (track.getType() === 'video') {
        track.detach(document.getElementById('remoteVideo'));
      } else {
        const tagId = `${id}${tracks[i].getType()}${i}`;
        log( 'detaching track, id:', tagId );
        tracks[i].detach($(`#${tagId}`)[0]);
        $(`#${tagId}`).remove();
        // track.detach(document.getElementById('remoteAudio'));
      }
    }
  }

  /**
   * That function is called when connection is established successfully
   */
  function onConnectionSuccess() {
    room = connection.initJitsiConference(roomName, confOptions);
    room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
    room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, track => {
      console.log(`track removed!!!${track}`);
    });
    room.on(
      JitsiMeetJS.events.conference.CONFERENCE_JOINED,
      onConferenceJoined);
    room.on(JitsiMeetJS.events.conference.USER_JOINED, id => {
      console.log('user join');
      remoteTracks[id] = [];
    });
    room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
    room.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, track => {
      console.log(`${track.getType()}-${track.isMuted()}`);
    });
    room.on(
      JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED,
      (userID, displayName) => console.log(`${userID}-${displayName}`));
    room.on(
      JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
      (userID, audioLevel) => console.log(`${userID}-${audioLevel}`));
    room.on(
      JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED,
      () => console.log(
        `${room.getPhoneNumber()}-${room.getPhonePin()}`));

    room.on(
      JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, ()=>{
      log('TRACK_MUTE_CHANGED')});
    room.on(
      JitsiMeetJS.events.conference.START_MUTED_POLICY_CHANGED, ()=>{
      log('START_MUTED_POLICY_CHANGED')});
    room.on(
      JitsiMeetJS.events.conference.STARTED_MUTED, ()=>{
      log('STARTED_MUTED ') });

    room.join(roomPassword);
  }

  /**
   * This function is called when the connection fail.
   */
  function onConnectionFailed() {
    console.error('Connection Failed!');
  }

  /**
   * This function is called when the connection fail.
   */
  function onDeviceListChanged(devices) {
    console.info('current devices', devices);
  }

  /**
   * This function is called when we disconnect.
   */
  function removeEventListeners() {
    console.log('disconnect!');
    connection.removeEventListener(
      JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
      onConnectionSuccess);
    connection.removeEventListener(
      JitsiMeetJS.events.connection.CONNECTION_FAILED,
      onConnectionFailed);
    connection.removeEventListener(
      JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
      removeEventListeners);
  }

  let loaded = false;
  /**
   *
   */
  function unload() {
    if (loaded) {
      loaded = false;
      for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].dispose();
      }
      if (room) room.leave();
      if (connection) connection.disconnect();
    }
  }

  let isVideo = true;

  /**
   *
   */
  function switchVideo() { // eslint-disable-line no-unused-vars
    isVideo = !isVideo;
    if (localTracks[1]) {
      localTracks[1].dispose();
      localTracks.pop();
    }
    JitsiMeetJS.createLocalTracks({
      devices: [isVideo ? 'video' : 'desktop']
    })
      .then(tracks => {
        localTracks.push(tracks[0]);
        localTracks[1].addEventListener(
          JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
          () => console.log('local track muted'));
        localTracks[1].addEventListener(
          JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
          () => console.log('local track stopped'));
        const localVideo = document.getElementById('localVideo');
        localTracks[1].attach(localVideo);
        localVideo.style.display = 'block';
        room.addTrack(localTracks[1]);
      })
      .catch(error => console.log(error));
  }

  /**
   *
   * @param selected
   */
  function changeAudioOutput(selected) { // eslint-disable-line no-unused-vars
    JitsiMeetJS.mediaDevices.setAudioOutputDevice(selected.value);
  }

  // $(window).bind('beforeunload', unload);
  // $(window).bind('unload', unload);

  JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
  const initOptions = {
    disableAudioLevels: true,
    // The ID of the jidesha extension for Chrome.
    desktopSharingChromeExtId: 'kglhbbefdnlheedjiejgomgmfplipfeb',
    // Whether desktop sharing should be disabled on Chrome.
    desktopSharingChromeDisabled: true, // false,
    // The media sources to use when using screen sharing with the Chrome
    // extension.
    desktopSharingChromeSources: ['screen', 'window'],
    // Required version of Chrome extension
    desktopSharingChromeMinExtVersion: '0.1',
    // Whether desktop sharing should be disabled on Firefox.
    desktopSharingFirefoxDisabled: true
  };


  /**
   * Connects to room
   * @param conferenceRoomName conference room name
   */
  function connect(conferenceRoomName, conferenceRoomPassword, onRemoteTrackCallback, onUserLeftCallback) {
    onRemoteTrackCallbackFunc = onRemoteTrackCallback;
    onUserLeftCallbackFunc    = onUserLeftCallback;
    JitsiMeetJS.init(initOptions);
    roomName = conferenceRoomName;
    roomPassword = conferenceRoomPassword;
    connection = new JitsiMeetJS.JitsiConnection(null, null, jitsiOptions);

    connection.addEventListener(
      JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
      onConnectionSuccess);
    connection.addEventListener(
      JitsiMeetJS.events.connection.CONNECTION_FAILED,
      onConnectionFailed);
    connection.addEventListener(
      JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
      removeEventListeners);



    JitsiMeetJS.mediaDevices.addEventListener(
      JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
      onDeviceListChanged);

    connection.connect();

    // JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.DEBUG);
    // JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
    //   console.log('IO Devices', devices);
    // });

    JitsiMeetJS.createLocalTracks({devices:['video','audio']})
      .then(onLocalTracks)
      .catch(error => {
        console.warn( 'createLocalTracks error', error);
      });


    loaded = true;
    return true;
  }

  function info() {
    // list devices
    console.log('==== INFO ====');
    // navigator.getUserMedia({video:true, audio:true}, ()=>{
      navigator.mediaDevices.enumerateDevices().then(function(devices) {
        console.log('=== Devices ===');
        devices.forEach(function(device) {
          console.log('=', device.label);
        });
      });
    // });
    // JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
    //   console.log('IO Devices', devices);
    // });
  }

  return {
    connect: connect,
    unload: unload,
    info: info
  };

  // if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output')) {
  //     JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
  //         const audioOutputDevices
  //             = devices.filter(d => d.kind === 'audiooutput');
  //
  //         if (audioOutputDevices.length > 1) {
  //             $('#audioOutputSelect').html(
  //                 audioOutputDevices
  //                     .map(
  //                         d =>
  // `<option value="${d.deviceId}">${d.label}</option>`)
  //                     .join('\n'));
  //
  //             $('#audioOutputSelectWrapper').show();
  //         }
  //     });
  // }
})();
