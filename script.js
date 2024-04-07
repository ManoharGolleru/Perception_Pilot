const images = [];
for (let i = 0; i <= 28; i++) {
    images.push(`PE/${i}.jpg`); // List of image paths
}

const carouselContainer = document.getElementById('carousel-images');
const imageNameElement = document.getElementById('image-name');
const intervalInput = document.getElementById('interval');
const setIntervalButton = document.getElementById('set-interval');
let currentIndex = 0;
let changeInterval = 5000; // Default interval
let intervalId;

function showImage() {
    carouselContainer.innerHTML = ''; // Clear previous image
    const img = document.createElement('img');
    img.src = images[currentIndex];
    img.alt = `Image ${currentIndex}`;
    carouselContainer.appendChild(img);

    imageNameElement.textContent = `Image ${currentIndex + 1}`; // Example: "Image 1"
}

function changeImage() {
    currentIndex = (currentIndex + 1) % images.length;
    showImage();
}

function startCarousel() {
    if (intervalId) clearInterval(intervalId); // Clear existing interval if any
    intervalId = setInterval(changeImage, changeInterval);
}

// Initial display of the first image
showImage();
startCarousel(); // Start the carousel with the default interval

// Update interval when the user clicks the "Set Interval" button
setIntervalButton.addEventListener('click', () => {
    changeInterval = parseInt(intervalInput.value) * 1000; // Convert seconds to milliseconds
    startCarousel(); // Restart the carousel with the new interval
});
