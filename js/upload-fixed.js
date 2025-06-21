// Upload functionality - MOBILE OPTIMIZED VERSION
class MusicUploader {
  constructor() {
    this.maxSongs = 15
    this.maxAudioSize = 5 * 1024 * 1024 // 5MB for mobile
    this.maxImageSize = 1 * 1024 * 1024 // 1MB for mobile
    this.init()
  }

  init() {
    this.modal = document.getElementById("uploadModal")
    this.uploadBtn = document.getElementById("uploadBtn")
    this.closeBtn = document.querySelector(".close")
    this.cancelBtn = document.querySelector(".cancel-btn")
    this.uploadForm = document.getElementById("uploadForm")

    this.setupEventListeners()
    this.updateStorageInfo()
    this.checkStorageHealth()
    this.setupMobileOptimizations()
  }

  setupMobileOptimizations() {
    // Mobile-specific optimizations
    const audioInput = document.getElementById("audioFile")
    const imageInput = document.getElementById("imageFile")

    // Remove accept attribute restrictions for mobile
    if (this.isMobile()) {
      audioInput.removeAttribute("accept")
      imageInput.removeAttribute("accept")

      // Add mobile-friendly file selection
      audioInput.setAttribute("capture", "environment")
      imageInput.setAttribute("capture", "environment")
    }

    // Add file change listeners for immediate validation
    audioInput.addEventListener("change", (e) => this.validateFileOnSelect(e, "audio"))
    imageInput.addEventListener("change", (e) => this.validateFileOnSelect(e, "image"))
  }

  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  validateFileOnSelect(e, type) {
    const file = e.target.files[0]
    if (!file) return

    const fileName = file.name.toLowerCase()
    const fileSize = file.size

    if (type === "audio") {
      // Check by file extension for mobile compatibility
      const audioExtensions = [".mp3", ".m4a", ".wav", ".aac", ".ogg", ".mpeg"]
      const isValidAudio = audioExtensions.some((ext) => fileName.endsWith(ext))

      if (!isValidAudio) {
        this.showFileError("Audio fayl MP3, M4A, WAV, AAC, OGG formatida bo'lishi kerak!")
        e.target.value = ""
        return
      }

      if (fileSize > this.maxAudioSize) {
        this.showFileError(`Audio fayl ${this.maxAudioSize / (1024 * 1024)}MB dan kichik bo'lishi kerak!`)
        e.target.value = ""
        return
      }

      this.showFileSuccess("Audio fayl muvaffaqiyatli tanlandi ✅")
    }

    if (type === "image") {
      // Check by file extension for mobile compatibility
      const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".bmp"]
      const isValidImage = imageExtensions.some((ext) => fileName.endsWith(ext))

      if (!isValidImage) {
        this.showFileError("Rasm JPG, PNG, WEBP formatida bo'lishi kerak!")
        e.target.value = ""
        return
      }

      if (fileSize > this.maxImageSize) {
        this.showFileError(`Rasm ${this.maxImageSize / (1024 * 1024)}MB dan kichik bo'lishi kerak!`)
        e.target.value = ""
        return
      }

      this.showFileSuccess("Rasm muvaffaqiyatli tanlandi ✅")
    }
  }

  showFileError(message) {
    this.clearFileMessages()
    const errorDiv = document.createElement("div")
    errorDiv.className = "file-message error"
    errorDiv.textContent = message

    const form = document.getElementById("uploadForm")
    form.appendChild(errorDiv)

    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv)
      }
    }, 4000)
  }

  showFileSuccess(message) {
    this.clearFileMessages()
    const successDiv = document.createElement("div")
    successDiv.className = "file-message success"
    successDiv.textContent = message

    const form = document.getElementById("uploadForm")
    form.appendChild(successDiv)

    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv)
      }
    }, 2000)
  }

  clearFileMessages() {
    const messages = document.querySelectorAll(".file-message")
    messages.forEach((msg) => msg.remove())
  }

  setupEventListeners() {
    // Modal controls
    this.uploadBtn.addEventListener("click", () => this.openModal())
    this.closeBtn.addEventListener("click", () => this.closeModal())
    this.cancelBtn.addEventListener("click", () => this.closeModal())

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.closeModal()
      }
    })

    // Mobile-friendly touch events
    if (this.isMobile()) {
      this.modal.addEventListener("touchstart", (e) => {
        if (e.target === this.modal) {
          this.closeModal()
        }
      })
    }

    // Form submission
    this.uploadForm.addEventListener("submit", (e) => this.handleUpload(e))
  }

  openModal() {
    this.modal.style.display = "block"
    document.body.style.overflow = "hidden"

    // Hide action buttons when modal is open
    const actionButtons = document.querySelector(".action-buttons")
    if (actionButtons) {
      actionButtons.style.display = "none"
    }

    // Mobile keyboard handling
    if (this.isMobile()) {
      setTimeout(() => {
        const songNameInput = document.getElementById("songName")
        if (songNameInput) {
          songNameInput.focus()
        }
      }, 300)
    }
  }

  closeModal() {
    this.modal.style.display = "none"
    document.body.style.overflow = "auto"
    this.uploadForm.reset()
    this.clearMessages()
    this.clearFileMessages()

    // Show action buttons when modal is closed
    const actionButtons = document.querySelector(".action-buttons")
    if (actionButtons) {
      actionButtons.style.display = "flex"
    }
  }

  async handleUpload(e) {
    e.preventDefault()

    const songName = document.getElementById("songName").value.trim()
    const audioFile = document.getElementById("audioFile").files[0]
    const imageFile = document.getElementById("imageFile").files[0]

    // Show loading
    this.showMessage("Yuklanmoqda... ⏳", "info")

    // Enhanced validation for mobile
    if (!this.validateInputMobile(songName, audioFile, imageFile)) {
      return
    }

    try {
      await this.saveSong(songName, audioFile, imageFile)
      this.showMessage("Qo'shiq muvaffaqiyatli qo'shildi! 🎵✅", "success")
      this.updateStorageInfo()

      // Update main player
      if (window.updateSongsList) {
        window.updateSongsList()
      }

      // Auto close on mobile after success
      if (this.isMobile()) {
        setTimeout(() => this.closeModal(), 1500)
      } else {
        setTimeout(() => this.closeModal(), 2000)
      }
    } catch (error) {
      console.error("Upload error:", error)
      this.showMessage("Xatolik: " + error.message, "error")
    }
  }

  validateInputMobile(songName, audioFile, imageFile) {
    // Check storage limit
    const savedSongs = this.getSavedSongs()
    if (savedSongs.length >= this.maxSongs) {
      this.showMessage(`Maksimal ${this.maxSongs} ta qo'shiq saqlash mumkin!`, "error")
      return false
    }

    // Check song name
    if (!songName || songName.length < 2) {
      this.showMessage("Qo'shiq nomi kamida 2 ta harf bo'lishi kerak!", "error")
      return false
    }

    // Check if song already exists
    if (savedSongs.some((song) => song.name.toLowerCase() === songName.toLowerCase())) {
      this.showMessage("Bu nomda qo'shiq allaqachon mavjud!", "error")
      return false
    }

    // Enhanced file validation for mobile
    if (!audioFile) {
      this.showMessage("Audio fayl tanlang!", "error")
      return false
    }

    if (!imageFile) {
      this.showMessage("Rasm fayl tanlang!", "error")
      return false
    }

    // File extension validation (more reliable on mobile)
    const audioFileName = audioFile.name.toLowerCase()
    const imageFileName = imageFile.name.toLowerCase()

    const audioExtensions = [".mp3", ".m4a", ".wav", ".aac", ".ogg", ".mpeg"]
    const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".bmp"]

    const isValidAudio = audioExtensions.some((ext) => audioFileName.endsWith(ext))
    const isValidImage = imageExtensions.some((ext) => imageFileName.endsWith(ext))

    if (!isValidAudio) {
      this.showMessage("Audio fayl MP3, M4A, WAV, AAC, OGG formatida bo'lishi kerak!", "error")
      return false
    }

    if (!isValidImage) {
      this.showMessage("Rasm JPG, PNG, WEBP formatida bo'lishi kerak!", "error")
      return false
    }

    // File size validation
    if (audioFile.size > this.maxAudioSize) {
      this.showMessage(`Audio fayl ${this.maxAudioSize / (1024 * 1024)}MB dan kichik bo'lishi kerak!`, "error")
      return false
    }

    if (imageFile.size > this.maxImageSize) {
      this.showMessage(`Rasm ${this.maxImageSize / (1024 * 1024)}MB dan kichik bo'lishi kerak!`, "error")
      return false
    }

    // Additional mobile-specific checks
    if (audioFile.size < 1000) {
      this.showMessage("Audio fayl juda kichik! To'g'ri fayl tanlang.", "error")
      return false
    }

    if (imageFile.size < 500) {
      this.showMessage("Rasm juda kichik! To'g'ri rasm tanlang.", "error")
      return false
    }

    return true
  }

  // Enhanced image compression for mobile
  compressImage(file, maxWidth = 400, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img

        // More aggressive compression for mobile
        if (this.isMobile()) {
          maxWidth = 300
          quality = 0.7
        }

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(resolve, "image/jpeg", quality)
      }

      img.onerror = () => {
        // If image loading fails, return original file
        resolve(file)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  async saveSong(songName, audioFile, imageFile) {
    return new Promise(async (resolve, reject) => {
      try {
        // Compress image first
        const compressedImage = await this.compressImage(imageFile)

        const audioReader = new FileReader()
        const imageReader = new FileReader()

        let audioData = null
        let imageData = null
        let completed = 0

        const checkComplete = () => {
          completed++
          if (completed === 2) {
            try {
              const songData = {
                name: songName,
                audio: audioData,
                image: imageData,
                dateAdded: new Date().toISOString(),
                id: Date.now(),
                fileSize: audioFile.size,
                imageSize: compressedImage.size || imageFile.size,
              }

              // Test localStorage space with better error handling
              const testData = JSON.stringify(songData)
              try {
                localStorage.setItem("test_storage_" + Date.now(), testData)
                localStorage.removeItem("test_storage_" + Date.now())
              } catch (storageError) {
                console.error("Storage test failed:", storageError)
                throw new Error("Xotira to'lgan! Ba'zi qo'shiqlarni o'chiring.")
              }

              const savedSongs = this.getSavedSongs()
              savedSongs.push(songData)

              localStorage.setItem("customSongs", JSON.stringify(savedSongs))
              resolve()
            } catch (error) {
              console.error("Save error:", error)
              reject(new Error("Ma'lumotlarni saqlashda xatolik: " + error.message))
            }
          }
        }

        const handleError = (error) => {
          console.error("File read error:", error)
          reject(new Error("Faylni o'qishda xatolik"))
        }

        audioReader.onload = (e) => {
          audioData = e.target.result
          checkComplete()
        }

        imageReader.onload = (e) => {
          imageData = e.target.result
          checkComplete()
        }

        audioReader.onerror = handleError
        imageReader.onerror = handleError

        // Start reading files
        audioReader.readAsDataURL(audioFile)
        imageReader.readAsDataURL(compressedImage)
      } catch (error) {
        reject(error)
      }
    })
  }

  getSavedSongs() {
    try {
      const data = localStorage.getItem("customSongs")
      if (!data) return []

      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error("Error reading saved songs:", error)
      localStorage.removeItem("customSongs")
      return []
    }
  }

  checkStorageHealth() {
    try {
      const songs = this.getSavedSongs()
      console.log(`Loaded ${songs.length} songs from storage`)

      const validSongs = songs.filter((song) => song && song.name && song.audio && song.image)

      if (validSongs.length !== songs.length) {
        console.log("Found corrupted songs, cleaning up...")
        localStorage.setItem("customSongs", JSON.stringify(validSongs))
      }
    } catch (error) {
      console.error("Storage health check failed:", error)
      localStorage.removeItem("customSongs")
    }
  }

  updateStorageInfo() {
    const savedSongs = this.getSavedSongs()
    const songCount = document.getElementById("songCount")
    const storageProgress = document.getElementById("storageProgress")

    if (songCount) {
      songCount.textContent = savedSongs.length
    }

    if (storageProgress) {
      const percentage = (savedSongs.length / this.maxSongs) * 100
      storageProgress.style.width = `${percentage}%`
    }
  }

  showMessage(text, type) {
    this.clearMessages()

    const message = document.createElement("div")
    message.className = `message ${type}`
    message.textContent = text

    const form = document.getElementById("uploadForm")
    form.appendChild(message)

    // Longer display time for mobile
    const displayTime = this.isMobile() ? 6000 : 5000

    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message)
      }
    }, displayTime)
  }

  clearMessages() {
    const messages = document.querySelectorAll(".message")
    messages.forEach((msg) => msg.remove())
  }

  clearAllSongs() {
    localStorage.removeItem("customSongs")
    this.updateStorageInfo()
    if (window.updateSongsList) {
      window.updateSongsList()
    }
  }
}

// Initialize uploader when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.musicUploader = new MusicUploader()
})
