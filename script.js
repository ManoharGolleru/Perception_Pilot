document.addEventListener('DOMContentLoaded', () => {
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

    const startTestRecordingButton = document.getElementById('start-test-recording');
    const stopTestRecordingButton = document.getElementById('stop-test-recording');
    const testAudioElement = document.getElementById('test-audio');

    let mediaRecorder;
    let audioChunks = [];
    let randomizedVideos = [];
    let currentVideoIndex = 0;
    let sessionData = [];
    let participantData = {};
    let testMediaRecorder;
    let testAudioChunks = [];
    let recordedBlobs = [];
    let recordingVideoName = '';
    let recordingTimeout;

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

        const videoClips = await fetchVideos();
        randomizedVideos = shuffleArray(videoClips);
        currentVideoIndex = 0;

        // Preload first video
        loadVideo(randomizedVideos[currentVideoIndex]);
    }

    function enterFullscreen(element) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) { /* Firefox */
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) { /* IE/Edge */
            element.msRequestFullscreen();
        }
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

        // Reset the video to the start
        videoPlayer.pause();
        videoPlayer.currentTime = 0;

        countdownElement.style.display = 'block';
        let countdown = 5;
        countdownElement.textContent = countdown;

        recordingVideoName = randomizedVideos[currentVideoIndex].split('/').pop(); // Track the current video name

        startRecording(); // Start recording when the countdown starts

        const countdownInterval = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            if (countdown === 0) {
                clearInterval(countdownInterval);
                countdownElement.style.display = 'none';
                narrationPopup.style.display = 'none';
                videoPlayer.play();

                // Stop recording after 40 seconds
                recordingTimeout = setTimeout(() => {
                    stopRecording();
                }, 40000);
            }
        }, 1000);
    }

    function nextVideo() {
        clearTimeout(recordingTimeout); // Clear the timeout to stop recording early if next is pressed
        stopRecording();

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
    }

    function endSession() {
        // Prepare CSV data with headers
        const csvContent = "data:text/csv;charset=utf-8,"
            + `Name,Age,Gender,Specialisation,Experience\n${participantData.name},${participantData.age},${participantData.gender},${participantData.specialisation},${participantData.experience}\n\n`
            + "Video,Start Time,End Time,Action\n"
            + sessionData.map(e => `${e.video},${e.startTime},${e.endTime || ''},${e.action || ''}`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "session_data.csv");
        document.body.appendChild(link);
        link.click();

        // Download all recordings as a single zip file
        downloadAllRecordings();

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

    function downloadAllRecordings() {
        const zip = new JSZip();
        recordedBlobs.forEach((blob, index) => {
            const fileName = `${participantData.name}_${blob.videoName}_${index + 1}.wav`;
            zip.file(fileName, blob.blob);
        });

        zip.generateAsync({ type: 'blob' }).then(content => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'recordings.zip';
            link.click();
        });
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
        setTimeout(() => {
            narrationPopup.style.display = 'none';
        }, 2000);
    }

    async function startRecording() {
        if (!mediaRecorder) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
                if (mediaRecorder.state === "inactive") {
                    const blob = new Blob(audioChunks, { type: 'audio/wav' });
                    recordedBlobs.push({ blob: blob, videoName: recordingVideoName }); // Store blob and video name for later download
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

    // Microphone test functions
    async function startTestRecording() {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        testMediaRecorder = new MediaRecorder(stream);
        testAudioChunks = [];

        testMediaRecorder.ondataavailable = event => {
            testAudioChunks.push(event.data);
        };

        testMediaRecorder.onstop = () => {
            const testBlob = new Blob(testAudioChunks, { type: 'audio/wav' });
            const testUrl = URL.createObjectURL(testBlob);
            testAudioElement.src = testUrl;
        };

        testMediaRecorder.start();
        startTestRecordingButton.disabled = true;
        stopTestRecordingButton.disabled = false;
    }

    function stopTestRecording() {
        if (testMediaRecorder && testMediaRecorder.state === "recording") {
            testMediaRecorder.stop();
            startTestRecordingButton.disabled = false;
            stopTestRecordingButton.disabled = true;
        }
    }

    // Initialize the microphone test buttons
    startTestRecordingButton.addEventListener('click', startTestRecording);
    stopTestRecordingButton.addEventListener('click', stopTestRecording);

    // Request microphone permission on page load
    requestMicrophonePermission();

    // Initialize the session controls
    startSessionButton.addEventListener('click', startSession);
    replayButton.addEventListener('click', replayVideo);
    nextButton.addEventListener('click', nextVideo);
    videoPlayer.addEventListener('ended', onVideoEnd);
});

