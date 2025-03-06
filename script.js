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
  const audioIndicator = document.getElementById('audio-indicator');

  // Data arrays and state
  let noPauseVideos = [];
  let pausePairs = [];
  let mode = 'no_pause'; // 'no_pause' or 'pause'
  let currentNoPauseIndex = 0;
  let currentPauseIndex = 0;
  let isAdmin = false;
  let noPauseTimeout;
  
  // Logging variables
  let logData = []; // Each entry: { subjectID, phase, event, media, question, reactionTime }
  let subjectIDValue = "";
  let pauseImageShownTime = null;
  let currentPausePair = null;
  
  // Audio recording variables
  let mediaRecorder = null;
  let audioChunks = [];
  let isRecording = false;
  
  // For zipping audio files and log CSV
  let zip = new JSZip();

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
    subjectIDValue = subjectId;
    isAdmin = (subjectId.toLowerCase() === 'admin');

    // Hide session settings and enter fullscreen
    sessionSettings.style.display = 'none';
    videoContainer.classList.add('fullscreen');
    enterFullscreen(videoContainer);

    await fetchVideos();

    // Randomize no_pause videos order
    noPauseVideos = randomizeArray(noPauseVideos);

    // Log the order of no_pause videos as they will be presented
    noPauseVideos.forEach(videoSrc => {
      logData.push({
        subjectID: subjectIDValue,
        phase: "no_pause",
        event: "video_played",
        media: videoSrc,
        question: "",
        reactionTime: ""
      });
    });

    // For admin: always show and enable the Next button.
    // For non-admin, hide it during the no_pause phase.
    if (isAdmin) {
      nextButton.style.display = 'inline-block';
      nextButton.disabled = false;
    } else {
      nextButton.style.display = 'none';
    }

    // Request microphone permission (if needed)
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error("Microphone access denied:", err);
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
    // Ensure the video element is visible and hide the pause image/question
    videoPlayer.style.display = 'block';
    pauseImage.style.display = 'none';
    questionText.style.display = 'none';

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
    // Always show the Next button during pause phase (for admin and non-admin)
    nextButton.style.display = 'inline-block';
    playPausePair();
  }

  function playPausePair() {
    if (currentPauseIndex >= pausePairs.length) {
      alert('Session complete');
      downloadSessionZip();
      return;
    }
    const currentPair = pausePairs[currentPauseIndex];
    currentPausePair = currentPair;
    // Ensure the video element is visible and hide the image and question
    videoPlayer.style.display = 'block';
    pauseImage.style.display = 'none';
    questionText.style.display = 'none';

    videoPlayer.src = currentPair.video;
    videoPlayer.load();
    videoPlayer.play();

    // Setup event listener: start audio recording when less than 5 seconds remain
    let recordingStarted = false;
    videoPlayer.onloadedmetadata = () => {
      videoPlayer.addEventListener('timeupdate', function recordTrigger() {
        if (!recordingStarted && (videoPlayer.duration - videoPlayer.currentTime <= 5)) {
          recordingStarted = true;
          startAudioRecording();
          videoPlayer.removeEventListener('timeupdate', recordTrigger);
        }
      });
    };

    videoPlayer.onended = () => {
      showPauseImageAndQuestion(currentPair);
    };
  }

  function showPauseImageAndQuestion(pair) {
    // Hide the video element so its paused frame is not visible
    videoPlayer.style.display = 'none';
    // Display the image and question
    pauseImage.src = pair.image;
    pauseImage.style.display = 'block';
    questionText.innerText = pair.question || 'Please answer the question regarding the image above.';
    questionText.style.display = 'block';
    // Record time for reaction time calculation
    pauseImageShownTime = Date.now();
    // For non-admin users, enable the Next button
    if (!isAdmin) {
      nextButton.disabled = false;
    }
  }

  // Audio recording functions
  async function startAudioRecording() {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      mediaRecorder.start();
      isRecording = true;
      // Show audio indicator
      audioIndicator.style.display = 'block';
    } catch (err) {
      console.error("Audio recording error:", err);
    }
  }

  function stopAudioRecording() {
    return new Promise(resolve => {
      if (!isRecording || !mediaRecorder) {
        resolve(null);
        return;
      }
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        isRecording = false;
        audioIndicator.style.display = 'none';
        resolve(audioBlob);
      };
      mediaRecorder.stop();
    });
  }

  // Next button handler:
  // For pause phase, when Next is clicked, record reaction time, stop audio recording,
  // and add the audio file to the zip (named with subjectID and image name).
  nextButton.addEventListener('click', async () => {
    if (mode === 'pause' && pauseImageShownTime !== null) {
      const reactionTime = Date.now() - pauseImageShownTime;
      logData.push({
        subjectID: subjectIDValue,
        phase: "pause",
        event: "image_shown",
        media: currentPausePair.image,
        question: currentPausePair.question,
        reactionTime: reactionTime
      });
      pauseImageShownTime = null;
    }
    if (mode === 'pause') {
      // If audio recording is active, stop it and obtain blob
      let audioBlob = null;
      if (isRecording) {
        audioBlob = await stopAudioRecording();
      }
      if (audioBlob) {
        // Extract image file name (last part of URL)
        const imageParts = currentPausePair.image.split("/");
        const imageFileName = imageParts[imageParts.length - 1];
        const audioFileName = `${subjectIDValue}_${imageFileName}.webm`;
        zip.file(audioFileName, audioBlob);
      }
      if (isAdmin) {
        currentPauseIndex++;
        playPausePair();
      } else {
        nextButton.disabled = true;
        currentPauseIndex++;
        playPausePair();
      }
    } else if (mode === 'no_pause') {
      // Admin skipping in no_pause phase
      if (isAdmin) {
        clearTimeout(noPauseTimeout);
        videoPlayer.onended = null;
        videoPlayer.pause();
        currentNoPauseIndex++;
        playNoPauseVideo();
      }
    }
  });

  // At session end, add the log CSV to the zip and download the zip silently
  function downloadSessionZip() {
    let csvContent = "subjectID,phase,event,media,question,reactionTime\n";
    logData.forEach(row => {
      const subject = row.subjectID;
      const phase = row.phase;
      const event = row.event;
      const media = row.media;
      const question = row.question.replace(/,/g, ";");
      const reactionTime = row.reactionTime;
      csvContent += `${subject},${phase},${event},${media},${question},${reactionTime}\n`;
    });
    zip.file(`${subjectIDValue}_log.csv`, csvContent);
    zip.generateAsync({ type: "blob" }).then(content => {
      const url = URL.createObjectURL(content);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `${subjectIDValue}_session.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    });
  }

  startSessionButton.addEventListener('click', startSession);
});


