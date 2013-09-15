function MIDIChannel(idx) {
  this.channelIndex = idx;
  MIDI.programChange(this.channelIndex, 0);
}

var first = true;

MIDIChannel.prototype.noteOn = function(note, velocity, delay) {
  if (first) {
    first = false;
    console.log('first: ' + (new Date()));
  }
  MIDI.noteOn(this.channelIndex, note, velocity, delay);
};

MIDIChannel.prototype.noteOff = function(note, delay) {
  MIDI.noteOff(this.channelIndex, note, delay);
};

MIDIChannel.prototype.setProgram = function(progNum) {
  // we don't support it now.
};

