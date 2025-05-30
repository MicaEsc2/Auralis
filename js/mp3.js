
//ELEMENTOS DOM 
let progress = document.getElementById('progress');
let ctrlIcon = document.getElementById('playIcon');
let currentTime = document.getElementById('currentTime');
let duration = document.getElementById('duration');
let prevIcon = document.getElementById('prevIcon');
let nextIcon = document.getElementById('nextIcon');

let isSeeking = false;
let seekSlider = document.getElementById('progress');
let currentTimeDisplay = document.querySelector('.progress-bar-info p'); 

let index = 0;
let interval;

let decodedBuffer = null;
let bufferOriginal = null;

//LISTA DE CANCIONES
let listaS = [];


const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");
// Lista por defecto con 3 canciones de la carpeta media
const listaPorDefecto = [
  { titulo: "Chandelier", file: "media/Chandelier - Sia.mp3" },
  { titulo: "Wonderwall", file: "media/Wonderwall - Oasis.mp3" },
  { titulo: "Jazz", file: "media/jazz.mp3" }
];


//cargar desde localStorage
const listaGuardada = localStorage.getItem('listaS');
if (listaGuardada) {
    try {
        listaS = JSON.parse(listaGuardada);
    } catch (e) {
        console.error("Error al parsear listaS:", e);
        listaS = [];
    }
}else {
    listaS = listaPorDefecto;
}

// Contexto y conexión del Audio
let audioContext = new (window.AudioContext || window.webkitAudioContext());
let audioElement = document.getElementById('song');
let track = audioContext.createMediaElementSource(audioElement) 
//let analyser = audioContext.createAnalyser();
const bypassGain = audioContext.createGain();
bypassGain.gain.value = 0;   

track.connect(bypassGain).connect(audioContext.destination);
let analyser;
let gainNode;

//track.connect(audioContext.destination)

let songImage = document.querySelector('.song-img-menu');



function setEchoEnabled(enabled) {
    robotNode.disconnect();
    echoAPIDelayNode.disconnect();
    echoAPIFeedbackGain.disconnect();

    if (enabled) {
        
        echoAPIDelayNode.connect(echoAPIFeedbackGain);
        echoAPIFeedbackGain.connect(echoAPIDelayNode);

      
        robotNode.connect(echoAPIDelayNode);
        echoAPIDelayNode.connect(gainNode);
        robotNode.connect(gainNode); 
    } else {
        robotNode.connect(gainNode); 
    }
}

let gain = audioContext.createGain();

function loadData(i) {
    if (i >= listaS.length) i = 0;
    if (i < 0) i = listaS.length - 1;
    index = i;

    let song = listaS[index];
    audioElement.src = song.file;  
    audioElement.pause();
    audioElement.currentTime = 0;
    audioElement.load();
    console.log(song.file)
    setupAudioNodes(); 
   
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            audioElement.play().catch(e => console.error("Error al reproducir:", e));
            ctrlIcon.classList.remove('fa-play');
            ctrlIcon.classList.add('fa-pause');
        });
    } else {
        audioElement.play().catch(e => console.error("Error al reproducir:", e));
        ctrlIcon.classList.remove('fa-play');
        ctrlIcon.classList.add('fa-pause');
        clearInterval(interval);
        bufferOriginal = decodedBuffer;
        //volumen(gain); 

        // Decodificar el buffer 
        fetch(audioElement.src)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
            .then(buffer => {
                decodedBuffer = buffer;
                bufferOriginal = buffer;
                volumen(gain);
            })
            .catch(err => {
                console.error("Error decoding audio data:", err);
            });


        interval = setInterval(() => {
            progress.value = audioElement.currentTime;
            updateProgressStyle();
            currentTime.textContent = formatTime(audioElement.currentTime);
        }, 500);
    }

   
    let nombreArchivo = song.file.split('/').pop().replace('.mp3', '');
    let partes = nombreArchivo.split(' - ');
    let titulo = partes.length > 1 ? partes[0] : nombreArchivo;
    let artista = partes.length > 1 ? partes[1] : "Desconocido";

  
    document.getElementById('songTitle').innerText = titulo;
    document.getElementById('songArtist').innerText = artista;
    
    let imageFileName = partes[0].toLowerCase() + partes[1].charAt(0).toLowerCase() + ".png";
    let imagePath = `./media/${imageFileName}`;

   
    songImage.src = imagePath;

   
    songImage.onerror = function () {
        songImage.src = './media/default.png'; 
    };

}


// Filtros JS-----------------------------------------------------------------------------------------------

