class MusicStorageManager {
  constructor() {
    this.dbName = "musicDB"
    this.dbVersion = 1
    this.db = null
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = (event) => {
        console.error("IndexedDB xatolik:", event)
        reject(event)
      }

      request.onsuccess = (event) => {
        this.db = event.target.result
        console.log("IndexedDB ga ulanish muvaffaqiyatli!")
        resolve()
      }

      request.onupgradeneeded = (event) => {
        this.db = event.target.result
        const objectStore = this.db.createObjectStore("audioFiles", { keyPath: "id", autoIncrement: true })
        objectStore.createIndex("name", "name", { unique: false })
        console.log("ObjectStore yaratildi!")
      }
    })
  }

  async addAudioFile(file, metadata) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["audioFiles"], "readwrite")
      const objectStore = transaction.objectStore("audioFiles")

      const reader = new FileReader()
      reader.onload = async (event) => {
        const fileData = event.target.result
        const audioFile = {
          file: fileData,
          name: metadata.name,
          duration: metadata.duration,
          size: metadata.size,
        }

        const request = objectStore.add(audioFile)

        request.onsuccess = () => {
          console.log("Fayl IndexedDB ga saqlandi!")
          resolve()
        }

        request.onerror = (event) => {
          console.error("Faylni saqlashda xatolik:", event)
          reject(event)
        }
      }

      reader.onerror = (event) => {
        console.error("Faylni o'qishda xatolik:", event)
        reject(event)
      }

      reader.readAsDataURL(file)
    })
  }

  async getAllAudioFiles() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["audioFiles"], "readonly")
      const objectStore = transaction.objectStore("audioFiles")
      const request = objectStore.getAll()

      request.onsuccess = (event) => {
        const audioFiles = event.target.result
        console.log("Barcha audio fayllar olindi:", audioFiles)
        resolve(audioFiles)
      }

      request.onerror = (event) => {
        console.error("Fayllarni olishda xatolik:", event)
        reject(event)
      }
    })
  }

  async deleteAudioFile(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["audioFiles"], "readwrite")
      const objectStore = transaction.objectStore("audioFiles")
      const request = objectStore.delete(id)

      request.onsuccess = () => {
        console.log("Fayl o'chirildi:", id)
        resolve()
      }

      request.onerror = (event) => {
        console.error("Faylni o'chirishda xatolik:", event)
        reject(event)
      }
    })
  }
}

class MusicPlayer {
  constructor() {
    this.storageManager = new MusicStorageManager()
    this.currentAudio = null
    this.playlist = []
    this.currentIndex = 0
    this.isPlaying = false
  }

  async init() {
    await this.storageManager.initDB()
    await this.loadPlaylist()
    this.setupEventListeners()
  }

  // Fayl yuklash
  async handleFileUpload(event) {
    const files = Array.from(event.target.files)

    for (const file of files) {
      // Fayl validatsiyasi
      if (!this.validateAudioFile(file)) {
        alert(`${file.name} fayli noto'g'ri format!`)
        continue
      }

      try {
        // Metadata olish
        const metadata = await this.extractMetadata(file)

        // IndexedDB ga saqlash
        await this.storageManager.addAudioFile(file, metadata)

        // Playlist yangilash
        await this.refreshPlaylist()

        console.log(`${file.name} muvaffaqiyatli qo'shildi!`)
      } catch (error) {
        console.error(`${file.name} qo'shishda xatolik:`, error)
      }
    }
  }

  // Fayl validatsiyasi
  validateAudioFile(file) {
    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3"]
    const maxSize = 100 * 1024 * 1024 // 100MB

    return allowedTypes.includes(file.type) && file.size <= maxSize
  }

  // Metadata olish
  async extractMetadata(file) {
    return new Promise((resolve) => {
      const audio = new Audio()
      const url = URL.createObjectURL(file)

      audio.addEventListener("loadedmetadata", () => {
        resolve({
          name: file.name.replace(/\.[^/.]+$/, ""), // Kengaytmasiz nom
          duration: audio.duration,
          size: file.size,
        })
        URL.revokeObjectURL(url)
      })

      audio.addEventListener("error", () => {
        resolve({
          name: file.name.replace(/\.[^/.]+$/, ""),
          duration: 0,
          size: file.size,
        })
        URL.revokeObjectURL(url)
      })

      audio.src = url
    })
  }

  // Playlist yuklash
  async loadPlaylist() {
    try {
      const audioFiles = await this.storageManager.getAllAudioFiles()
      this.playlist = audioFiles
      this.renderPlaylist()

      // Oxirgi holatni tiklash
      const savedState = localStorage.getItem("currentPlaylist")
      if (savedState) {
        const state = JSON.parse(savedState)
        this.currentIndex = state.currentIndex || 0
      }
    } catch (error) {
      console.error("Playlist yuklashda xatolik:", error)
    }
  }

