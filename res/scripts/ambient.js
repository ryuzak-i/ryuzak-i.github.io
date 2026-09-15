const ambientAudio = document.getElementById("ambient");
const ambientToggle = document.getElementById("ambient_toggle");

if (ambientAudio && ambientToggle) {
    const canPlayOgg = Boolean(
        ambientAudio.canPlayType && ambientAudio.canPlayType('audio/ogg; codecs="vorbis"')
    );

    if (!canPlayOgg) {
        ambientToggle.disabled = true;
        ambientToggle.removeAttribute("aria-pressed");
    }
    else {
        const updateAudioControl = () => {
            ambientToggle.setAttribute("aria-pressed", String(!ambientAudio.paused));
        };

        ambientToggle.addEventListener("click", async () => {
            if (ambientAudio.paused) {
                try {
                    await ambientAudio.play();
                }
                catch (error) {
                    console.error("Ambient audio could not be played.", error);
                }
            }
            else {
                ambientAudio.pause();
            }

            updateAudioControl();
        });

        ambientAudio.addEventListener("play", updateAudioControl);
        ambientAudio.addEventListener("pause", updateAudioControl);
        updateAudioControl();
    }
}
