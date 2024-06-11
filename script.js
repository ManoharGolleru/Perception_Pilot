document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('name');
    const ageInput = document.getElementById('age');
    const genderSelect = document.getElementById('gender');
    const specialisationInput = document.getElementById('specialisation');
    const startSessionButton = document.getElementById('start-session');
    const videoPlayer = document.getElementById('video-player');
    const replayButton = document.getElementById('replay-button');
    const nextButton = document.getElementById('next-button');

    let randomizedVideos = [];
    let currentVideoIndex = 0;
    let sessionData = [];

    startSessionButton.addEventListener('click', startSession);
    replayButton.addEventListener('click', replayVideo);
    nextButton.addEventListener('click', nextVideo);
    videoPlayer.addEventListener('ended', onVideoEnd);

    async function fetchVideos() {
        const response = await fetch('videos.json');
        const data = await response.json();
        return data.videos;
    }

    async function startSession() {
        const participantData = {
            name: nameInput.value,
            age: ageInput.value,
            gender: genderSelect.value,
            specialisation: specialisationInput.value,
        };

        if (!participantData.name || !participantData.age || !participantData.gender || !participantData.specialisation) {
            alert('Please fill in all fields');
            return;
        }

        // Fetch and randomize video order
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

    function replayVideo() {
        videoPlayer.play();
        sessionData.push({
            video: randomizedVideos[currentVideoIndex],
            startTime: new Date().toISOString(),
            action: 'replay',
        });
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
    }

    function endSession() {
        // Prepare CSV data
        const csvContent = "data:text/csv;charset=utf-8,"
            + sessionData.map(e => `${e.video},${e.startTime},${e.endTime || ''},${e.action || ''}`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "session_data.csv");
        document.body.appendChild(link);
        link.click();
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
});

