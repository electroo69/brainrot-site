// Meme images list
const memeImages = [
    'assets/IMG_4304.PNG',
    'assets/IMG_4466.PNG',
    'assets/IMG_4467.PNG',
    'assets/IMG_4536.PNG',
    'assets/IMG_4548.PNG',
    'assets/IMG_4762.PNG',
    'assets/IMG_4837.PNG',
    'assets/IMG_4877.PNG',
    'assets/IMG_5030.PNG',
    'assets/IMG_5130.PNG',
    'assets/IMG_5134.PNG',
    'assets/IMG_5152.JPG',
    'assets/IMG_5248.PNG',
    'assets/IMG_5289.PNG',
    'assets/IMG_5307.PNG',
    'assets/IMG_5309.JPG',
    'assets/IMG_5328.PNG',
    'assets/IMG_5336.PNG',
    'assets/IMG_5338.PNG'
];

// State variables
let brainrotActive = false;
let animationFrameId = null;
let memesList = [];

// DOM Elements
const watchNowBtn = document.getElementById('btn-watch-now');
const searchBar = document.getElementById('search-bar');
const searchTrigger = document.getElementById('search-trigger');
const mainHeader = document.getElementById('main-header');
const video = document.getElementById('greenscreen-video');
const canvas = document.getElementById('brainrot-canvas');
const ctx = canvas.getContext('2d');
const memeContainer = document.getElementById('meme-container');

// Offscreen Canvas for high-performance chroma-key processing
const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d');

// 1. Netflix Header Scroll Effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        mainHeader.classList.add('scrolled');
    } else {
        mainHeader.classList.remove('scrolled');
    }
});

// 2. Setup Canvas Resize
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// 3. Audio Player Engine (overlapped & max volume)
function playBrainrotAudio() {
    const audioFilePath = 'assets/main-audio.mp3';
    
    // Play audio 5 times with slight delays to create echo/chaos
    const delays = [0, 100, 200, 300, 400];
    
    delays.forEach((delay) => {
        setTimeout(() => {
            const audio = new Audio(audioFilePath);
            audio.volume = 1.0; // max volume
            audio.loop = true;
            
            // Try playing audio (handles browser restrictions if any)
            audio.play().catch(e => {
                console.warn("Audio autoplay prevented by browser. Retrying on interaction...", e);
            });
            
            // Extra: increase volume to max via web audio api if supported for gain boost
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioCtx.createMediaElementSource(audio);
                const gainNode = audioCtx.createGain();
                
                // Boost volume even higher than standard 1.0 (earrape/brainrot vibe)
                gainNode.gain.value = 2.5; 
                
                source.connect(gainNode);
                gainNode.connect(audioCtx.destination);
            } catch (err) {
                console.log("Web Audio volume boost not initialized (already playing at full system volume):", err);
            }
        }, delay);
    });
}

// 4. Chroma Key Canvas Renderer Loop
function processChromaKey() {
    if (!brainrotActive || video.paused || video.ended) return;

    // Center and cover video on main canvas
    const canvasRatio = canvas.width / canvas.height;
    const videoRatio = video.videoWidth / video.videoHeight;
    
    let drawWidth, drawHeight, x, y;
    if (canvasRatio > videoRatio) {
        drawWidth = canvas.width;
        drawHeight = canvas.width / videoRatio;
        x = 0;
        y = (canvas.height - drawHeight) / 2;
    } else {
        drawHeight = canvas.height;
        drawWidth = canvas.height * videoRatio;
        x = (canvas.width - drawWidth) / 2;
        y = 0;
    }

    // Set offscreen canvas to a downscaled size for high performance
    const targetWidth = 480; 
    const scaleFactor = targetWidth / video.videoWidth;
    offscreenCanvas.width = targetWidth;
    offscreenCanvas.height = video.videoHeight * scaleFactor;

    // Draw current frame to offscreen canvas
    offscreenCtx.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

    // Get pixel data
    const frame = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    const length = frame.data.length / 4;

    for (let i = 0; i < length; i++) {
        const r = frame.data[i * 4 + 0];
        const g = frame.data[i * 4 + 1];
        const b = frame.data[i * 4 + 2];

        // Green Screen detection: Green is dominant and bright
        if (g > 65 && g > r * 1.12 && g > b * 1.12) {
            frame.data[i * 4 + 3] = 0; // Transparent
        }
    }

    // Write transparent pixels back to offscreen canvas
    offscreenCtx.putImageData(frame, 0, 0);

    // Clear main screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw transparent subject to main screen
    ctx.drawImage(offscreenCanvas, x, y, drawWidth, drawHeight);

    requestAnimationFrame(processChromaKey);
}

