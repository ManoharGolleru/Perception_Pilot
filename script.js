const images = [];
for (let i = 0; i <= 28; i++) {
    images.push(`PE/${i}.jpg`);
}

let currentIndex = 0;
let intervalId;

function showImage() {
    const carouselContainer = document.getElementById('carousel-images');
    const imageNameElement = document.getElementById('image-name');
    carouselContainer.innerHTML = ''; // Clear the container

    const img = document.createElement('img');
    img.src = images[currentIndex];
    img.alt = `Image ${currentIndex}`;
    carouselContainer.appendChild(img);

    imageNameElement.textContent = `Image ${currentIndex}`;
}

function changeImage() {
    currentIndex = (currentIndex + 1) % images.length;
    showImage();
}

function startCarousel(interval) {
    clearInterval(intervalId); // Clear the existing interval
    intervalId = setInterval(changeImage, interval * 1000); // Set a new interval
}

document.getElementById('set-interval').addEventListener('click', () => {
    const interval = document.getElementById('interval').value || 5; // Default to 5 seconds
    startCarousel(interval);
});

// Start the carousel with a default interval of 5 seconds on initial load
window.onload = () => startCarousel(5);
