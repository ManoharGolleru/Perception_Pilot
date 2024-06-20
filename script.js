document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('name');
    const ageInput = document.getElementById('age');
    const genderSelect = document.getElementById('gender');
    const specialisationInput = document.getElementById('specialisation');
    const startSessionButton = document.getElementById('start-session');
    const videoPlayer = document.getElementById('video-player');
    const replayButton = document.getElementById('replay-button');
    const nextButton = document.getElementById('next-button');
    const sessionSettings = document.querySelector('.session-settings');
    const videoContainer = document.querySelector('.video-container');
    const narrationPopup = document.createElement('div');
    const countdownElement = document.createElement('div');
    const recordingIndicator = document.createElement('div');

    // Styles for the narration popup
    narrationPopup.style.position = 'fixed';
    narrationPopup.style.top = '40%';
    narrationPopup.style.left = '50%';
    narrationPopup.style.transform = 'translate(-50%, -50%)';
    narrationPopup.style.fontSize = '32px';
    narrationPopup.style.color = '#fff';
    narrationPopup.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    narrationPopup.style.padding = '20px';
    narrationPopup.style.borderRadius = '10px';
    narrationPopup.style.display = 'none';
    narrationPopup.style.zIndex = '1000'; // Ensures it appears above other elements
    narrationPopup.textContent = 'Start Narrating';
    document.body.appendChild(narrationPopup);

    // Styles for the countdown element
    countdownElement.style.position = 'fixed';
    countdownElement.style.top = '50%';
    countdownElement.style.left = '50%';
    countdownElement.style.transform = 'translate(-50%, -50%)';
    countdownElement.style.fontSize = '48px';
    countdownElement.style.color = '#fff';
    countdownElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    countdownElement.style.padding = '20px';
    countdownElement.style.borderRadius = '10px';
    countdownElement.style.display = 'none';
    countdownElement.style.zIndex = '1000'; // Ensures it appears above other elements
    document.body.appendChild(countdownElement);

    // Styles for the recording indicator
    recordingIndicator.style.position = 'fixed';
    recordingIndicator.style.top = '10px';
    recordingIndicator.style.left = '10px';
    recordingIndicator.style.fontSize = '20px';
    recordingIndicator.style.color = '#fff';
    recordingIndicator.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
    recordingIndicator.style.padding = '10px';
    recordingIndicator.style.borderRadius = '5px';
    recordingIndicator.style.display = 'none';
    recordingIndicator.style.zIndex = '1000'; // Ensures it appears above other elements
    recordingIndicator.textContent = 'Recording...';
    document.body.appendChild(recordingIndicator);

    let mediaRecorder;
    let audioChunks = [];
    let randomizedVideos = [];
    let currentVideoIndex = 0;
    let sessionData = [];
    let participantData = {};

    async function fetchVideos() {
        try {
            const response = await fetch('videos.json'); // Ensure videos.json is in the same directory as your HTML file
            const data = await response.json();
            console.log('Fetched videos:', data.videos);
            return data.videos;
        } catch (error) {
            console.error('Error fetching videos:', error);
            return [];
        }
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

    async function startSession() {
        participantData = {
            name: nameInput.value,
            age: ageInput.value,
            gender: genderSelect.value,
            specialisation: specialisationInput.value,
        };

        if (!participantData.name || !participantData.age || !participantData.gender || !participantData.specialisation) {
            alert('Please fill in all fields');
            return;
        }

        // Hide session settings and show video container
        sessionSettings.style.display = 'none';
        videoContainer.classList.add('fullscreen');
        if (videoContainer.requestFullscreen) {
            videoContainer.requestFullscreen();
        } else if (videoContainer.mozRequestFullScreen) { /* Firefox */
            videoContainer.mozRequestFullScreen();
        } else if (videoContainer.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
            videoContainer.webkitRequestFullscreen();
        } else if (videoContainer.msRequestFullscreen) { /* IE/Edge */
            videoContainer.msRequestFullscreen();
        }

        const videoClips = await fetchVideos();
        randomizedVideos = shuffleArray(videoClips);
        currentVideoIndex = 0;

        // Preload first video
        loadVideo(randomizedVideos[currentVideoIndex]);
    }

    function loadVideo(videoPath) {
        videoPlayer.src = videoPath;
        videoPlayer.load();
        videoPlayer.muted = true; // Mute the video player
    }

    async function replayVideo() {
        showNarrationPopup();
        sessionData.push({
            video: randomizedVideos[currentVideoIndex],
            startTime: new Date().toISOString(),
            action: 'replay',
        });

        countdownElement.style.display = 'block';
        let countdown = 5;
        countdownElement.textContent = countdown;

        const countdownInterval = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            if (countdown === 0) {
                clearInterval(countdownInterval);
                countdownElement.style.display = 'none';
                narrationPopup.style.display = 'none';
                startRecording();
                videoPlayer.play();
            }
        }, 1000);
    }

    function nextVideo() {
        if (currentVideoIndex < randomizedVideos.length - 1) {
            currentVideoIndex++;
            loadVideo(randomizedVideos[currentVideoIndex]);
            nextButton.disabled = true;
        } else {
            endSession();
        }
    }

    function onVideoEnd() {
        sessionData.push({
            video: randomizedVideos[currentVideoIndex],
            endTime: new Date().toISOString(),
        });
        nextButton.disabled = false;
        stopRecording();
    }

    function endSession() {
        // Prepare CSV data with headers
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Video,Start Time,End Time,Action\n"
            + sessionData.map(e => `${e.video},${e.startTime},${e.endTime || ''},${e.action || ''}`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "session_data.csv");
        document.body.appendChild(link);
        link.click();

        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari & Opera */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
            document.msExitFullscreen();
        }
    }

    function shuffleArray(array) {
        let currentIndex = array.length, temporaryValue, randomIndex;
        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }

    function showNarrationPopup() {
        narrationPopup.style.display = 'block';
    }

    async function startRecording() {
        if (!mediaRecorder) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
                if (mediaRecorder.state === "inactive") {
                    const blob = new Blob(audioChunks, { type: 'audio/wav' });
                    downloadBlob(blob, `${participantData.name}_${randomizedVideos[currentVideoIndex].split('/').pop()}_${currentVideoIndex + 1}.wav`);
                    console.log('Recorded blob:', blob);
                }
            };
        }
        audioChunks = [];
        mediaRecorder.start();
        recordingIndicator.style.display = 'block'; // Show the recording indicator
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            recordingIndicator.style.display = 'none'; // Hide the recording indicator
        }
    }

    function downloadBlob(blob, fileName) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        console.log('Downloaded file:', fileName);
    }

    // Request microphone permission on page load
    requestMicrophonePermission();

    // Initialize the client
    startSessionButton.addEventListener('click', startSession);
    replayButton.addEventListener('click', replayVideo);
    nextButton.addEventListener('click', nextVideo);
    videoPlayer.addEventListener('ended', onVideoEnd);
});

