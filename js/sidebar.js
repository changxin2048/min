var settings = require('util/settings/settings.js')
var webviews = require('webviews.js')

var MIN_WIDTH = 150
var MAX_WIDTH = 500

var DEFAULT_BOOKMARKS = [
  { url: 'https://doubao.com', title: 'Doubao', icon: 'ri-robot-2-line' },
  { url: 'https://chat.deepseek.com', title: 'DeepSeek', icon: 'ri-chat-ai-line' },
  { url: 'https://kimi.ai', title: 'Kimi', icon: 'ri-planet-line' }
]

var sidebar = {
  element: document.getElementById('sidebar'),
  toggleButton: document.getElementById('sidebar-toggle'),
  resizeHandle: document.getElementById('sidebar-resize-handle'),
  settingsButton: document.getElementById('sidebar-settings'),
  bookmarksContainer: document.getElementById('sidebar-bookmarks'),
  isCollapsed: false,
  width: 250,

  initialize: function () {
    // Load saved width from settings
    var savedWidth = settings.get('sidebarWidth')
    if (savedWidth && savedWidth >= MIN_WIDTH) {
      this.width = savedWidth
    }

    // Load saved state from settings
    var savedState = settings.get('sidebarCollapsed')
    if (savedState === true) {
      this.collapse()
    } else {
      this.setWidth(this.width, false)
      this.expand()
    }

    // Load bookmarks
    this.loadBookmarks()

    // Add event listener for toggle button
    this.toggleButton.addEventListener('click', function () {
      sidebar.toggle()
    })

    // Add event listener for settings button
    this.settingsButton.addEventListener('click', function () {
      webviews.update(tabs.getSelected(), 'min://settings')
    })

    // Add keyboard shortcut (Ctrl/Cmd + B)
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        sidebar.toggle()
      }
    })

    // Add resize drag logic
    this.resizeHandle.addEventListener('mousedown', function (e) {
      e.preventDefault()
      sidebar.startResize(e)
    })

    // Add class to body to indicate sidebar is present
    document.body.classList.add('has-sidebar')
    if (this.isCollapsed) {
      document.body.classList.add('sidebar-collapsed')
    }

    // Listen for bookmark changes
    settings.listen('sidebarBookmarks', function () {
      sidebar.loadBookmarks()
    })
  },

  loadBookmarks: function () {
    var bookmarks = settings.get('sidebarBookmarks') || DEFAULT_BOOKMARKS
    this.bookmarksContainer.innerHTML = ''

    bookmarks.forEach(function (bookmark) {
      var link = document.createElement('a')
      link.className = 'sidebar-item sidebar-bookmark'
      link.href = bookmark.url
      link.dataset.url = bookmark.url

      var icon = document.createElement('i')
      icon.className = bookmark.icon || 'ri-links-line'

      var span = document.createElement('span')
      span.textContent = bookmark.title || bookmark.url

      link.appendChild(icon)
      link.appendChild(span)

      link.addEventListener('click', function (e) {
        e.preventDefault()
        webviews.update(tabs.getSelected(), bookmark.url)
      })

      sidebar.bookmarksContainer.appendChild(link)
    })
  },

  setWidth: function (width, animate) {
    this.width = width
    document.body.style.setProperty('--sidebar-width', width + 'px')
    if (!animate) {
      // If no animation needed, we still let CSS handle it via class toggles
    }
  },

  toggle: function () {
    if (this.isCollapsed) {
      this.expand()
    } else {
      this.collapse()
    }
  },

  collapse: function () {
    this.isCollapsed = true
    this.element.classList.add('collapsed')
    document.body.classList.add('sidebar-collapsed')
    settings.set('sidebarCollapsed', true)
    this.resizeWebviews()
  },

  expand: function () {
    this.isCollapsed = false
    this.element.classList.remove('collapsed')
    document.body.classList.remove('sidebar-collapsed')
    settings.set('sidebarCollapsed', false)
    this.resizeWebviews()
  },

  startResize: function (e) {
    var startX = e.clientX
    var startWidth = this.width
    var navbar = document.getElementById('navbar')
    var webviews = document.getElementById('webviews')

    this.element.classList.add('resizing')
    if (navbar) navbar.classList.add('navbar-resizing')
    if (webviews) webviews.classList.add('webviews-resizing')

    function onMouseMove (e) {
      var newWidth = startWidth + (e.clientX - startX)
      newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth))
      sidebar.setWidth(newWidth, false)
    }

    function onMouseUp (e) {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)

      sidebar.element.classList.remove('resizing')
      if (navbar) navbar.classList.remove('navbar-resizing')
      if (webviews) webviews.classList.remove('webviews-resizing')

      var finalWidth = sidebar.width
      if (finalWidth >= MIN_WIDTH) {
        settings.set('sidebarWidth', finalWidth)
      }
      sidebar.resizeWebviews()
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  },

  resizeWebviews: function () {
    if (typeof webviews !== 'undefined' && webviews.resize) {
      webviews.resize()
    }
  },

  getWidth: function () {
    return this.isCollapsed ? 0 : this.width
  }
}

module.exports = sidebar
