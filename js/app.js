// Enhanced mobile-compatible music player
function loadCustomSongs() {
  try {
    const customSongs = JSON.parse(localStorage.getItem("customSongs") || "[]")
    return customSongs.map((song) => song.name)
  } catch {
    return []
  }
}

function getCustomSongData(songName) {
  try {
    const customSongs = JSON.parse(localStorage.getItem("customSongs") || "[]")
    return customSongs.find((song) => song.name === songName)
  } catch {
    return null
  }
}

function updateSongsList() {
  const customSongs = loadCustomSongs()
  songs.length = 0
  songs.push(
    ...[
      "AGA - BAS GAZA",
      "Ale eyes on me",
      "Alleya",
      ...customSongs,
    ],
  )

  if (songIndex >= songs.length) {
    songIndex = 0
  }

  if (songs.length > 0) {
    loadSong(songs[songIndex])
  }
}

function playSpecificSong(songName) {
  const songIdx = songs.findIndex((song) => song === songName)
  if (songIdx !== -1) {
    songIndex = songIdx
    loadSong(songs[songIndex])
    playSong()
  }
}

// Mobile detection
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Make functions available globally
window.updateSongsList = updateSongsList
window.playSpecificSong = playSpecificSong
window.isMobile = isMobile

// Selectors
const musicContainer = document.querySelector("#music-container")
const prevBtn = document.querySelector("#prev")
const nextBtn = document.querySelector("#next")
const playBtn = document.querySelector("#play")
const volumeSlider = document.querySelector("#volume")

const title = document.querySelector("#title")
const audio = document.querySelector("#music")
const cover = document.querySelector("#cover")
const progressContainer = document.querySelector("#progress-container")
const progress = document.querySelector("#progress")

const songs = [
  "AGA - BAS GAZA",
  "I ke Harru",
  "Иса",
  "Konsta",
  "Ale eyes on me",
  "Alleya",
  "Xcho",
  "Без тебя я не я",
  "Ночной рейс",
  "Поет",
  "Харизма",
]

let songIndex = 0

// Enhanced mobile-compatible song loading
function loadSong(song) {
  title.innerText = song

  const customSongData = getCustomSongData(song)

  if (customSongData) {
    // Load custom song with better error handling
    audio.src = customSongData.audio
    cover.src = customSongData.image

    // Mobile-specific audio loading
    if (isMobile()) {
      audio.preload = "metadata"
      audio.load()
    }
  } else {
    // Load default song
    audio.src = `audios/${song}.mp3`
    cover.src = `images/${song}.jpg`

    // Error handling for missing files
    cover.onerror = function () {
      this.src = "/placeholder.svg?height=200&width=200"
    }
  }

  audio.onerror = () => {
    console.log(`Audio file not found: ${song}`)
    // Try to skip to next song on mobile if current fails
    if (isMobile()) {
      setTimeout(() => {
        nextSong()
      }, 1000)
    }
  }
}

// Enhanced play function for mobile
function playSong() {
  musicContainer.classList.add("play")
  playBtn.querySelector("i.fas").classList.remove("fa-play")
  playBtn.querySelector("i.fas").classList.add("fa-pause")

  // Mobile-specific play handling
  const playPromise = audio.play()

  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        console.log("Audio started playing")
      })
      .catch((error) => {
        console.log("Audio play failed:", error)
        // Show user-friendly message on mobile
        if (isMobile()) {
          showMobileMessage("Audio ijro etishda muammo. Qayta urinib ko'ring.")
        }
      })
  }
}

function pauseSong() {
  musicContainer.classList.remove("play")
  playBtn.querySelector("i.fas").classList.add("fa-play")
  playBtn.querySelector("i.fas").classList.remove("fa-pause")
  audio.pause()
}

function prevSong() {
  songIndex--
  if (songIndex < 0) {
    songIndex = songs.length - 1
  }
  loadSong(songs[songIndex])
  playSong()
}

function nextSong() {
  songIndex++
  if (songIndex > songs.length - 1) {
    songIndex = 0
  }
  loadSong(songs[songIndex])
  playSong()
}

function updateProgress(e) {
  const { duration, currentTime } = e.srcElement
  if (duration && !isNaN(duration)) {
    const progressPercent = (currentTime / duration) * 100
    progress.style.width = `${progressPercent}%`
  }
}

function setProgress(e) {
  const width = this.clientWidth
  const clickX = e.offsetX
  const duration = audio.duration

  if (duration && !isNaN(duration)) {
    audio.currentTime = (clickX / width) * duration
  }
}

function setVolume() {
  audio.volume = volumeSlider.value / 100
}

// Mobile message display
function showMobileMessage(text) {
  const message = document.createElement("div")
  message.className = "mobile-message"
  message.textContent = text
  message.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 14px;
    z-index: 10000;
    animation: fadeInOut 3s ease-in-out;
  `

  document.body.appendChild(message)

  setTimeout(() => {
    if (message.parentNode) {
      message.parentNode.removeChild(message)
    }
  }, 3000)
}

// Enhanced event listeners for mobile
playBtn.addEventListener("click", () => {
  const isPlaying = musicContainer.classList.contains("play")
  if (isPlaying) {
    pauseSong()
  } else {
    playSong()
  }
})

// Mobile-friendly touch events
if (isMobile()) {
  playBtn.addEventListener("touchstart", (e) => {
    e.preventDefault()
    const isPlaying = musicContainer.classList.contains("play")
    if (isPlaying) {
      pauseSong()
    } else {
      playSong()
    }
  })

  prevBtn.addEventListener("touchstart", (e) => {
    e.preventDefault()
    prevSong()
  })

  nextBtn.addEventListener("touchstart", (e) => {
    e.preventDefault()
    nextSong()
  })
}

prevBtn.addEventListener("click", prevSong)
nextBtn.addEventListener("click", nextSong)

audio.addEventListener("timeupdate", updateProgress)
progressContainer.addEventListener("click", setProgress)
volumeSlider.addEventListener("input", setVolume)
audio.addEventListener("ended", nextSong)

// Mobile-specific audio event handling
audio.addEventListener("canplaythrough", () => {
  console.log("Audio ready to play")
})

audio.addEventListener("loadstart", () => {
  console.log("Audio loading started")
})

audio.addEventListener("error", (e) => {
  console.error("Audio error:", e)
  if (isMobile()) {
    showMobileMessage("Audio yuklanmadi. Keyingi qo'shiqqa o'tilmoqda...")
    setTimeout(nextSong, 2000)
  }
})

// Set initial volume
audio.volume = 0.5

// Enhanced initialization for mobile
window.addEventListener("load", () => {
  updateSongsList()
  loadSong(songs[songIndex])

  // Mobile-specific initialization
  if (isMobile()) {
    // Prevent zoom on double tap
    document.addEventListener("touchstart", (e) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    })

    // Handle mobile audio context
    document.addEventListener(
      "touchstart",
      () => {
        if (audio.paused) {
          audio.load()
        }
      },
      { once: true },
    )
  }
})

// Add CSS animation for mobile messages
const style = document.createElement("style")
style.textContent = `
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    20% { opacity: 1; transform: translateX(-50%) translateY(0); }
    80% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  }
  
  .file-message {
    padding: 8px 12px;
    border-radius: 6px;
    margin: 10px 0;
    text-align: center;
    font-size: 13px;
    font-weight: bold;
  }
  
  .file-message.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  
  .file-message.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
`
document.head.appendChild(style)
