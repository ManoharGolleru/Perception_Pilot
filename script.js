const images = [];
for (let i = 0; i <= 28; i++) {
    images.push(`PE/${i}.jpg`);
}

let currentIndex = 0;
let intervalId;

function preloadImage(index) {
    const img = new Image(); // Create a new Image object
    img.src = images[index];
}

function showImage() {
    const carouselContainer = document.getElementById('carousel-images');
    carouselContainer.innerHTML = ''; // Clear the container

    const img = document.createElement('img');
    img.src = images[currentIndex];
    img.alt = `Image ${currentIndex}`;
    carouselContainer.appendChild(img);

    // Preload the next image
    const nextIndex = (currentIndex + 1) % images.length;
    preloadImage(nextIndex);
}

function changeImage() {
    currentIndex = (currentIndex + 1) % images.length;
    showImage();
}

function startCarousel(interval) {
    clearInterval(intervalId); // Clear the existing interval
    showImage(); // Show the first image immediately
    intervalId = setInterval(changeImage, interval * 1000); // Set a new interval
}

document.getElementById('start-session').addEventListener('click', () => {
    const interval = document.getElementById('interval').value || 5; // Default to 5 seconds
    startCarousel(interval);
});

// Preload the first image on initial load
preloadImage(0);
