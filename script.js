document.addEventListener('DOMContentLoaded', () => {
    const CLIENT_ID = '988575999570-n3nknj4743tpl3a1augeepmdicp28imu.apps.googleusercontent.com'; // Replace with your client ID
    const API_KEY = 'AIzaSyBX-oPHu-Ky9hOl3H1It0_KTlvIFgsuC2E'; // Replace with your API key
    const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
    const SCOPES = 'https://www.googleapis.com/auth/drive.file';

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

    function initClient() {
        gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
        }).then(() => {
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
            updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        });
    }

    function updateSigninStatus(isSignedIn) {
        if (isSignedIn) {
            startSessionButton.addEventListener('click', startSession);
            replayButton.addEventListener('click', replayVideo);
            nextButton.addEventListener('click', nextVideo);
            videoPlayer.addEventListener('ended', onVideoEnd);
        } else {
            gapi.auth2.getAuthInstance().signIn();
        }
    }

    function startSession() {
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

        // Fetch and randomize video order
        fetchVideos().then(videoClips => {
            randomizedVideos = shuffleArray(videoClips);
            currentVideoIndex = 0;
            loadVideo(randomizedVideos[currentVideoIndex]);
        });
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
                    uploadToDrive(blob);
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

    function uploadToDrive(blob) {
        const fileName = `${participantData.name}_${randomizedVideos[currentVideoIndex].split('/').pop()}_${currentVideoIndex + 1}.webm`;
        gapi.load('client:auth2', () => {
            gapi.client.init({
                apiKey: API_KEY,
                clientId: CLIENT_ID,
                discoveryDocs: DISCOVERY_DOCS,
                scope: SCOPES
            }).then(() => {
                const fileMetadata = {
                    'name': fileName,
                    'mimeType': 'audio/webm'
                };

                const accessToken = gapi.auth.getToken().access_token;
                const form = new FormData();
                form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
                form.append('file', blob);

                fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                    method: 'POST',
                    headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
                    body: form
                }).then(response => response.json())
                  .then(data => console.log(data))
                  .catch(error => console.error(error));
            });
        });
    }

    gapi.load('client:auth2', initClient);
});
