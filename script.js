const images = [];
for (let i = 0; i <= 28; i++) {
    images.push({src: `PE/${i}.jpg`, name: `Image ${i}`}); // Include name for each image
}

const carouselContainer = document.getElementById('carousel-images');
const imageNameElement = document.getElementById('image-name');
const timerElement = document.getElementById('timer');

let currentIndex = 0;
let seconds = 0;

function showImage() {
    const {src, name} = images[currentIndex];
    const img = document.createElement('img');
    img.src = src;
    img.alt = name;
    img.classList.add('active');
    carouselContainer.appendChild(img);

    imageNameElement.textContent = name; // Update the image name
    seconds = 0; // Reset timer for each image
}

function changeImage() {
    carouselContainer.innerHTML = ''; // Clear previous image
    currentIndex = (currentIndex + 1) % images.length;
    showImage(); // Show next image
}

function updateTimer() {
    timerElement.textContent = `Time Displayed: ${seconds} seconds`;
    seconds++;
}

// Initially show the first image
showImage();

// Change the image every 5 seconds
setInterval(changeImage, 5000);