let manualLowpassNode, manualHighpassNode, bassNode, trebleNode, distortionNode;
let lowpassCutoff = 1000;
let highpassCutoff = 500;
let lowpassMix = 1;
let highpassMix = 1;
let lastLowpassOutput = 0;
let lastHighpassOutput = 0;
let minFreq = 500, maxFreq = 3000;


// ROBOT
let robotNode;
let robotFreq = 0;
let robotPhase = 0;


//WAH WAH
let wahwahManualNode;
let wahwahPhase = 0;
let wahwahRate = 0.01;
let wahwahRange = [500, 3000];
let wahwahLastSample = 0;

//FLANGER
let flangerNode;
let flangerDepth = 0;
let flangerRate = 0.8; 
let flangerPhase = 0;
let flangerBufferIndex = 0;
let flangerDelayBuffer = new Float32Array(44100);

// ECO MANUAL
let echoBuffer = [];
let echoDelayTime = 0.0;
let echoFeedback = 0.0; 
const maxEchoBufferSize = 44100;

//ECO API
let echoAPIDelayNode;
let echoAPIFeedbackGain;
let useEchoAPI = true;

async function setupAudioNodes() {
    await audioContext.audioWorklet.addModule('js/robot-processor.js');
    await audioContext.audioWorklet.addModule('js/highpass-processor.js');
    await audioContext.audioWorklet.addModule('js/lowpass-processor.js');
    await audioContext.audioWorklet.addModule('js/wahwah-processor.js');
    await audioContext.audioWorklet.addModule('js/flanger-processor.js');
    await audioContext.audioWorklet.addModule('js/distortion-processor.js');

    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    analyser = audioContext.createAnalyser();
    gainNode = audioContext.createGain();


    manualHighpassNode = new AudioWorkletNode(audioContext, 'highpass-processor');
    manualHighpassNode.parameters.get('cutoff').setValueAtTime(highpassCutoff, audioContext.currentTime);
    manualHighpassNode.parameters.get('mix').setValueAtTime(highpassMix, audioContext.currentTime);

    manualLowpassNode = new AudioWorkletNode(audioContext, 'lowpass-processor' , {
        outputChannelCount: [2]
      });
    manualLowpassNode.parameters.get('cutoff').setValueAtTime(lowpassCutoff, audioContext.currentTime);
    manualLowpassNode.parameters.get('mix').setValueAtTime(lowpassMix, audioContext.currentTime);

    wahwahManualNode = new AudioWorkletNode(audioContext, 'wahwah-processor');
  
    wahwahManualNode.parameters.get('rate').setValueAtTime(wahwahRate, audioContext.currentTime);
    wahwahManualNode.parameters.get('mix').setValueAtTime(0.5, audioContext.currentTime);
    
    flangerNode = new AudioWorkletNode(audioContext, 'flanger-processor');
    flangerNode.parameters.get('mix').setValueAtTime(0.5, audioContext.currentTime);
   
    robotNode = new AudioWorkletNode(audioContext, 'robot-processor' , {
        outputChannelCount: [2]
      });
    robotNode.parameters.get('frequency').setValueAtTime(robotFreq, audioContext.currentTime);
    
    distortionNode = new AudioWorkletNode(audioContext, 'distortion-processor');
    distortionNode.parameters.get('amount').setValueAtTime(1, audioContext.currentTime);
    distortionNode.parameters.get('mix').setValueAtTime(1, audioContext.currentTime);

    // FILTROS BASS & TREBLE (API)
    
    bassNode = audioContext.createBiquadFilter();
    bassNode.type = "lowshelf";
    bassNode.gain.value = 0;

    trebleNode = audioContext.createBiquadFilter();
    trebleNode.type = "highshelf";
    trebleNode.gain.value = 0;

   // distortionNode = audioContext.createWaveShaper();
    //distortionNode.curve = makeDistortionCurve(0);

    // ECO (API)
    echoAPIDelayNode = audioContext.createDelay();
    echoAPIDelayNode.delayTime.value = 0.3;

    echoAPIFeedbackGain = audioContext.createGain();
    echoAPIFeedbackGain.gain.value = 0.0;

    echoAPIDelayNode.connect(echoAPIFeedbackGain);
    echoAPIFeedbackGain.connect(echoAPIDelayNode);

    // CONEXIONES ENTRE NODOS
    track.connect(manualHighpassNode);
    manualHighpassNode.connect(manualLowpassNode);
    manualLowpassNode.connect(wahwahManualNode);
    wahwahManualNode.connect(flangerNode);
    flangerNode.connect(distortionNode);
    distortionNode.connect(robotNode);
    robotNode.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(audioContext.destination);

    
    setEchoEnabled(false); 
    updateFlangerConnection(0);

    const freq = parseFloat(document.getElementById("robotFreqSlider").value);
    updateRobotFilter(freq);
    
    
    visualize();
}


