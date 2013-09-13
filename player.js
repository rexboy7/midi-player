
document.addEventListener('DOMContentLoaded', domReady);

var activePlayer;

function $(id) {
  return document.getElementById(id);
}

function domReady() {
  MIDI.loadPlugin({
    soundfontUrl: "MIDI.js/soundfont/",
    instruments: [ "acoustic_grand_piano" ],
    callback: function() {
      $('btn-little-star').disabled = false;
      $('btn-little-star').addEventListener('click', playLittleStar);
      $('btn-update-speed').addEventListener('click', updateSpeed);
    }
  });
}

function playLittleStar() {
  $('btn-little-star').disabled = true;
  playMIDI('littlestar.mid');
}

function playMIDI(url) {
  console.log('playMIDI: ' + url);
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.overrideMimeType("text/plain; charset=x-user-defined");
  xhr.onreadystatechange = function() {
    if(xhr.readyState == 4 && xhr.status == 200) {
      /* munge response into a binary string */
      var t = xhr.responseText || "" ;
      var ff = [];
      var mx = t.length;
      var scc= String.fromCharCode;
      for (var z = 0; z < mx; z++) {
        ff[z] = scc(t.charCodeAt(z) & 255);
      }
      playMIDIData(ff.join(""));
    } else if (xhr.readyState === 4) {
      alert('status: ' + xhr.status);
    }
  }
  xhr.send();
}

function playMIDIData(data) {
  midiFile = MidiFile(data);
  activePlayer = Replayer(midiFile, MIDIChannel);
  activePlayer.finishCallback = function() {
    $('btn-little-star').disabled = false;
    $('control-section').hidden = true;
    activePlayer = null;
  };
  $('control-section').hidden = false;
  activePlayer.replay();
}

function updateSpeed() {
  if (!activePlayer) {
    return;
  }

  var speed = $('text-speed').value;
  var dSpeed = parseFloat(speed, 10);
  if (!isNaN(dSpeed)) {
    activePlayer.changeSpeed(dSpeed);
  }
}
