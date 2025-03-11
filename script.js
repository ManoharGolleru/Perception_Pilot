document.addEventListener('DOMContentLoaded', () => {
  // Elements for experiment
  const subjectInput = document.getElementById('subject-id');
  const startSessionButton = document.getElementById('start-session');
  const videoPlayer = document.getElementById('video-player');
  const nextButton = document.getElementById('next-button');
  const questionText = document.getElementById('question-text');
  const pauseImage = document.getElementById('pause-image');
  const sessionSettings = document.querySelector('.session-settings');
  const videoContainer = document.querySelector('.video-container');
  const audioIndicator = document.getElementById('audio-indicator');

  // Elements for questionnaire
  const questionnaireContainer = document.getElementById('questionnaire-container');
  const questionnaireQuestion = document.getElementById('questionnaire-question');
  const questionnaireNextButton = document.getElementById('questionnaire-next-button');
  const questionnaireAudioIndicator = document.getElementById('questionnaire-audio-indicator');
  const startQuestionnaireOverlay = document.getElementById('start-questionnaire-overlay');
  const startQuestionnaireBtn = document.getElementById('start-questionnaire-btn');

  // Data arrays and state for experiment
  let noPauseVideos = [];
  let pausePairs = [];
  let questionnaireQuestions = []; // loaded from videos.json
  let mode = 'no_pause'; // 'no_pause' or 'pause'
  let currentNoPauseIndex = 0;
  let currentPauseIndex = 0;
  let isAdmin = false;
  let noPauseTimeout;
  
  // Logging variables for experiment
  let logData = []; // { subjectID, phase, event, media, question, reactionTime }
  let subjectIDValue = "";
  let pauseImageShownTime = null;
  let currentPausePair = null;
  
  // Audio recording variables (shared)
  let mediaRecorder = null;
  let audioChunks = [];
  let isRecording = false;
  
  // For zipping files for experiment and questionnaire
  let experimentZip = new JSZip();
  let questionnaireZip = new JSZip();
  
  // Questionnaire logging
  let currentQuestionnaireIndex = 0;
  let questionnaireStartTime = null;
  let questionnaireLogData = []; // { subjectID, question, reactionTime }
  
  // Preload videos and images on page load
  async function preloadVideos() {
    try {
      const response = await fetch('videos.json');
      const data = await response.json();
      data.no_pause_videos.forEach(src => {
        const vid = document.createElement('video');
        vid.src = src;
        vid.preload = "auto";
      });
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
  
  // Fetch video data and questionnaire questions from videos.json
  async function fetchVideos() {
    try {
      const response = await fetch('videos.json');
      const data = await response.json();
      noPauseVideos = data.no_pause_videos || [];
      pausePairs = data.pause_pairs || [];
      questionnaireQuestions = data.questionnaire_questions || [];
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
  
    // Log the order of no_pause videos
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
  
    // For admin: show Next button; for others hide it during no_pause phase
    if (isAdmin) {
      nextButton.style.display = 'inline-block';
      nextButton.disabled = false;
    } else {
      nextButton.style.display = 'none';
    }
  
    // Request microphone permission
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  
    // Wait 5 seconds before starting the no_pause phase
    setTimeout(startNoPausePhase, 5000);
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
  
  // Experiment: no_pause phase
  function startNoPausePhase() {
    mode = 'no_pause';
    currentNoPauseIndex = 0;
    playNoPauseVideo();
  }
  
  function playNoPauseVideo() {
    if (currentNoPauseIndex >= noPauseVideos.length) {
      startPausePhase();
      return;
    }
    videoPlayer.style.display = 'block';
    pauseImage.style.display = 'none';
    questionText.style.display = 'none';
  
    videoPlayer.src = noPauseVideos[currentNoPauseIndex];
    videoPlayer.load();
    videoPlayer.play();
  
    videoPlayer.onended = () => {
      noPauseTimeout = setTimeout(() => {
        currentNoPauseIndex++;
        playNoPauseVideo();
      }, 3000);
    };
  }
  
  // Experiment: pause phase with audio recording
  function startPausePhase() {
    mode = 'pause';
    currentPauseIndex = 0;
    nextButton.style.display = 'inline-block';
    playPausePair();
  }
  
  function playPausePair() {
    if (currentPauseIndex >= pausePairs.length) {
      alert('Session complete');
      downloadSessionZip();
      // Instead of immediately starting the questionnaire, show an overlay button
      showStartQuestionnaireOverlay();
      return;
    }
    const currentPair = pausePairs[currentPauseIndex];
    currentPausePair = currentPair;
    videoPlayer.style.display = 'block';
    pauseImage.style.display = 'none';
    questionText.style.display = 'none';
  
    videoPlayer.src = currentPair.video;
    videoPlayer.load();
    videoPlayer.play();
  
    // Start audio recording when less than 5 seconds remain
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
    videoPlayer.style.display = 'none';
    pauseImage.src = pair.image;
    pauseImage.style.display = 'block';
    questionText.innerText = pair.question || 'Please answer the question regarding the image above.';
    questionText.style.display = 'block';
    pauseImageShownTime = Date.now();
    if (!isAdmin) {
      nextButton.disabled = false;
    }
  }
  
  // Shared audio recording functions
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
  
  // Next button for experiment
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
      let audioBlob = null;
      if (isRecording) {
        audioBlob = await stopAudioRecording();
      }
      if (audioBlob) {
        const imageParts = currentPausePair.image.split("/");
        const imageFileName = imageParts[imageParts.length - 1];
        const audioFileName = `${subjectIDValue}_${imageFileName}.webm`;
        experimentZip.file(audioFileName, audioBlob);
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
      if (isAdmin) {
        clearTimeout(noPauseTimeout);
        videoPlayer.onended = null;
        videoPlayer.pause();
        currentNoPauseIndex++;
        playNoPauseVideo();
      }
    }
  });
  
  // Download experiment zip with log CSV
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
    experimentZip.file(`${subjectIDValue}_log.csv`, csvContent);
    experimentZip.generateAsync({ type: "blob" }).then(content => {
      const url = URL.createObjectURL(content);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `${subjectIDValue}_session.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    });
  }
  
  // -----------------------------
  // Usability Questionnaire Section
  // -----------------------------
  
  function showStartQuestionnaireOverlay() {
    // Show overlay with "Start Questionnaire" button
    startQuestionnaireOverlay.style.display = 'flex';
  }
  
  startQuestionnaireBtn.addEventListener('click', () => {
    // When the user clicks "Start Questionnaire", hide the overlay, re-enter full screen, and start questionnaire
    startQuestionnaireOverlay.style.display = 'none';
    // Re-enter full screen (if needed)
    enterFullscreen(document.documentElement);
    startQuestionnaire();
  });
  
  function startQuestionnaire() {
    // Hide experiment container and show questionnaire container as flex
    videoContainer.style.display = 'none';
    questionnaireContainer.style.display = 'flex';
    currentQuestionnaireIndex = 0;
    questionnaireNextButton.disabled = true;
    showQuestionnaireQuestion();
  }
  
  function showQuestionnaireQuestion() {
    if (currentQuestionnaireIndex >= questionnaireQuestions.length) {
      downloadQuestionnaireZip();
      return;
    }
    const question = questionnaireQuestions[currentQuestionnaireIndex];
    questionnaireQuestion.innerText = question;
    startQuestionnaireAudioRecording();
    questionnaireStartTime = Date.now();
    questionnaireNextButton.disabled = false;
  }
  
  // Questionnaire audio recording functions (with separate indicator)
  async function startQuestionnaireAudioRecording() {
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
      questionnaireAudioIndicator.style.display = 'block';
    } catch (err) {
      console.error("Questionnaire audio recording error:", err);
    }
  }
  
  function stopQuestionnaireAudioRecording() {
    return new Promise(resolve => {
      if (!isRecording || !mediaRecorder) {
        resolve(null);
        return;
      }
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        isRecording = false;
        questionnaireAudioIndicator.style.display = 'none';
        resolve(audioBlob);
      };
      mediaRecorder.stop();
    });
  }
  
  questionnaireNextButton.addEventListener('click', async () => {
    const reactionTime = Date.now() - questionnaireStartTime;
    questionnaireLogData.push({
      subjectID: subjectIDValue,
      question: questionnaireQuestions[currentQuestionnaireIndex],
      reactionTime: reactionTime
    });
    let audioBlob = await stopQuestionnaireAudioRecording();
    if (audioBlob) {
      const questionFileName = `Q${currentQuestionnaireIndex + 1}.webm`;
      questionnaireZip.file(`${subjectIDValue}_${questionFileName}`, audioBlob);
    }
    currentQuestionnaireIndex++;
    questionnaireNextButton.disabled = true;
    showQuestionnaireQuestion();
  });
  
  function downloadQuestionnaireZip() {
    let csvContent = "subjectID,question,reactionTime\n";
    questionnaireLogData.forEach(row => {
      const subject = row.subjectID;
      const question = row.question.replace(/,/g, ";");
      const reactionTime = row.reactionTime;
      csvContent += `${subject},${question},${reactionTime}\n`;
    });
    questionnaireZip.file(`${subjectIDValue}_questionnaire_log.csv`, csvContent);
    questionnaireZip.generateAsync({ type: "blob" }).then(content => {
      const url = URL.createObjectURL(content);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `${subjectIDValue}_questionnaire.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      questionnaireContainer.innerHTML = "<h2>Thank you for your feedback!</h2>";
    });
  }
  
  startSessionButton.addEventListener('click', startSession);
});

