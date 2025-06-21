class MusicStorageManager {
  constructor() {
    this.dbName = "MusicPlayerDB"
    this.version = 1
    this.db = null
  }

  // IndexedDB ni ishga tushirish
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Audio fayllar uchun store
        if (!db.objectStoreNames.contains("audioFiles")) {
          const audioStore = db.createObjectStore("audioFiles", { keyPath: "id" })
          audioStore.createIndex("name", "name", { unique: false })
        }

        // Playlist uchun store
        if (!db.objectStoreNames.contains("playlists")) {
          const playlistStore = db.createObjectStore("playlists", { keyPath: "id" })
          playlistStore.createIndex("name", "name", { unique: false })
        }
      }
    })
  }

  // Audio fayl qo'shish
  async addAudioFile(file, metadata) {
    const transaction = this.db.transaction(["audioFiles"], "readwrite")
    const store = transaction.objectStore("audioFiles")

    const audioData = {
      id: Date.now().toString(),
      name: metadata.name || file.name,
      file: file, // File object saqlanadi
      size: file.size,
      type: file.type,
      addedDate: new Date().toISOString(),
    }

    return store.add(audioData)
  }

  // Playlist boshqaruvi
  async savePlaylist(playlistData) {
    // Kichik ma'lumotlar localStorage da
    localStorage.setItem(
      "currentPlaylist",
      JSON.stringify({
        name: playlistData.name,
        songIds: playlistData.songIds,
        currentIndex: playlistData.currentIndex || 0,
      }),
    )

    // To'liq playlist IndexedDB da
    const transaction = this.db.transaction(["playlists"], "readwrite")
    const store = transaction.objectStore("playlists")
    return store.put(playlistData)
  }

  // Audio fayl olish
  async getAudioFile(id) {
    const transaction = this.db.transaction(["audioFiles"], "readonly")
    const store = transaction.objectStore("audioFiles")

    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Barcha audio fayllar ro'yxati
  async getAllAudioFiles() {
    const transaction = this.db.transaction(["audioFiles"], "readonly")
    const store = transaction.objectStore("audioFiles")

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Audio fayl o'chirish
  async deleteAudioFile(id) {
    const transaction = this.db.transaction(["audioFiles"], "readwrite")
    const store = transaction.objectStore("audioFiles")
    return store.delete(id)
  }
}
