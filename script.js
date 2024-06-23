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
    const narrationPopup = document.getElementById('narration-popup');
    const countdownElement = document.getElementById('countdown');
    const recordingIndicator = document.getElementById('recording-indicator');

    const startTestRecordingButton = document.getElementById('start-test-recording');
    const stopTestRecordingButton = document.getElementById('stop-test-recording');
    const playTestRecordingButton = document.getElementById('play-test-recording');
    const testAudio = document.getElementById('test-audio');

    let mediaRecorder;
    let testMediaRecorder;
    let audioChunks = [];
    let testAudioChunks = [];
    let randomizedVideos = [];
    let currentVideoIndex = 0;
    let sessionData = [];
    let participantData = {};
    let recordedBlobs = [];

    async function fetchVideos() {
        try {
            const response = await fetch('videos.json');
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

        sessionSettings.style.display = 'none';
        videoContainer.classList.add('fullscreen');
        enterFullscreen(videoContainer);

        const videoClips = await fetchVideos();
        randomizedVideos = shuffleArray(videoClips);
        currentVideoIndex = 0;

        loadVideo(randomizedVideos[currentVideoIndex]);
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

    function loadVideo(videoPath) {
        videoPlayer.src = videoPath;
        videoPlayer.load();
        videoPlayer.muted = true;
    }

    async function replayVideo() {
        showNarrationPopup();
        sessionData.push({
            video: randomizedVideos[currentVideoIndex],
            startTime: new Date().toISOString(),
            action: 'replay',
        });

        videoPlayer.pause();
        videoPlayer.currentTime = 0;

        countdownElement.style.display = 'block';
        let countdown = 5;
        countdownElement.textContent = countdown;

        startRecording();

        const countdownInterval = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            if (countdown === 0) {
                clearInterval(countdownInterval);
                countdownElement.style.display = 'none';
                narrationPopup.style.display = 'none';
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

    async function endSession() {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Video,Start Time,End Time,Action\n"
            + sessionData.map(e => `${e.video},${e.startTime},${e.endTime || ''},${e.action || ''}`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "session_data.csv");
        document.body.appendChild(link);
        link.click();

        const zip = new JSZip();
        recordedBlobs.forEach(file => {
            zip.file(file.name, file.blob);
        });

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const zipLink = document.createElement("a");
        zipLink.href = URL.createObjectURL(zipBlob);
        zipLink.download = "recordings.zip";
        document.body.appendChild(zipLink);
        zipLink.click();
        URL.revokeObjectURL(zipLink.href);

        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
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
                    recordedBlobs.push({ name: `${participantData.name}_${randomizedVideos[currentVideoIndex].split('/').pop()}_${currentVideoIndex + 1}.wav`, blob });
                    console.log('Recorded blob:', blob);
                }
            };
        }
        audioChunks = [];
        mediaRecorder.start();
        recordingIndicator.style.display = 'block';
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            recordingIndicator.style.display = 'none';
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

    async function startTestRecording() {
        if (!testMediaRecorder) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            testMediaRecorder = new MediaRecorder(stream);
            testMediaRecorder.ondataavailable = event => {
                testAudioChunks.push(event.data);
                if (testMediaRecorder.state === "inactive") {
                    const blob = new Blob(testAudioChunks, { type: 'audio/wav' });
                    testAudio.src = URL.createObjectURL(blob);
                    testAudio.play();
                    console.log('Test recorded blob:', blob);
                }
            };
        }
        testAudioChunks = [];
        testMediaRecorder.start();
        startTestRecordingButton.disabled = true;
        stopTestRecordingButton.disabled = false;
        playTestRecordingButton.disabled = true;
    }

    function stopTestRecording() {
        if (testMediaRecorder && testMediaRecorder.state === "recording") {
            testMediaRecorder.stop();
            startTestRecordingButton.disabled = false;
            stopTestRecordingButton.disabled = true;
            playTestRecordingButton.disabled = false;
        }
    }

    startTestRecordingButton.addEventListener('click', startTestRecording);
    stopTestRecordingButton.addEventListener('click', stopTestRecording);

    requestMicrophonePermission();
    startSessionButton.addEventListener('click', startSession);
    replayButton.addEventListener('click', replayVideo);
    nextButton.addEventListener('click', nextVideo);
    videoPlayer.addEventListener('ended', onVideoEnd);
});

