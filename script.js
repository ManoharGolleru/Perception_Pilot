const images = [];
for (let i = 0; i <= 28; i++) {
    images.push(`PE/${i}.jpg`); // List of image paths
}

const carouselContainer = document.getElementById('carousel-images');
const imageNameElement = document.getElementById('image-name');
let currentIndex = 0;

function showImage() {
    carouselContainer.innerHTML = ''; // Clear previous image
    const img = document.createElement('img');
    img.src = images[currentIndex];
    img.alt = `Image ${currentIndex}`;
    carouselContainer.appendChild(img);

    // Update the image name display based on the image file name or a custom name
    imageNameElement.textContent = `Image ${currentIndex + 1}`; // Example: "Image 1"
}

function changeImage() {
    currentIndex = (currentIndex + 1) % images.length; // Move to the next image, loop back to the first after the last image
    showImage();
}

// Initial display of the first image
showImage();

// Set the time interval for changing images (in milliseconds)
const changeInterval = 5000; // Change this to however many seconds you want each image to display

// Change image at the set interval
setInterval(changeImage, changeInterval);
