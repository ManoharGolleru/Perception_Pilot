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

  // Data arrays and state
  let noPauseVideos = [];
  let pausePairs = [];
  let mode = 'no_pause'; // 'no_pause' or 'pause'
  let currentNoPauseIndex = 0;
  let currentPauseIndex = 0;
  let isAdmin = false;
  let noPauseTimeout;

  // Preload videos and images on page load to reduce buffering
  async function preloadVideos() {
    try {
      const response = await fetch('videos.json');
      const data = await response.json();
      // Preload no_pause videos
      data.no_pause_videos.forEach(src => {
        const vid = document.createElement('video');
        vid.src = src;
        vid.preload = "auto";
      });
      // Preload pause pairs videos and images
      data.pause_pairs.forEach(pair => {
        const vid = document.createElement('video');
        vid.src = pair.video;
        vid.preload = "auto";
        const img = new Image();
        img.src = pair.image;
      });
    } catch (error) {
      console.error("Error preloading videos:", error);
    }
  }
  preloadVideos();

  // Fetch video data when starting session
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

  // Utility: Randomize an array
  function randomizeArray(array) {
    return array.sort(() => Math.random() - 0.5);
  }

  async function startSession() {
    const subjectId = subjectInput.value.trim();
    if (!subjectId) {
      alert('Subject ID is required');
      return;
    }
    isAdmin = (subjectId.toLowerCase() === 'admin');

    // Hide session settings and enter fullscreen
    sessionSettings.style.display = 'none';
    videoContainer.classList.add('fullscreen');
    enterFullscreen(videoContainer);

    await fetchVideos();

    // Randomize no_pause videos order
    noPauseVideos = randomizeArray(noPauseVideos);

    // For admin: always show and enable the Next button.
    // For non-admin, hide it during the no_pause phase.
    if (isAdmin) {
      nextButton.style.display = 'inline-block';
      nextButton.disabled = false;
    } else {
      nextButton.style.display = 'none';
    }

    // Wait 5 seconds before starting the no_pause phase
    setTimeout(startNoPausePhase, 5000);
  }

  // Fullscreen helper function
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

  // Start the no_pause phase: play videos with a 3-second delay between them
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

    // Clear any previous onended callback
    videoPlayer.onended = null;
    // When a video ends, set a 3-second delay before moving to the next
    videoPlayer.onended = () => {
      noPauseTimeout = setTimeout(() => {
        currentNoPauseIndex++;
        playNoPauseVideo();
      }, 3000);
    };
  }

  // Start pause phase: for each video/image pair, play video then show image with question
  function startPausePhase() {
    mode = 'pause';
    currentPauseIndex = 0;
    // Always show the next button during pause phase (admin and non-admin)
    nextButton.style.display = 'inline-block';
    playPausePair();
  }

  function playPausePair() {
    if (currentPauseIndex >= pausePairs.length) {
      alert('Session complete');
      return;
    }
    const currentPair = pausePairs[currentPauseIndex];
    // Hide pause image and question text if visible
    pauseImage.style.display = 'none';
    questionText.style.display = 'none';
    // Play the video for the current pair
    videoPlayer.src = currentPair.video;
    videoPlayer.load();
    videoPlayer.play();

    // Clear any previous onended callback
    videoPlayer.onended = null;
    videoPlayer.onended = () => {
      showPauseImageAndQuestion(currentPair);
    };
  }

  function showPauseImageAndQuestion(pair) {
    pauseImage.src = pair.image;
    pauseImage.style.display = 'block';
    questionText.innerText = pair.question || 'Please answer the question regarding the image above.';
    questionText.style.display = 'block';
    // Enable next button for user to proceed in pause phase (for non-admin users)
    if (!isAdmin) {
      nextButton.disabled = false;
    }
  }

  // Next button handler:
  // - For admin: allows skipping immediately in both no_pause and pause phases.
  // - For non-admin: works only in pause phase.
  nextButton.addEventListener('click', () => {
    // If admin, allow skipping immediately in both phases.
    if (isAdmin) {
      clearTimeout(noPauseTimeout);
      videoPlayer.onended = null;
      videoPlayer.pause();

      if (mode === 'no_pause') {
        currentNoPauseIndex++;
        playNoPauseVideo();
      } else if (mode === 'pause') {
        currentPauseIndex++;
        playPausePair();
      }
    } else {
      // For non-admin users, next is only active during the pause phase.
      if (mode === 'pause') {
        nextButton.disabled = true;
        currentPauseIndex++;
        playPausePair();
      }
    }
  });

  startSessionButton.addEventListener('click', startSession);
});