// 5. Meme Chaos Physics Engine
class FloatingMeme {
    constructor(src) {
        this.element = document.createElement('img');
        this.element.src = src;
        this.element.classList.add('flying-meme');
        
        // Random dimensions
        const baseWidth = Math.floor(Math.random() * 100) + 120; // 120px to 220px
        this.width = baseWidth;
        this.element.style.width = `${this.width}px`;
        
        memeContainer.appendChild(this.element);

        // Physics parameters
        this.x = Math.random() * (window.innerWidth - this.width);
        this.y = Math.random() * (window.innerHeight - 150);
        
        // Speed vectors (Fast and random!)
        this.vx = (Math.random() - 0.5) * 20 - 10; // -20 to +20
        this.vy = (Math.random() - 0.5) * 20 - 10;
        
        // Ensure velocity isn't zero
        if (Math.abs(this.vx) < 5) this.vx = this.vx < 0 ? -7 : 7;
        if (Math.abs(this.vy) < 5) this.vy = this.vy < 0 ? -7 : 7;

        // Rotation & scaling
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 15; // -7.5 to +7.5 deg/frame
        
        this.scale = Math.random() * 0.8 + 0.6; // 0.6 to 1.4
        this.scaleSpeed = (Math.random() - 0.5) * 0.05; // pulsation
        
        this.height = this.element.offsetHeight || 150; // estimate if not loaded yet
    }