//FUNCIONES---------------------------------------------------------------------------------------------------------------------------------------
function makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = i * 2 / n_samples - 1;
      curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }


//SLIDERS DE CONTROL---------------------------------------------------------------------------------------------------------
 // LOWPASS: Frecuencia de corte
document.getElementById("lowpassSlider").oninput = function () {
    const freq = parseFloat(this.value);
    lowpassCutoff = freq;
    manualLowpassNode.parameters.get('cutoff').setValueAtTime(freq, audioContext.currentTime);
    document.getElementById("lowpassLabel").textContent = `${freq} Hz`;
};

// LOWPASS: Mezcla (dry/wet)
document.getElementById("lowpassMixSlider").oninput = function () {
    lowpassMix = parseFloat(this.value);
    manualLowpassNode.parameters.get('mix').setValueAtTime(lowpassMix, audioContext.currentTime);
};

// HIGHPASS: Frecuencia de corte
document.getElementById("highpassSlider").oninput = function () {
    const freq = parseFloat(this.value);
    highpassCutoff = freq;
    manualHighpassNode.parameters.get('cutoff').setValueAtTime(freq, audioContext.currentTime);
    document.getElementById("highpassLabel").textContent = `${freq} Hz`;
};

// HIGHPASS: Mezcla (dry/wet)
document.getElementById("highpassMixSlider").oninput = function () {
    highpassMix = parseFloat(this.value);
    manualHighpassNode.parameters.get('mix').setValueAtTime(highpassMix, audioContext.currentTime);
};


 document.getElementById("echoSlider").oninput = function () {
    const value = parseFloat(this.value);
    echoAPIFeedbackGain.gain.value = value;
    document.getElementById("echoLabel").textContent = `${(value * 100).toFixed(0)}%`;
};

  document.getElementById("echoFeedbackSlider").oninput = function () {
    echoFeedback = parseFloat(this.value);
    document.getElementById("echoFeedbackLabel").textContent = `${echoFeedback}`;
  };
  document.getElementById('toggleEchoCheckbox').addEventListener('change', function() {
    setEchoEnabled(this.checked);
});

  //distorsion
document.getElementById('distortionAmount').oninput = function() {
  const a = parseFloat(this.value);
  distortionNode.parameters.get('amount').setValueAtTime(a, audioContext.currentTime);
  document.getElementById('distortionAmountLabel').textContent = a.toFixed(1);
};
document.getElementById('distortionMix').oninput = function() {
  const m = parseFloat(this.value);
  distortionNode.parameters.get('mix').setValueAtTime(m, audioContext.currentTime);
  document.getElementById('distortionMixLabel').textContent = `${Math.round(m*100)}%`;
};

  
  //ROBOT
  document.getElementById("robotFreqSlider").oninput = function () {
    const freq = parseFloat(this.value);
    updateRobotFilter(freq);
  };
  
  //WAHWAH
    document.getElementById("wahwahSlider").oninput = function () {
    const rate = parseFloat(this.value);
    document.getElementById("wahwahLabel").textContent = `${rate.toFixed(2)} Hz`;
    if (wahwahManualNode) {
        wahwahManualNode.parameters.get('rate')
        .setValueAtTime(rate, audioContext.currentTime);
    }
    };


    // Wah-Wah Mix
    document.getElementById("wahMix").oninput = function() {
    const mix = parseFloat(this.value);
    wahwahManualNode.parameters.get('mix').setValueAtTime(mix, audioContext.currentTime);
    document.getElementById('wahMixLabel').textContent = `${Math.round(mix * 100)}%`;
    };

    // Wah-Wah Freq Mínima
    document.getElementById('wahMinFreqSlider').oninput = function() {
    minFreq = parseFloat(this.value);
    wahwahManualNode.parameters.get('minFreq')
        .setValueAtTime(minFreq, audioContext.currentTime);
    document.getElementById('wahMinFreqLabel').textContent = `${minFreq}Hz`;
    };

    // Wah-Wah Freq Máxima
    document.getElementById('wahMaxFreqSlider').oninput = function() {
    maxFreq = parseFloat(this.value);
    wahwahManualNode.parameters.get('maxFreq')
        .setValueAtTime(maxFreq, audioContext.currentTime);
    document.getElementById('wahMaxFreqLabel').textContent = `${maxFreq}Hz`;
    };


  //FLANGER
    document.getElementById("flangerDepthSlider").oninput = function() {

    const raw = parseFloat(this.value);
    if (!Number.isFinite(raw)) return;        

    flangerDepth = raw < 0 ? 0 : raw > 50 ? 50 : raw;

    document.getElementById("flangerDepthLabel").textContent =
        flangerDepth === 0 ? "OFF" : `${flangerDepth} ms`;

    flangerNode.parameters
        .get('depth')
        .setValueAtTime(flangerDepth / 1000, audioContext.currentTime);

    updateFlangerConnection(flangerDepth);
    };
    
  // Flanger Mix
    document.getElementById("flangerMix").oninput = function() {
    const mix = parseFloat(this.value);
    flangerNode.parameters.get('mix').setValueAtTime(mix, audioContext.currentTime);
    document.getElementById('flangerMixLabel').textContent = `${Math.round(mix * 100)}%`;
    };

