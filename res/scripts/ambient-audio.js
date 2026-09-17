const ambientAudioElement = document.getElementById("ambient-audio");
const ambientAudioToggleButton = document.getElementById("ambient-audio-toggle");

if (ambientAudioElement && ambientAudioToggleButton) {
    const supportsOggVorbis = Boolean(
        ambientAudioElement.canPlayType
        && ambientAudioElement.canPlayType('audio/ogg; codecs="vorbis"')
    );

    if (!supportsOggVorbis) {
        ambientAudioToggleButton.disabled = true;
        ambientAudioToggleButton.removeAttribute("aria-pressed");
    }
    else {
        const synchronizeAudioToggleState = () => {
            ambientAudioToggleButton.setAttribute(
                "aria-pressed",
                String(!ambientAudioElement.paused)
            );
        };

        ambientAudioToggleButton.addEventListener("click", async () => {
            if (ambientAudioElement.paused) {
                try {
                    await ambientAudioElement.play();
                }
                catch (error) {
                    console.error("Ambient audio could not be played.", error);
                }
            }
            else {
                ambientAudioElement.pause();
            }

            synchronizeAudioToggleState();
        });

        ambientAudioElement.addEventListener("play", synchronizeAudioToggleState);
        ambientAudioElement.addEventListener("pause", synchronizeAudioToggleState);
        synchronizeAudioToggleState();
    }
}
