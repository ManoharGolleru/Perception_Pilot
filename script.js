const images = [];
for (let i = 0; i <= 28; i++) {
    images.push(`PE/${i}.jpg`);
}

let currentIndex = 0;
let intervalId;

function showImage() {
    const carouselContainer = document.getElementById('carousel-images');
    carouselContainer.innerHTML = ''; // Clear the container
    const img = document.createElement('img');
    img.src = images[currentIndex];
    img.alt = `Image ${currentIndex}`;
    img.classList.add('active');
    carouselContainer.appendChild(img);
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
