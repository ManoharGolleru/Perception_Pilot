document.addEventListener('DOMContentLoaded', () => {
    const SERVICE_ACCOUNT_KEY = {
          "type": "service_account",
          "project_id": "coherent-sphere-426917-u4",
          "private_key_id": "39e2dec416cd0e51391ffe389ea1e20c4474f49d",
          "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCvDDOQHb6hWvtU\nxKML7t0U4BCDMy1V74N3dUyOvn341HrhAHzctz960pn9OxBy6Gy+SfLX3NdxTCeH\nhnrvzXYxALFNjT94jfhtiXMzIm6XxmwqzbCBztFSVOIZk0JN59SzFZnKhqapo8X4\nkuq4llorDvGHUvRVoN22r+0V8yGdPxXbS1ZdwiUcKGBqD4OzdwUHm3zebIrLKHpC\nhpqZ4J3hhmUIFSsfzJWw/Su0lu+yhb9wpzegsFlZRZvPS+w0r5bATiNUeoQSAhWH\nwIY6TIi0aWTwyWx8zgvaLrYOyxNyD52OYa2AArURv+8GNWgtOqwhqL2/u49ReRS7\n9l2zCjVpAgMBAAECggEAAmOhvolRZUVnIciPSyXm+ZZ3UzsbFs2uly5QLbCW6pMH\n3FNT4PVVVflS5bxtJIxck5pRyLV4cVDvRy/ENMqynseaI+tWHvCdH+2c12lUZhjs\nuAbXrmXiwINtFJlIceTEp+8XCscctjsIhDSJJJzUvTq2fDjbIeIQtKIhE8geQNWq\nRU7TZYpE8YIlReVduuwQg3DAmLtGQ2e+xX0wova7hcc2SbXLrsvX6MNSrt+Qmtty\n2Tp8UEuQY0CbIyTSst7vxXiYnw6K0p01kFfq1C4qkp6OsSGG44vwk/fyadEGjxr7\nrsTovVMzniibkzcP8lAvlus3TIMGE3JakIjU60J4gwKBgQDv2lQKUec5eIAqpofb\n90E3vO7AYaYQTVQxO//Y3ibuBPhWYOjYd1AEs9Iss7aEOgGq0uNS65hioj7wRME4\nSTZblpLfWqY7zJWCONR/DfrpG1WqRIV0BpuJZ4+kTma3J0WWul4cPZZY+ecIiUwa\nI7EnbJX/GFwUIKJfya3HwnqqhwKBgQC61QH4hCbo10odbOqkXImILLEEwX+lp8EP\nSl2CTCW6lzqc6dUQhWufRKZcY698qie5abm4skRFeH6d4B//a10AFyq2H49YHDQA\nVTlAPaKLMkvgiiVXmZdbaJjzMlCBdbTEEqn8g9XWn7l+yyVb9Ajm/BrWxZ39Ri4i\nu8saa8xsjwKBgHBGjUx/ZnOamrRcXAB1z4ud300i6K9840pgwbTs2OBWZ0FX/+dE\ngqqQ2nOedHOVC67BJTRtoFmbhUbHiIMmklFxPLNdJa+cZugcXixTiP6RkxovFSFo\n7mn1lmHdaWuW8JZMCz3A/p4L7UArtPoPdx/zToupBYFOfXPFXpnBydYFAoGAAxWl\nNK8p3UpApP+5WAFXG/Jw8b0oGFoOq+v0Y0RSkyQQCasqo10wi66ceIYEzbAZe8wt\nDsmSqvr0TDL5FER3gprfT6ZxvWipyx+dFFxwJJAuBIUDXNDiWNX/QHSiM6D33QzZ\n1Ztvml2EuH0uHriGtRmQb99PXnEcLeKf1c3V0C0CgYBj47wtWeQeG3YtdK5ODGEP\nqEXVHJoiJ+0xq9pGj2dB/00djcOfiRzwM+SCeEs35eZ4+DyHroyTeT3Wq0TsvNk3\nYJWAJoX4UltUmuXWXIq3BzFAkTiVmq0i5xiC+ct24Hp4kv92y8zEVF7yvWqrhmYD\nrP99lfuFGw0FtWUhYNeCTQ==\n-----END PRIVATE KEY-----\n",
          "client_email": "pilot-644@coherent-sphere-426917-u4.iam.gserviceaccount.com",
          "client_id": "116631440961368824075",
          "auth_uri": "https://accounts.google.com/o/oauth2/auth",
          "token_uri": "https://oauth2.googleapis.com/token",
          "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
          "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/pilot-644%40coherent-sphere-426917-u4.iam.gserviceaccount.com",
          "universe_domain": "googleapis.com" };
   

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

    function getAccessToken() {
        const header = {
            alg: "RS256",
            typ: "JWT"
        };

        const now = Math.floor(Date.now() / 1000);
        const claimSet = {
            iss: SERVICE_ACCOUNT_KEY.client_email,
            scope: "https://www.googleapis.com/auth/drive.file",
            aud: "https://oauth2.googleapis.com/token",
            exp: now + 3600,
            iat: now
        };

        const privateKey = SERVICE_ACCOUNT_KEY.private_key;
        const jwt = KJUR.jws.JWS.sign(
            "RS256",
            JSON.stringify(header),
            JSON.stringify(claimSet),
            privateKey
        );

        return fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
        })
        .then(response => response.json())
        .then(data => data.access_token);
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

    async function uploadToDrive(blob) {
        const fileName = `${participantData.name}_${randomizedVideos[currentVideoIndex].split('/').pop()}_${currentVideoIndex + 1}.webm`;

        const accessToken = await getAccessToken();
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify({
            name: fileName,
            mimeType: 'audio/webm'
        })], { type: 'application/json' }));
        form.append('file', blob);

        fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({ 'Authorization': `Bearer ${accessToken}` }),
            body: form
        }).then(response => response.json())
          .then(data => console.log(data))
          .catch(error => console.error(error));
    }

    // Initialize the client
    startSessionButton.addEventListener('click', startSession);
    replayButton.addEventListener('click', replayVideo);
    nextButton.addEventListener('click', nextVideo);
    videoPlayer.addEventListener('ended', onVideoEnd);
});
