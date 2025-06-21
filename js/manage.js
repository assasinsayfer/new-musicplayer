// Song Management functionality
class SongManager {
  constructor() {
    this.init()
  }

  init() {
    this.modal = document.getElementById("manageModal")
    this.manageBtn = document.getElementById("manageBtn")
    this.closeBtn = document.querySelector(".close-manage")
    this.confirmModal = document.getElementById("confirmModal")

    this.setupEventListeners()
    this.setupTabs()
  }

  setupEventListeners() {
    // Open/Close modal
    this.manageBtn.addEventListener("click", () => this.openModal())
    this.closeBtn.addEventListener("click", () => this.closeModal())

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.closeModal()
      }
      if (e.target === this.confirmModal) {
        this.closeConfirmModal()
      }
    })

    // Clear all songs button
    document.getElementById("clearAllBtn").addEventListener("click", () => {
      this.confirmAction(
        "Barcha Qo'shiqlarni O'chirish",
        "Barcha yuklangan qo'shiqlar o'chiriladi. Bu amalni qaytarib bo'lmaydi!",
        () => this.clearAllSongs(),
      )
    })

    // Confirmation modal buttons
    document.getElementById("confirmYes").addEventListener("click", () => this.executeConfirmedAction())
    document.getElementById("confirmNo").addEventListener("click", () => this.closeConfirmModal())
  }

  setupTabs() {
    const tabBtns = document.querySelectorAll(".tab-btn")
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabName = btn.dataset.tab
        this.switchTab(tabName)
      })
    })
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"))
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active")

    // Update tab content
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.style.display = "none"
    })

    if (tabName === "custom") {
      document.getElementById("customTab").style.display = "block"
      this.loadSongsList()
    } else if (tabName === "settings") {
      document.getElementById("settingsTab").style.display = "block"
      this.loadSettings()
    }
  }

  openModal() {
    this.modal.style.display = "block"
    document.body.style.overflow = "hidden"

    // Hide action buttons
    const actionButtons = document.querySelector(".action-buttons")
    if (actionButtons) {
      actionButtons.style.display = "none"
    }

    // Load songs list by default
    this.switchTab("custom")
  }

  closeModal() {
    this.modal.style.display = "none"
    document.body.style.overflow = "auto"

    // Show action buttons
    const actionButtons = document.querySelector(".action-buttons")
    if (actionButtons) {
      actionButtons.style.display = "flex"
    }
  }

  loadSongsList() {
    const songsList = document.getElementById("songsList")
    const emptyState = document.getElementById("emptyState")
    const customSongs = this.getSavedSongs()

    if (customSongs.length === 0) {
      songsList.innerHTML = ""
      emptyState.style.display = "block"
      return
    }

    emptyState.style.display = "none"
    songsList.innerHTML = customSongs.map((song) => this.createSongItem(song)).join("")

    // Add event listeners to delete buttons
    songsList.querySelectorAll(".delete-song").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const songId = e.target.closest(".song-item").dataset.songId
        const songName = e.target.closest(".song-item").dataset.songName
        this.confirmAction("Qo'shiqni O'chirish", `"${songName}" qo'shig'ini o'chirishni xohlaysizmi?`, () =>
          this.deleteSong(songId),
        )
      })
    })

    // Add event listeners to play buttons
    songsList.querySelectorAll(".play-song").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const songName = e.target.closest(".song-item").dataset.songName
        this.playSong(songName)
      })
    })
  }

  createSongItem(song) {
    const date = new Date(song.dateAdded).toLocaleDateString("uz-UZ")
    const audioSize = this.formatFileSize(song.audio.length * 0.75) // Approximate size
    const imageSize = this.formatFileSize(song.image.length * 0.75)

    return `
      <div class="song-item" data-song-id="${song.id}" data-song-name="${song.name}">
        <div class="song-cover">
          <img src="${song.image}" alt="${song.name}" onerror="this.src='/placeholder.svg?height=50&width=50'">
        </div>
        <div class="song-info">
          <h4>${song.name}</h4>
          <p class="song-meta">
            <i class="fas fa-calendar"></i> ${date}
            <span class="separator">•</span>
            <i class="fas fa-file-audio"></i> ${audioSize}
            <span class="separator">•</span>
            <i class="fas fa-file-image"></i> ${imageSize}
          </p>
        </div>
        <div class="song-actions">
          <button class="play-song action-btn-small" title="Ijro etish">
            <i class="fas fa-play"></i>
          </button>
          <button class="delete-song action-btn-small danger" title="O'chirish">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `
  }

  loadSettings() {
    // Update storage info
    const storageUsed = document.getElementById("storageUsed")
    const lastUpdate = document.getElementById("lastUpdate")

    const customSongs = this.getSavedSongs()
    const totalSize = this.calculateStorageSize()

    storageUsed.textContent = this.formatFileSize(totalSize)

    if (customSongs.length > 0) {
      const latestSong = customSongs.reduce((latest, song) =>
        new Date(song.dateAdded) > new Date(latest.dateAdded) ? song : latest,
      )
      lastUpdate.textContent = new Date(latestSong.dateAdded).toLocaleString("uz-UZ")
    } else {
      lastUpdate.textContent = "Hech qachon"
    }
  }

  confirmAction(title, message, action) {
    this.pendingAction = action
    document.getElementById("confirmTitle").textContent = title
    document.getElementById("confirmMessage").textContent = message
    this.confirmModal.style.display = "block"
  }

  executeConfirmedAction() {
    if (this.pendingAction) {
      this.pendingAction()
      this.pendingAction = null
    }
    this.closeConfirmModal()
  }

  closeConfirmModal() {
    this.confirmModal.style.display = "none"
  }

  deleteSong(songId) {
    try {
      const customSongs = this.getSavedSongs()
      const updatedSongs = customSongs.filter((song) => song.id != songId)

      localStorage.setItem("customSongs", JSON.stringify(updatedSongs))

      // Update UI
      this.loadSongsList()
      this.showMessage("Qo'shiq muvaffaqiyatli o'chirildi!", "success")

      // Update main player
      if (window.updateSongsList) {
        window.updateSongsList()
      }

      // Update upload modal storage info
      if (window.musicUploader) {
        window.musicUploader.updateStorageInfo()
      }
    } catch (error) {
      this.showMessage("Qo'shiqni o'chirishda xatolik!", "error")
    }
  }

  clearAllSongs() {
    try {
      localStorage.removeItem("customSongs")

      // Update UI
      this.loadSongsList()
      this.loadSettings()
      this.showMessage("Barcha qo'shiqlar o'chirildi!", "success")

      // Update main player
      if (window.updateSongsList) {
        window.updateSongsList()
      }

      // Update upload modal storage info
      if (window.musicUploader) {
        window.musicUploader.updateStorageInfo()
      }
    } catch (error) {
      this.showMessage("Qo'shiqlarni o'chirishda xatolik!", "error")
    }
  }

  playSong(songName) {
    // Close modal and play the selected song
    this.closeModal()

    if (window.playSpecificSong) {
      window.playSpecificSong(songName)
    }
  }

  getSavedSongs() {
    try {
      const data = localStorage.getItem("customSongs")
      if (!data) return []
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error("Error reading saved songs:", error)
      return []
    }
  }

  calculateStorageSize() {
    try {
      const customSongs = JSON.stringify(this.getSavedSongs())
      return customSongs.length * 2 // Approximate bytes (UTF-16)
    } catch {
      return 0
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  showMessage(text, type) {
    // Create and show message
    const message = document.createElement("div")
    message.className = `message ${type} floating-message`
    message.textContent = text

    document.body.appendChild(message)

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message)
      }
    }, 3000)
  }
}

// Initialize song manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.songManager = new SongManager()
})
