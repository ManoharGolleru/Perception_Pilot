document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const subjectInput = document.getElementById('subject-id');
  const startSessionButton = document.getElementById('start-session');
  const videoPlayer = document.getElementById('video-player');
  const nextButton = document.getElementById('next-button');
  const questionText = document.getElementById('question-text');
  const pauseImage = document.getElementById('pause-image');
  const sessionSettings = document.querySelector('.session-settings');
  const videoContainer = document.querySelector('.video-container');

  // Data arrays (populated from videos.json)
  let noPauseVideos = [];
  let pausePairs = [];
  let mode = 'no_pause'; // 'no_pause' or 'pause'
  let currentNoPauseIndex = 0;
  let currentPauseIndex = 0;

  // Fetch the videos.json file
  async function fetchVideos() {
    try {
      const response = await fetch('videos.json');
      const data = await response.json();
      noPauseVideos = data.no_pause_videos || [];
      pausePairs = data.pause_pairs || [];
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  }

  // Randomize an array
  function randomizeArray(array) {
    return array.sort(() => Math.random() - 0.5);
  }

  // When start session is clicked
  async function startSession() {
    const subjectId = subjectInput.value.trim();
    if (!subjectId) {
      alert('Subject ID is required');
      return;
    }

    // Hide settings and go fullscreen
    sessionSettings.style.display = 'none';
    videoContainer.classList.add('fullscreen');
    enterFullscreen(videoContainer);

    await fetchVideos();

    // Randomize no_pause videos order
    noPauseVideos = randomizeArray(noPauseVideos);

    // Wait 5 seconds then start the no_pause phase
    setTimeout(startNoPausePhase, 5000);
  }

  // Fullscreen function
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

  // Start no_pause phase: play randomized videos with a 3-second delay
  function startNoPausePhase() {
    mode = 'no_pause';
    currentNoPauseIndex = 0;
    playNoPauseVideo();
  }

  function playNoPauseVideo() {
    if (currentNoPauseIndex >= noPauseVideos.length) {
      // Finished no_pause videos; start pause phase
      startPausePhase();
      return;
    }
    videoPlayer.src = noPauseVideos[currentNoPauseIndex];
    videoPlayer.load();
    videoPlayer.play();

    // After video ends, wait 3 seconds then play next video
    videoPlayer.onended = () => {
      setTimeout(() => {
        currentNoPauseIndex++;
        playNoPauseVideo();
      }, 3000);
    };
  }

  // Start pause phase: for each pair, play video then show image with question
  function startPausePhase() {
    mode = 'pause';
    currentPauseIndex = 0;
    playPausePair();
  }

  function playPausePair() {
    if (currentPauseIndex >= pausePairs.length) {
      alert('Session complete');
      return;
    }
    const currentPair = pausePairs[currentPauseIndex];
    videoPlayer.src = currentPair.video;
    videoPlayer.load();
    videoPlayer.play();

    videoPlayer.onended = () => {
      showPauseImageAndQuestion(currentPair);
    };
  }

  function showPauseImageAndQuestion(pair) {
    // Display the image
    pauseImage.src = pair.image;
    pauseImage.style.display = 'block';
    // Display the question above the video
    questionText.innerText = pair.question || 'Please answer the question regarding the image above.';
    questionText.style.display = 'block';
    // Enable the Next button for the user to proceed
    nextButton.disabled = false;
  }

  // Next button for pause phase
  nextButton.addEventListener('click', () => {
    if (mode === 'pause') {
      // Hide the pause image and question
      pauseImage.style.display = 'none';
      questionText.style.display = 'none';
      nextButton.disabled = true;
      currentPauseIndex++;
      playPausePair();
    }
  });

  startSessionButton.addEventListener('click', startSession);
});

