function Replayer(midiFile, channelClass) {
  var trackStates = [];
  var beatsPerMinute = 120;
  var ticksPerBeat = midiFile.header.ticksPerBeat;
  var channelCount = 16;
  var speed = 1;
  var nextEventInfo;
  var secondsToNextEvent = -1;
  var channels = [];
  var timerID;
  var startTime;
  
  for (var i = 0; i < midiFile.tracks.length; i++) {
    trackStates[i] = {
      'nextEventIndex': 0,
      'ticksToNextEvent': (
        midiFile.tracks[i].length ?
          midiFile.tracks[i][0].deltaTime :
          null
      )
    };
  }
  
  for (var i = 0; i < channelCount; i++) {
    channels[i] = new channelClass(i);
  }
  
  
  function getNextEvent() {
    var ticksToNextEvent = null;
    var nextEventTrack = null;
    var nextEventIndex = null;
    
    for (var i = 0; i < trackStates.length; i++) {
      if (
        trackStates[i].ticksToNextEvent != null
        && (ticksToNextEvent == null || trackStates[i].ticksToNextEvent < ticksToNextEvent)
      ) {
        ticksToNextEvent = trackStates[i].ticksToNextEvent;
        nextEventTrack = i;
        nextEventIndex = trackStates[i].nextEventIndex;
      }
    }
    if (nextEventTrack != null) {
      /* consume event from that track */
      var nextEvent = midiFile.tracks[nextEventTrack][nextEventIndex];
      if (midiFile.tracks[nextEventTrack][nextEventIndex + 1]) {
        trackStates[nextEventTrack].ticksToNextEvent += midiFile.tracks[nextEventTrack][nextEventIndex + 1].deltaTime;
      } else {
        trackStates[nextEventTrack].ticksToNextEvent = null;
      }
      trackStates[nextEventTrack].nextEventIndex += 1;
      /* advance timings on all tracks by ticksToNextEvent */
      for (var i = 0; i < trackStates.length; i++) {
        if (trackStates[i].ticksToNextEvent != null) {
          trackStates[i].ticksToNextEvent -= ticksToNextEvent
        }
      }
      nextEventInfo = {
        'ticksToEvent': ticksToNextEvent,
        'event': nextEvent,
        'track': nextEventTrack
      }
      var beatsToNextEvent = ticksToNextEvent / ticksPerBeat;
      secondsToNextEvent = beatsToNextEvent / (beatsPerMinute / 60);
    } else {
      nextEventInfo = null;
      secondsToNextEvent = -1;
      self.finished = true;
      if (self.finishedCallback) {
      	self.finishedCallback();
      }
    }
  }
  
  getNextEvent();
  
  function scheduleNextTimer() {
    if (secondsToNextEvent < 0) {
      return;
    }
    // flush first event
    handleEvent();
    getNextEvent();
    if (secondsToNextEvent < 0) {
      return;
    }

    // flush more events
    while(secondsToNextEvent === 0) {
      handleEvent();
      getNextEvent();
    }

    if (secondsToNextEvent < 0) {
      return;
    }
    startTime = (new Date()).getTime();
    timerID = window.setTimeout(scheduleNextTimer, secondsToNextEvent * 1000 * speed);
  }
  
  function handleEvent() {
    var event = nextEventInfo.event;
    switch (event.type) {
      case 'meta':
        switch (event.subtype) {
          case 'setTempo':
            beatsPerMinute = 60000000 / event.microsecondsPerBeat
        }
        break;
      case 'channel':
        switch (event.subtype) {
          case 'noteOn':
            channels[event.channel].noteOn(event.noteNumber, event.velocity, 0);
            break;
          case 'noteOff':
            channels[event.channel].noteOff(event.noteNumber, 0);
            break;
          case 'programChange':
            channels[event.channel].setProgram(event.programNumber);
            break;
        }
        break;
    }
  }
  
  function replay() {
    scheduleNextTimer();
  }

  function changeSpeed(spd) {
  	if (spd < 0.1) {
  		return;
  	}
  	
  	var elapsedTime = ((new Date()).getTime() - startTime) / speed;
  	speed = spd;
  	var diff = secondsToNextEvent * 1000 - elapsedTime;
  	window.clearTimeout(timerID);
  	timerID = window.setTimeout(scheduleNextTimer, diff * speed);
  	console.log('speed: ', speed);
  }
  
  var self = {
  	'changeSpeed': changeSpeed,
    'replay': replay,
    'finished': false, 
    'finishedCallback': null
  }
  return self;
}
