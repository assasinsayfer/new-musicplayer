// Helper Modal functionality - MOBILE OPTIMIZED
class HelpModal {
  constructor() {
    this.init()
  }

  init() {
    this.modal = document.getElementById("helperModal")
    this.openBtn = document.getElementById("openModalBtn")
    this.closeBtn = document.getElementById("closeModalBtn")

    this.setupEventListeners()
  }

  setupEventListeners() {
    // Open modal
    this.openBtn.addEventListener("click", () => this.openModal())

    // Close modal
    this.closeBtn.addEventListener("click", () => this.closeModal())

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.closeModal()
      }
    })

    // Close modal with Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.style.display === "flex") {
        this.closeModal()
      }
    })
  }

  openModal() {
    this.modal.style.display = "flex"
    document.body.style.overflow = "hidden"

    // Hide action buttons when modal is open
    const actionButtons = document.querySelector(".action-buttons")
    if (actionButtons) {
      actionButtons.style.display = "none"
    }

    // Add entrance animation
    const content = this.modal.querySelector(".modal-helper-content")
    content.style.animation = "modalSlideIn 0.3s ease-out"
  }

  closeModal() {
    this.modal.style.display = "none"
    document.body.style.overflow = "auto"

    // Show action buttons when modal is closed
    const actionButtons = document.querySelector(".action-buttons")
    if (actionButtons) {
      actionButtons.style.display = "flex"
    }
  }
}

// Initialize help modal when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new HelpModal()
})
