const images = [];
for (let i = 1; i <= 20; i++) {
    images.push(`Collage/${i}.png`);
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
    img.classList.add('active');
    carouselContainer.appendChild(img);

    // Preload the next image
    const nextIndex = (currentIndex + 1) % images.length;
    preloadImage(nextIndex);
}

function changeImage() {
    currentIndex = (currentIndex + 1) % images.length;
    showImage();
}

document.getElementById('start-session').addEventListener('click', () => {
    const interval = document.getElementById('interval').value || 5; // Default to 5 seconds
    clearInterval(intervalId); // Clear any existing interval
    intervalId = setInterval(changeImage, interval * 1000); // Start a new interval
    showImage(); // Show the first image immediately
});

// Preload the first image on initial load
preloadImage(0);
