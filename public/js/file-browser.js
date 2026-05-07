// File browser state
let fileBrowserState = {
  currentPath: null,
  selectedPath: null,
  breadcrumb: [],
  commonPaths: []
};

/**
 * Initialize file browser on page load
 */
async function initializeFileBrowser() {
  try {
    const response = await fetch('/api/browser/common-paths');
    fileBrowserState.commonPaths = await response.json();
  } catch (error) {
    console.error('Failed to load common paths:', error);
  }
}

/**
 * Browse directory
 */
async function browseDirectory(dirPath) {
  try {
    const response = await fetch(`/api/browser/browse?path=${encodeURIComponent(dirPath)}&depth=1`);
    
    if (!response.ok) {
      const error = await response.json();
      showNotification(error.error, 'error');
      return null;
    }

    const data = await response.json();
    fileBrowserState.currentPath = data.path;
    
    // Update breadcrumb
    updateBreadcrumb(data.path);
    
    return data;
  } catch (error) {
    showNotification(`خطا در مرور پوشه - Error browsing directory: ${error.message}`, 'error');
    return null;
  }
}

/**
 * Update breadcrumb navigation
 */
function updateBreadcrumb(dirPath) {
  const parts = dirPath.split('/').filter(p => p);
  fileBrowserState.breadcrumb = ['/', ...parts];
}

/**
 * Show file browser modal
 */