    update() {
        // Apply velocity
        this.x += this.vx;
        this.y += this.vy;
        
        // Apply rotation
        this.rotation += this.rotationSpeed;
        
        // Pulsate scale
        this.scale += this.scaleSpeed;
        if (this.scale > 1.8 || this.scale < 0.4) {
            this.scaleSpeed = -this.scaleSpeed;
        }

        // Keep height updated
        this.height = this.element.offsetHeight || 150;

        // Wall Collision (Bounce off boundaries)
        if (this.x <= 0) {
            this.x = 0;
            this.vx = -this.vx * 1.05; // Accelerate on bounce
            this.randomizeMeme();
        } else if (this.x + this.width * this.scale >= window.innerWidth) {
            this.x = window.innerWidth - this.width * this.scale;
            this.vx = -this.vx * 1.05;
            this.randomizeMeme();
        }

        if (this.y <= 0) {
            this.y = 0;
            this.vy = -this.vy * 1.05;
            this.randomizeMeme();
        } else if (this.y + this.height * this.scale >= window.innerHeight) {
            this.y = window.innerHeight - this.height * this.scale;
            this.vy = -this.vy * 1.05;
            this.randomizeMeme();
        }

        // Cap maximum speed to prevent memes escaping the matrix
        const maxSpeed = 35;
        if (Math.abs(this.vx) > maxSpeed) this.vx = Math.sign(this.vx) * maxSpeed;
        if (Math.abs(this.vy) > maxSpeed) this.vy = Math.sign(this.vy) * maxSpeed;

        // Apply styles
        this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) rotate(${this.rotation}deg) scale(${this.scale})`;
    }

    randomizeMeme() {
        // Change rotation direction on bounce for extra chaos
        this.rotationSpeed = (Math.random() - 0.5) * 25;
    }
}

// 6. Spawn memes
function spawnMemes() {
    memeContainer.innerHTML = '';
    memesList = [];
    
    // Spawn multiple copies of memes to flood the screen
    const copies = 2; 
    for (let c = 0; c < copies; c++) {
        memeImages.forEach(src => {
            memesList.push(new FloatingMeme(src));
        });
    }
}

// 7. Update loop for flying memes
function updateMemesLoop() {
    if (!brainrotActive) return;
    
    memesList.forEach(meme => meme.update());
    
    // Randomly shift screen zoom or add text elements for absolute chaos
    if (Math.random() < 0.05) {
        document.body.style.filter = `hue-rotate(${Math.floor(Math.random() * 360)}deg)`;
    }

    requestAnimationFrame(updateMemesLoop);
}

// 8. Brainrot Mode Activation Trigger
function activateBrainrot() {
    if (brainrotActive) return; // Only trigger once
    brainrotActive = true;

    console.log("⚠️ WARNING: BRAINROT ENGAGED! ⚠️");

    // Add CSS active class (initiates screen shaking & rainbow flashing)
    document.body.classList.add('brainrot-active');

    // Make canvas active
    resizeCanvas();

    // Start video playback
    video.play().then(() => {
        // Start chroma key frame rendering
        processChromaKey();
    }).catch(e => {
        console.error("Failed to play green screen video:", e);
    });

    // Start chaos audios (earrape echo mode)
    playBrainrotAudio();

    // Spawn bouncing memes
    spawnMemes();

    // Start physics loop for memes
    updateMemesLoop();
}

// 9. Attach Event Listeners
watchNowBtn.addEventListener('click', activateBrainrot);
searchBar.addEventListener('click', activateBrainrot);
searchBar.addEventListener('focus', activateBrainrot);
searchTrigger.addEventListener('click', activateBrainrot);

// Add keydown trigger on search bar
searchBar.addEventListener('keydown', (e) => {
    activateBrainrot();
});

// ==================== OMDB API DYNAMIC POPULATION ====================
const OMDB_API_KEY = '33973f08';
const OMDB_BASE_URL = 'https://www.omdbapi.com/';

async function fetchOMDB(queryParams) {
    const url = `${OMDB_BASE_URL}?apikey=${OMDB_API_KEY}&${queryParams}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OMDB error: ${response.status}`);
    return await response.json();
}

// Generic fallback movies to show if OMDb fails or is offline
const fallbackMovies = [
    { Title: "Stranger Things", Year: "2016", Poster: "https://images.unsplash.com/photo-1574375927938-d5a98e8fed85?w=500&auto=format&fit=crop", Plot: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.", Rated: "TV-14", Type: "series" },
    { Title: "The Witcher", Year: "2019", Poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop", Plot: "Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world where people often prove more wicked than beasts.", Rated: "TV-MA", Type: "series" },
    { Title: "Breaking Bad", Year: "2008", Poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop", Plot: "A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student in order to secure his family's future.", Rated: "TV-MA", Type: "series" },
    { Title: "Inception", Year: "2010", Poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop", Plot: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.", Rated: "PG-13", Type: "movie" },
    { Title: "The Crown", Year: "2016", Poster: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&auto=format&fit=crop", Plot: "Follows the political rivalries and romance of Queen Elizabeth II's reign and the events that shaped the second half of the twentieth century.", Rated: "TV-MA", Type: "series" },
    { Title: "Avatar", Year: "2024", Poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop", Plot: "A young boy known as the Avatar must master the four elemental powers to save a world at war — and fight a ruthless enemy bent on stopping him.", Rated: "TV-PG", Type: "series" }
];

function loadFallbackContent() {
    updateHeroSection(fallbackMovies[0]);
    const container = document.getElementById('netflix-rows-container');
    if (container) {
        container.innerHTML = '';
        container.appendChild(createRowHTML('Trending Now', fallbackMovies));
        container.appendChild(createRowHTML('Popular Shows', fallbackMovies.slice().reverse()));
    }
}

async function loadOMDBData() {
    try {
        console.log("Fetching content from OMDB...");
        // Fetch 4 lists of movies based on popular search keywords
        const [trending, topRated, popularTv, actionMovies] = await Promise.all([
            fetchOMDB('s=avengers&type=movie'),
            fetchOMDB('s=batman&type=movie'),
            fetchOMDB('s=sherlock&type=series'),
            fetchOMDB('s=fast&type=movie')
        ]);
        
        // If we got results for trending, fetch full details of the first movie for the Hero section
        if (trending.Search && trending.Search.length > 0) {
            const heroMovie = trending.Search[0];
            try {
                const heroDetails = await fetchOMDB(`i=${heroMovie.imdbID}&plot=short`);
                updateHeroSection(heroDetails);
            } catch (err) {
                console.error("Failed to load hero details from OMDB:", err);
                updateHeroSection(heroMovie); // Fallback to basic search object
            }
        }
        
        const container = document.getElementById('netflix-rows-container');
        if (container) {
            container.innerHTML = ''; // Clear default local mock rows
            
            container.appendChild(createRowHTML('Trending Now', trending.Search || []));
            container.appendChild(createRowHTML('Top Rated Movies', topRated.Search || []));
            container.appendChild(createRowHTML('Popular Shows', popularTv.Search || []));
            container.appendChild(createRowHTML('Action Blockbusters', actionMovies.Search || []));
        }
    } catch (error) {
        console.error("Failed to load OMDB data, loading offline fallback:", error);
        loadFallbackContent();
    }
}

function updateHeroSection(movie) {
    const heroTitle = document.querySelector('.hero-title');
    const heroDesc = document.querySelector('.hero-description');
    const heroYear = document.querySelector('.hero-meta .year');
    const heroRating = document.querySelector('.hero-meta .rating');
    const videoContainer = document.querySelector('.hero-video-container');
    const heroMetaSkeletons = document.querySelectorAll('.hero-meta .skeleton');
    
    // Remove skeleton styling classes
    if (heroTitle) {
        heroTitle.classList.remove('skeleton', 'skeleton-text', 'skeleton-title');
        heroTitle.innerText = (movie.Title || '').toUpperCase();
    }
    
    if (heroDesc) {
        heroDesc.classList.remove('skeleton', 'skeleton-text', 'skeleton-desc');
        heroDesc.innerHTML = ''; // clear inside
        heroDesc.innerText = movie.Plot || 'No plot description available.';
    }
    
    heroMetaSkeletons.forEach(el => el.classList.remove('skeleton', 'skeleton-text'));
    
    if (heroYear && movie.Year) heroYear.innerText = movie.Year;
    if (heroRating && movie.Rated) heroRating.innerText = movie.Rated;
    
    if (videoContainer && movie.Poster && movie.Poster !== 'N/A') {
        videoContainer.innerHTML = `
            <div class="hero-backdrop" style="background-image: url('${movie.Poster}'); width: 100%; height: 100%; background-size: cover; background-position: center; transition: opacity 0.5s ease; filter: brightness(0.65);"></div>
            <div class="hero-overlay-top"></div>
            <div class="hero-overlay-bottom"></div>
        `;
    }
}

function createRowHTML(title, items) {
    const rowSection = document.createElement('section');
    rowSection.className = 'row';
    
    const rowTitle = document.createElement('h2');
    rowTitle.className = 'row-title';
    rowTitle.innerText = title;
    rowSection.appendChild(rowTitle);
    
    const rowPosters = document.createElement('div');
    rowPosters.className = 'row-posters';
    
    // Slice first 6 items
    items.slice(0, 6).forEach(item => {
        const card = document.createElement('div');
        card.className = 'poster-card';
        
        const imgUrl = item.Poster && item.Poster !== 'N/A' ? item.Poster : 'assets/IMG_4304.PNG';
        
        const titleText = item.Title || 'Untitled';
        const rating = item.Type === 'series' ? 'TV-PG' : 'PG-13';
        const match = Math.floor(Math.random() * 10) + 90; // 90% - 99%
        
        card.innerHTML = `
            <img src="${imgUrl}" alt="${titleText}" class="poster-img" onerror="this.src='assets/IMG_4304.PNG'">
            <div class="card-hover-details">
                <div class="card-actions">
                    <button class="action-btn"><i class="fas fa-play"></i></button>
                    <button class="action-btn"><i class="fas fa-plus"></i></button>
                    <button class="action-btn"><i class="fas fa-thumbs-up"></i></button>
                </div>
                <div class="card-meta">
                    <span class="match">${match}% Match</span> 
                    <span class="rating">${rating}</span>
                </div>
                <div class="card-tags">${titleText} (${item.Year || ''})</div>
            </div>
        `;
        
        // Dynamically spawned cards can also trigger the surprise
        card.addEventListener('click', activateBrainrot);
        
        rowPosters.appendChild(card);
    });
    
    rowSection.appendChild(rowPosters);
    return rowSection;
}

// Load content on page execution
loadOMDBData();

