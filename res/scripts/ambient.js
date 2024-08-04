function playAudio() {
    audio_state = false;
    audio.play();
};

function pauseAudio() {
    audio_state = true;
    audio.pause();
};

function runState() {
    if (audio_state === true) {
        playAudio();
    }
    else {
        pauseAudio();
    };
};

var audio = document.getElementById("ambient");
var can_play_ogg = !!audio.canPlayType && audio.canPlayType('audio/ogg; codecs="vorbis"') != "";
var audio_state = can_play_ogg;

if (can_play_ogg === true) {
    audio.parentNode.addEventListener("click", runState);
};