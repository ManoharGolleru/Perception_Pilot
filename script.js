const images = [];

// Generate image filenames from 0.jpg to 28.jpg
for (let i = 0; i <= 28; i++) {
    images.push(`PE/${i}.jpg`);
}

const carouselContainer = document.getElementById('carousel-images');

// Load images
images.forEach((src, index) => {
    const img = document.createElement('img');
    img.src = src; // Set the source to the image file
    img.alt = `Image ${index}`; // Set a descriptive alt text
    if (index === 0) img.classList.add('active'); // Make the first image active
    carouselContainer.appendChild(img); // Add the image to the carousel container
});

let currentIndex = 0;

function changeImage() {
    // Remove the 'active' class from the current image
    carouselContainer.children[currentIndex].classList.remove('active');

    // Update the index to point to the next image, wrapping around if necessary
    currentIndex = (currentIndex + 1) % images.length;

    // Add the 'active' class to the new current image
    carouselContainer.children[currentIndex].classList.add('active');
}

// Change the image every 5 seconds
setInterval(changeImage, 5000);
