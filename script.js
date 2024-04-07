const images = [
    "PE/image1.jpg",
    "PE/image2.jpg",
    // List all your images here
];

const carouselContainer = document.getElementById('carousel-images');

// Load images
images.forEach((src, index) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = `Image ${index + 1}`;
    if (index === 0) img.classList.add('active'); // Make the first image active
    carouselContainer.appendChild(img);
});

let currentIndex = 0;

function changeImage() {
    const imgs = document.querySelectorAll('.carousel-images img');
    imgs[currentIndex].classList.remove('active');
    currentIndex = (currentIndex + 1) % imgs.length;
    imgs[currentIndex].classList.add('active');
}

// Change image every 5 seconds
setInterval(changeImage, 5000);
