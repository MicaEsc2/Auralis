const jukeboxIcon    = document.getElementById('jukebox-icon');
const discsContainer = document.getElementById('discs');
const trackLabel     = document.getElementById('track-label');
const audioPlayer    = document.getElementById('audio-player');

let selected = null;

const tracks = {
    'disc-blue':   './media/jazz.mp3',
    'disc-yellow': './media/disco.mp3',
    'disc-red':    './media/rock.mp3'
};
const jukeboxImages = {
    'disc-blue':   './img/tocadiscos-azul.png',
    'disc-yellow': './img/tocadiscos-amarillo.png',
    'disc-red':    './img/tocadiscos-rojo.png'
};
const trackNames = {
    'disc-blue':   'JAZZ',
    'disc-yellow': 'MÚSICA DISCO',
    'disc-red':    'ROCK'
};


jukeboxIcon.addEventListener('click', () => {
    
    selected = null;
    trackLabel.style.display = 'none';
    trackLabel.textContent = '';

  
    discsContainer.classList.toggle('visible');
});

document.querySelectorAll('.disc').forEach(disc => {
    const id = disc.id;

  
    disc.addEventListener('mouseenter', () => {
        if (!selected) {
            audioPlayer.loop = false;
            audioPlayer.src = tracks[id];
            audioPlayer.play().catch(console.error);
        }
    });
    disc.addEventListener('mouseleave', () => {
        if (!selected) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
        }
    });


    disc.addEventListener('click', () => {
        selected = id;
        discsContainer.classList.remove('visible');
        audioPlayer.loop = true;
        audioPlayer.src = tracks[id];
        audioPlayer.play().catch(console.error);

        jukeboxIcon.src = jukeboxImages[id] || jukeboxIcon.src;

        trackLabel.textContent = `¡${trackNames[id]}!`;
        trackLabel.style.display = 'block';
    });
});