async function showFileBrowser(callback) {
  const homeDir = fileBrowserState.commonPaths[0]?.path || '/home';
  const browserContent = `
    <h2>انتخاب پوشه پروژه - Select Project Folder</h2>
    
    <div class="file-browser">
      <!-- Common paths -->
      <div class="browser-shortcuts">
        <h3>میانبرها - Shortcuts</h3>
        <div class="shortcuts-grid">
          ${fileBrowserState.commonPaths.map(p => `
            <button class="shortcut-btn" onclick="browseDirectoryCallback('${p.path}')">
              <i class="fas fa-${p.icon}"></i>
              <span>${p.name}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Breadcrumb -->
      <div class="breadcrumb-nav">
        <span id="browser-path" class="current-path"></span>
        <input type="text" id="path-input" placeholder="یا مسیری را وارد کنید - Or enter a path..." style="flex: 1; padding: 8px; margin: 0 10px; border-radius: 4px; border: 1px solid var(--border-color);">
        <button onclick="browseDirectoryCallback(document.getElementById('path-input').value)" class="btn btn-sm btn-info">
          رفتن - Go
        </button>
      </div>

      <!-- File list -->
      <div id="browser-contents" class="browser-contents" style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 4px;">
        <div style="text-align: center; padding: 20px; color: #999;">
          <i class="fas fa-spinner fa-spin"></i> در حال بارگذاری...
        </div>
      </div>

      <!-- Selected path display -->
      <div style="margin-top: 15px; padding: 10px; background: var(--light-color); border-radius: 4px;">
        <strong>انتخاب شده - Selected:</strong>
        <div id="selected-path-display" style="word-break: break-all;">هیچ کدام - None</div>
      </div>

      <!-- Buttons -->
      <div style="margin-top: 15px; text-align: left;">
        <button class="btn btn-success" onclick="confirmPathSelection('${callback}')" ${!fileBrowserState.selectedPath ? 'disabled' : ''}>
          <i class="fas fa-check"></i> تایید - Confirm
        </button>
        <button class="btn btn-secondary" onclick="closeModal()">
          <i class="fas fa-times"></i> بازگشت - Cancel
        </button>
      </div>
    </div>
  `;

  showModal(browserContent);
  
  // Load home directory
  await browseDirectoryCallback(homeDir);
}

/**
 * Callback for browsing directory
 */
async function browseDirectoryCallback(dirPath) {
  if (!dirPath) {
    showNotification('مسیری وارد نشده - Please enter a path', 'error');
    return;
  }

  const data = await browseDirectory(dirPath);
  if (!data) return;

  // Update path input
  document.getElementById('path-input').value = data.path;
  document.getElementById('browser-path').textContent = data.path;

  // Display contents
  const contentsHtml = `
    ${data.parent ? `
      <div class="browser-item parent" onclick="browseDirectoryCallback('${data.parent}')">
        <i class="fas fa-arrow-up"></i>
        <span>بالا رو برو - Go Up</span>
      </div>
    ` : ''}
    ${data.contents.map(item => `
      <div class="browser-item ${item.type}" ondblclick="selectPath('${item.path}')" onclick="selectPathPreview('${item.path}')">
        <i class="fas fa-${item.type === 'directory' ? 'folder' : 'file'}"></i>
        <span>${item.name}</span>
      </div>
    `).join('')}
  `;

  document.getElementById('browser-contents').innerHTML = contentsHtml || '<div style="padding: 20px; text-align: center; color: #999;">پوشه خالی - Empty</div>';
}

/**
 * Preview path selection
 */
function selectPathPreview(path) {
  fileBrowserState.selectedPath = path;
  document.getElementById('selected-path-display').textContent = path;
  
  // Highlight selected
  document.querySelectorAll('.browser-item').forEach(item => {
    item.classList.remove('selected');
  });
  event.currentTarget.classList.add('selected');
}

/**
 * Confirm path selection
 */
async function selectPath(dirPath) {
  selectPathPreview(dirPath);
  
  // Verify the path
  try {
    const response = await fetch('/api/browser/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: dirPath })
    });

    if (!response.ok) {
      const error = await response.json();
      showNotification(`خطا - ${error.error}`, 'error');
      return;
    }

    const verification = await response.json();
    
    // Populate form with suggestions
    document.getElementById('project-path').value = dirPath;
    
    if (verification.suggestions) {
      document.getElementById('start-command').value = verification.suggestions.startCommand;
      if (verification.suggestions.stopCommand) {
        document.getElementById('stop-command').value = verification.suggestions.stopCommand;
      }
    }

    if (verification.projectType) {
      document.getElementById('project-type-display').textContent = verification.projectType.name;
    }

    showNotification(`پوشه تایید شد - Path verified successfully`, 'success');
    closeModal();
  } catch (error) {
    showNotification(`خطا - ${error.message}`, 'error');
  }
}

/**
 * Confirm path selection from callback
 */
async function confirmPathSelection(callback) {
  if (!fileBrowserState.selectedPath) {
    showNotification('مسیری انتخاب نشده - Please select a path', 'error');
    return;
  }

  await selectPath(fileBrowserState.selectedPath);
}

/**
 * Open file browser for path selection
 */
function openPathBrowser() {
  showFileBrowser('selectPath');
}

/**
 * Verify and show path details
 */
async function verifyPath(pathInput) {
  const path = pathInput.value;
  
  if (!path) {
    document.getElementById('path-verification').innerHTML = '';
    return;
  }

  try {
    const response = await fetch('/api/browser/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });

    if (!response.ok) {
      const error = await response.json();
      document.getElementById('path-verification').innerHTML = `
        <div class="alert alert-error">
          <i class="fas fa-exclamation-circle"></i> ${error.error}
          ${error.errors ? `<ul>${error.errors.map(e => `<li>${e}</li>`).join('')}</ul>` : ''}
        </div>
      `;
      return;
    }

    const verification = await response.json();
    
    let html = `
      <div class="alert alert-success">
        <i class="fas fa-check-circle"></i> مسیر معتبر است - Path is valid
      </div>
      <div class="verification-details">
        <div><strong>نوع پروژه:</strong> ${verification.projectType?.name || 'نامشخص'}</div>
    `;

    if (verification.warnings && verification.warnings.length > 0) {
      html += `
        <div class="alert alert-warning">
          <strong>اخطارها - Warnings:</strong>
          <ul>${verification.warnings.map(w => `<li>${w}</li>`).join('')}</ul>
        </div>
      `;
    }

    if (verification.suggestions) {
      html += `
        <div style="margin-top: 10px;">
          <strong>پیشنهادها - Suggestions:</strong>
          <div>دستور شروع: <code>${verification.suggestions.startCommand}</code></div>
          ${verification.suggestions.stopCommand ? `<div>دستور متوقف: <code>${verification.suggestions.stopCommand}</code></div>` : ''}
        </div>
      `;
    }

    html += '</div>';
    document.getElementById('path-verification').innerHTML = html;

    // Auto-fill suggestions
    if (verification.suggestions) {
      document.getElementById('start-command').value = verification.suggestions.startCommand;
      if (verification.suggestions.stopCommand) {
        document.getElementById('stop-command').value = verification.suggestions.stopCommand;
      }
    }
  } catch (error) {
    document.getElementById('path-verification').innerHTML = `
      <div class="alert alert-error">
        <i class="fas fa-exclamation-circle"></i> خطا - Error: ${error.message}
      </div>
    `;
  }
}

// Initialize file browser on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  initializeFileBrowser();
});
