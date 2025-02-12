document.addEventListener('DOMContentLoaded', async () => {
    const nameInput = document.getElementById('name');
    const ageInput = document.getElementById('age');
    const genderSelect = document.getElementById('gender');
    const specialisationInput = document.getElementById('specialisation');
    const experienceInput = document.getElementById('experience');
    const startSessionButton = document.getElementById('start-session');
    const videoPlayer = document.getElementById('video-player');
    const replayButton = document.getElementById('replay-button');
    const nextButton = document.getElementById('next-button');
    const sessionSettings = document.querySelector('.session-settings');
    const videoContainer = document.querySelector('.video-container');
    const narrationPopup = document.getElementById('narration-popup');
    const countdownElement = document.getElementById('countdown');
    const recordingIndicator = document.getElementById('recording-indicator');

    let mediaRecorder;
    let audioChunks = [];
    let videosPauses = [];
    let videos = [];
    let allVideos = [];
    let currentVideoIndex = 0;
    let isPausedVideo = false;

    async function fetchVideos() {
        try {
            const response = await fetch('videos.json');
            const data = await response.json();
            videosPauses = data.videos_pauses || []; // Special test video
            videos = data.videos || []; // Other videos

            // Ensure test.mp4 plays first
            return [...videosPauses, ...videos];
        } catch (error) {
            console.error('Error fetching videos:', error);
            return [];
        }
    }

    function loadVideo(videoPath) {
        videoPlayer.src = videoPath;
        videoPlayer.load();
        videoPlayer.muted = false;

        // Check if the video is the test.mp4 from Videos_pauses/
        isPausedVideo = videoPath.includes("Videos_pauses");
        setupStopLogic();
    }

    function setupStopLogic() {
        if (!isPausedVideo) return;

        videoPlayer.addEventListener('timeupdate', function stopAt10Sec() {
            if (Math.floor(videoPlayer.currentTime) === 10) {
                videoPlayer.pause();
                videoPlayer.removeEventListener('timeupdate', stopAt10Sec);

                // Move to next video after stopping
                setTimeout(nextVideo, 1000);
            }
        });
    }

    async function startSession() {
        participantData = {
            name: nameInput.value,
            age: ageInput.value,
            gender: genderSelect.value,
            specialisation: specialisationInput.value,
            experience: experienceInput.value,
        };

        if (!participantData.name || !participantData.age || !participantData.gender || !participantData.specialisation || !participantData.experience) {
            alert('Please fill in all fields');
            return;
        }

        // Hide session settings and show video container
        sessionSettings.style.display = 'none';
        videoContainer.classList.add('fullscreen');
        enterFullscreen(videoContainer);

        allVideos = await fetchVideos();
        currentVideoIndex = 0;

        // Load and play the first video (test.mp4 first)
        loadVideo(allVideos[currentVideoIndex]);
    }

    function enterFullscreen(element) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }

    function nextVideo() {
        if (currentVideoIndex < allVideos.length - 1) {
            currentVideoIndex++;
            loadVideo(allVideos[currentVideoIndex]);
        }
    }

    function onVideoEnd() {
        nextButton.disabled = false;
    }

    async function requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            console.log('Microphone permission granted');
        } catch (error) {
            console.error('Microphone permission denied', error);
            alert('Microphone permission is required to proceed with the experiment.');
        }
    }

    function shuffleArray(array) {
        return array.sort(() => Math.random() - 0.5);
    }

    // Initialize the session controls
    startSessionButton.addEventListener('click', startSession);
    replayButton.addEventListener('click', () => videoPlayer.play());
    nextButton.addEventListener('click', nextVideo);
    videoPlayer.addEventListener('ended', onVideoEnd);

    // Request microphone permission on page load
    requestMicrophonePermission();
});

