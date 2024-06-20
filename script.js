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
    }

    async function replayVideo() {
        videoPlayer.play();
        showNarrationPopup();
        sessionData.push({
            video: randomizedVideos[currentVideoIndex],
            startTime: new Date().toISOString(),
            action: 'replay',
        });
        startRecording();
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
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
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
                    const blob = new Blob(audioChunks, { type: 'audio/webm' });
                    downloadBlob(blob, `${participantData.name}_${randomizedVideos[currentVideoIndex].split('/').pop()}_${currentVideoIndex + 1}.webm`);
                    console.log('Recorded blob:', blob);
                }
            };
        }
        audioChunks = [];
        mediaRecorder.start();
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
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

    // Initialize the client
    startSessionButton.addEventListener('click', startSession);
    replayButton.addEventListener('click', replayVideo);
    nextButton.addEventListener('click', nextVideo);
    videoPlayer.addEventListener('ended', onVideoEnd);
});