  // Musiqa ijro qilish
  async playMusic(index) {
    try {
      if (this.currentAudio) {
        this.currentAudio.pause()
      }

      const audioData = this.playlist[index]
      if (!audioData) return

      // File object dan URL yaratish
      const audioUrl = URL.createObjectURL(new Blob([this.base64ToArrayBuffer(audioData.file)]))

      this.currentAudio = new Audio(audioUrl)
      this.currentIndex = index

      // Audio events
      this.currentAudio.addEventListener("ended", () => {
        this.playNext()
      })

      this.currentAudio.addEventListener("error", (e) => {
        console.error("Audio ijro xatoligi:", e)
        this.playNext()
      })

      await this.currentAudio.play()
      this.isPlaying = true
      this.updateUI()

      // Holatni saqlash
      this.saveCurrentState()
    } catch (error) {
      console.error("Musiqa ijro qilishda xatolik:", error)
    }
  }

  base64ToArrayBuffer(base64) {
    const base64Content = base64.split(",")[1]
    const binaryString = window.atob(base64Content)
    const binaryLen = binaryString.length
    const bytes = new Uint8Array(binaryLen)
    for (let i = 0; i < binaryLen; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  // Keyingi musiqa
  playNext() {
    const nextIndex = (this.currentIndex + 1) % this.playlist.length
    this.playMusic(nextIndex)
  }

  // Oldingi musiqa
  playPrevious() {
    const prevIndex = this.currentIndex === 0 ? this.playlist.length - 1 : this.currentIndex - 1
    this.playMusic(prevIndex)
  }

  // Musiqa o'chirish
  async deleteMusic(index) {
    try {
      const audioData = this.playlist[index]

      // IndexedDB dan o'chirish
      await this.storageManager.deleteAudioFile(audioData.id)

      // Playlist yangilash
      await this.refreshPlaylist()

      // Agar joriy musiqa o'chirilsa
      if (index === this.currentIndex && this.currentAudio) {
        this.currentAudio.pause()
        this.currentAudio = null
        this.isPlaying = false
      }

      console.log("Musiqa o'chirildi!")
    } catch (error) {
      console.error("Musiqa o'chirishda xatolik:", error)
    }
  }

  // Playlist yangilash
  async refreshPlaylist() {
    await this.loadPlaylist()
  }

  // Joriy holatni saqlash
  saveCurrentState() {
    const state = {
      currentIndex: this.currentIndex,
      isPlaying: this.isPlaying,
      currentTime: this.currentAudio ? this.currentAudio.currentTime : 0,
    }

    localStorage.setItem("playerState", JSON.stringify(state))
  }

  // UI yangilash
  updateUI() {
    // Playlist ko'rinishini yangilash
    this.renderPlaylist()

    // Player controls yangilash
    this.updatePlayerControls()
  }

  // Playlist render qilish
  renderPlaylist() {
    const playlistContainer = document.getElementById("playlist")
    if (!playlistContainer) return

    playlistContainer.innerHTML = ""

    this.playlist.forEach((audio, index) => {
      const item = document.createElement("div")
      item.className = `playlist-item ${index === this.currentIndex ? "active" : ""}`

      item.innerHTML = `
        <div class="song-info">
          <span class="song-name">${audio.name}</span>
          <span class="song-duration">${this.formatDuration(audio.duration)}</span>
        </div>
        <div class="song-controls">
          <button onclick="player.playMusic(${index})" class="play-btn">
            ${index === this.currentIndex && this.isPlaying ? "⏸️" : "▶️"}
          </button>
          <button onclick="player.deleteMusic(${index})" class="delete-btn">🗑️</button>
        </div>
      `

      playlistContainer.appendChild(item)
    })
  }

  // Vaqtni formatlash
  formatDuration(seconds) {
    if (!seconds || seconds === 0) return "0:00"

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Event listeners
  setupEventListeners() {
    // File input
    const fileInput = document.getElementById("audioFileInput")
    if (fileInput) {
      fileInput.addEventListener("change", (e) => this.handleFileUpload(e))
    }

    // Player controls
    const playBtn = document.getElementById("playBtn")
    const nextBtn = document.getElementById("nextBtn")
    const prevBtn = document.getElementById("prevBtn")

    if (playBtn) {
      playBtn.addEventListener("click", () => {
        if (this.isPlaying) {
          this.currentAudio.pause()
          this.isPlaying = false
        } else if (this.currentAudio) {
          this.currentAudio.play()
          this.isPlaying = true
        } else if (this.playlist.length > 0) {
          this.playMusic(0)
        }
        this.updateUI()
      })
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => this.playNext())
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", () => this.playPrevious())
    }
  }

  // Player controls yangilash
  updatePlayerControls() {
    const playBtn = document.getElementById("playBtn")
    if (playBtn) {
      playBtn.textContent = this.isPlaying ? "⏸️" : "▶️"
    }

    const currentSong = document.getElementById("currentSong")
    if (currentSong && this.playlist[this.currentIndex]) {
      currentSong.textContent = this.playlist[this.currentIndex].name
    }
  }
}

// Global player instance
let player

// Sahifa yuklanganda ishga tushirish
document.addEventListener("DOMContentLoaded", async () => {
  player = new MusicPlayer()
  await player.init()
})
