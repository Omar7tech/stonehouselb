{{-- A tiny silent video, looping for as long as the board is up: most television
     browsers count a playing video as somebody watching, and hold off their
     screen saver and idle timers while one runs. The attributes start it on the
     sets that can; the script is for the ones that want asking, and starts it
     again if the picture is ever interrupted. Plain ES5, like the rest of these
     pages. --}}
<video id="keep-awake" src="{{ asset('cover/keep-awake.mp4') }}" autoplay loop muted playsinline webkit-playsinline aria-hidden="true" style="position: fixed; right: 0; bottom: 0; width: 1px; height: 1px; opacity: 0.01;"></video>

<script type="text/javascript">
    (function () {
        var video = document.getElementById('keep-awake');

        if (!video || !video.play) {
            return;
        }

        function play() {
            try {
                if (video.paused) {
                    video.play();
                }
            } catch (error) {
                // A set with no video to speak of keeps showing the menu.
            }
        }

        play();
        setInterval(play, 30000);
    })();
</script>