//-------------------------------------------------------------------------------------------------------------------------------------------------

//FUNCIONES
// VISUALIZADOR
  // Visualización
function visualize() {
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
  
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  
    function draw() {
      requestAnimationFrame(draw);
  
      analyser.getByteFrequencyData(dataArray);
      ctx.fillStyle = "rgb(0, 0, 0)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
  
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i];
        ctx.fillStyle = `rgb(${barHeight + 100},50,50)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    }
  
    draw();
  }

  //ACTUALIZADOR FILTRO FLANGER
  function updateFlangerConnection(value = flangerDepth) {
    wahwahManualNode.disconnect();
    flangerNode.disconnect?.();

    if (value === 0) {
        wahwahManualNode.connect(distortionNode);
    } else {
        wahwahManualNode.connect(flangerNode);
        flangerNode.connect(distortionNode);
    }
}

  // ACTUALIZADOR DE FILTRO ROBOT
  function updateRobotFilter(freq) {
    robotFreq = parseFloat(freq);
    const label = document.getElementById("robotFreqLabel");
    if (label) {
        label.textContent = robotFreq === 0 ? "OFF" : `${robotFreq} Hz`;
    }
    if (robotNode) {
        robotNode.parameters.get('frequency').setValueAtTime(robotFreq, audioContext.currentTime);
    }
}
 
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }



// Reproducir 
function playPause() {
    if (ctrlIcon.classList.contains('fa-pause')) {
        audioElement.pause();
        ctrlIcon.classList.remove('fa-pause');
        ctrlIcon.classList.add('fa-play');
        clearInterval(interval);
    } else {
        
        if (!audioElement.src || audioElement.src.trim() === "" || audioElement.src.endsWith("/")) {
            if (listaS.length > 0) {
                loadData(0); 
                return; 
            } else {
                alert("No hay canciones disponibles para reproducir.");
                return;
            }
        }

       
        if (audioContext.state === 'suspended') {
            audioContext.resume();
            setupAudioNodes();
            setupVisualizer(audioElement);
            console.log("Canvas de visualización cargado:", document.getElementById('visualizer'));
        }

        audioElement.play().catch(e => console.error("Error al reproducir:", e));
        ctrlIcon.classList.remove('fa-play');
        ctrlIcon.classList.add('fa-pause');
        clearInterval(interval);

      
        interval = setInterval(() => {
            progress.value = audioElement.currentTime;
            updateProgressStyle();
            currentTime.textContent = formatTime(audioElement.currentTime);
        }, 500);
    }
}




function updateProgressStyle() {
    let value = (progress.value / progress.max) * 100;
    progress.style.backgroundSize = `${value}% 100%`;
}

progress.oninput = function () {
    audioElement.currentTime = progress.value;
    updateProgressStyle();
};


function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

audioElement.onloadedmetadata = function () {
    progress.max = audioElement.duration;
    progress.value = audioElement.currentTime;
    duration.textContent = formatTime(audioElement.duration);
    currentTime.textContent = formatTime(audioElement.currentTime);
};
progress.oninput = function () {
    audioElement.currentTime = progress.value;
    updateProgressStyle();
    currentTime.textContent = formatTime(progress.value);
};


nextIcon.addEventListener("click", () => {
    nextSong();
});
prevIcon.addEventListener("click", () => {
    prevSong();
});

function nextSong() {
    console.log("Next clicked");
    let nextIndex = shuffleMode ? getRandomIndex() : index + 1;
    loadData(nextIndex);
}

function prevSong() {
    console.log("Prev clicked");

   
    if (audioElement.currentTime > 10) {
        audioElement.currentTime = 0;
    } else {
        let prevIndex = shuffleMode ? getRandomIndex() : index - 1;
        loadData(prevIndex);
    }
}

function getRandomIndex() {
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * listaS.length);
    } while (randomIndex === index && listaS.length > 1);
    return randomIndex;
}


let loopMode = false;
let shuffleMode = false;

document.getElementById('loop').addEventListener('click', () => {
    loopMode = !loopMode;
    document.getElementById('loop').classList.toggle('active');
});

document.getElementById('shuffle').addEventListener('click', () => {
    shuffleMode = !shuffleMode;
    document.getElementById('shuffle').classList.toggle('active');
});

audioElement.addEventListener('ended', () => {
    if (shuffleMode) {
        loadData(getRandomIndex());
    } else if (loopMode) {
        loadData(index < listaS.length - 1 ? index + 1 : 0);
    } else {
        resetPlayer();
    }
});

function resetPlayer() {
    audioElement.pause();
    audioElement.removeAttribute('src');
    audioElement.load();
    ctrlIcon.classList.replace('fa-pause', 'fa-play');
    progress.value = 0;
    currentTime.textContent = "0:00";
    duration.textContent = "0:00";
    songImage.src = "./media/default.png";
    index = 0;
}




document.getElementById('audioUpload').addEventListener('change', function (e) {
    const files = Array.from(e.target.files);

    files.forEach(file => {
       
        if (!file.name.endsWith('.mp3')) return;

        const nombre = file.name;
        const ruta = `media/${nombre}`;
        listaS.push({
            file: ruta,
            image: "default.png"
        });
    });

   
    localStorage.setItem('listaS', JSON.stringify(listaS));
    cargarSongList();
});

// Biblioteca lista
function cargarSongList() {
    let tabla = document.querySelector('#song-biblio tbody');

    
    tabla.innerHTML = "";

    listaS.forEach((song, i) => {
        let newRow = tabla.insertRow();
        newRow.setAttribute('draggable', true);
        newRow.classList.add('song-item');
        newRow.dataset.index = i;

       
        let celdaNumero = newRow.insertCell(0);
        celdaNumero.innerText = i + 1; 
        let celdaTítulo = newRow.insertCell(1);
        let celdaArtista = newRow.insertCell(2);
        let celdaIconos = newRow.insertCell(3);

        
        let nombreArchivo = song.file.split('/').pop().replace('.mp3', '');
        let partes = nombreArchivo.split(' - ');
        
        let titulo = partes.length > 1 ? partes[1] : nombreArchivo;
        let artista = partes.length > 1 ? partes[0] : "Desconocido";

     
        celdaTítulo.innerText = titulo;
        celdaArtista.innerText = artista;
        celdaIconos.innerHTML = '<i class="fa-solid fa-xmark"></i>';

        
        celdaIconos.addEventListener('click', () => {
            eliminarCancion(i);  
        });

        newRow.addEventListener('click', () => loadData(i));

        
        newRow.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', newRow.dataset.index);
            newRow.classList.add('dragging'); 
        });

        newRow.addEventListener('dragover', (e) => {
            e.preventDefault();
            newRow.classList.add('over');
        });

        newRow.addEventListener('dragleave', () => {
            newRow.classList.remove('over'); 
        });

        newRow.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const targetIndex = parseInt(newRow.dataset.index);

            const [moved] = listaS.splice(draggedIndex, 1);
            listaS.splice(targetIndex, 0, moved);

            
            localStorage.setItem('listaS', JSON.stringify(listaS));
            cargarSongList();
            newRow.classList.remove('over'); r
        });
    });
}

window.addEventListener('load', cargarSongList);


function eliminarCancion(index) {
  
    const confirmacion = confirm("¿Estás seguro de que deseas eliminar esta canción?");
    if (confirmacion) {
        listaS.splice(index, 1); 

       
        localStorage.setItem('listaS', JSON.stringify(listaS));

       
        cargarSongList();
    }
}

// Volumen (no API WEB)

/**
 * Ajusta audioElement.volume de 0% a 100%.
 * @param {number} v Porcentaje (0–100) o valor 0.0–1.0.
 */
function volumen(v) {
 
  if (typeof v !== 'number' || !Number.isFinite(v)) {
   
    console.warn('Volumen inválido, usando 100%');
    v = 100;
  }


  if (v >= 0 && v <= 1) {
    v = v * 100;
  }


  v = Math.max(0, Math.min(100, v));


  audioElement.volume = v / 100;


  const lbl = document.getElementById('volLabel');
  if (lbl) lbl.textContent = `${v}%`;


  console.log(`Volumen ajustado a: ${v}%`);
}


document.getElementById('volumeSlider').addEventListener('input', e => {
  volumen(parseFloat(e.target.value));
});


