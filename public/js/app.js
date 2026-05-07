// Socket.io connection
const socket = io();

// State
let currentPage = 'dashboard';
let projects = [];
let systemInfo = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadProjects();
  loadSystemInfo();
  setupRealtimeUpdates();
  setInterval(loadSystemInfo, 5000); // Update system info every 5 seconds
  setInterval(loadProjects, 3000); // Update projects every 3 seconds
});

// Setup event listeners
function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      navigateTo(page);
    });
  });

  // Form submission
  const form = document.getElementById('add-project-form');
  if (form) {
    form.addEventListener('submit', handleAddProject);
  }

  // Modal close
  document.querySelector('.close').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
  });
}

// Navigation
function navigateTo(page) {
  currentPage = page;

  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.page === page) {
      item.classList.add('active');
    }
  });

  // Update active page
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
  });
  document.getElementById(page).classList.add('active');

  // Load page data
  if (page === 'projects') {
    loadProjectsList();
  } else if (page === 'add-project') {
    resetForm();
  }
}

// Load projects
async function loadProjects() {
  try {
    const response = await fetch('/api/projects');
    projects = await response.json();
    
    updateDashboard();
  } catch (error) {
    console.error('Failed to load projects:', error);
  }
}

// Load projects list page
function loadProjectsList() {
  const container = document.getElementById('projects-container');
  
  if (projects.length === 0) {
    container.innerHTML = '<p class="empty-message">هیچ پروژه ای ایجاد نشده است</p>';
    return;
  }

  container.innerHTML = projects.map(project => `
    <div class="project-item">
      <div class="project-header">
        <div class="project-name">${project.name}</div>
        <span class="project-status ${project.status}">${project.status === 'running' ? '✓ در حال اجرا' : '✗ متوقف'}</span>
      </div>
      <div class="project-path">📁 ${project.path}</div>
      ${project.description ? `<div class="project-desc">${project.description}</div>` : ''}
      <div class="project-actions">
        ${project.status === 'running' ? `
          <button class="btn btn-danger btn-sm" onclick="stopProject(${project.id})">
            <i class="fas fa-stop"></i> متوقف کردن
          </button>
          <button class="btn btn-warning btn-sm" onclick="resetProject(${project.id})">
            <i class="fas fa-redo"></i> ریست
          </button>
        ` : `
          <button class="btn btn-success btn-sm" onclick="startProject(${project.id})">
            <i class="fas fa-play"></i> شروع
          </button>
        `}
        <button class="btn btn-info btn-sm" onclick="viewProjectLogs(${project.id})">
          <i class="fas fa-list"></i> لاگ ها
        </button>
        <button class="btn btn-secondary btn-sm" onclick="editProject(${project.id})">
          <i class="fas fa-edit"></i> ویرایش
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteProject(${project.id})">
          <i class="fas fa-trash"></i> حذف
        </button>
      </div>
    </div>
  `).join('');
}

// Update dashboard
function updateDashboard() {
  const running = projects.filter(p => p.status === 'running');
  
  // Update stats
  document.querySelector('.running-count').textContent = running.length;
  document.querySelector('.total-count').textContent = projects.length;

  // Update running projects
  const runningProjectsContainer = document.getElementById('running-projects');
  if (running.length === 0) {
    runningProjectsContainer.innerHTML = '<p class="empty-message">هیچ پروژه ای در حال اجرا نیست</p>';
  } else {
    runningProjectsContainer.innerHTML = running.map(p => `
      <div class="log-item success">
        <div class="log-time">🟢 ${p.name}</div>
        <div>${p.path}</div>
        <div style="margin-top: 8px;">
          <button class="btn btn-sm btn-danger" onclick="stopProject(${p.id})">متوقف کردن</button>
          <button class="btn btn-sm btn-warning" onclick="resetProject(${p.id})">ریست</button>
        </div>
      </div>
    `).join('');
  }
}

// Load system info
async function loadSystemInfo() {
  try {
    const response = await fetch('/api/system/stats');
    systemInfo = await response.json();

    // Update UI
    const memoryUsed = (systemInfo.memory.used / (1024 ** 3)).toFixed(2);
    const memoryTotal = (systemInfo.memory.total / (1024 ** 3)).toFixed(2);
    const memoryPercent = parseFloat(systemInfo.memory.percentUsed);

    document.getElementById('memory-usage').textContent = `${memoryUsed} / ${memoryTotal} GB`;
    document.getElementById('memory-bar').style.width = memoryPercent + '%';
    document.getElementById('memory-percent').textContent = memoryPercent.toFixed(2) + '%';

    // System page
    const response2 = await fetch('/api/system/info');
    const info = await response2.json();

    document.getElementById('os-info').textContent = info.os;
    document.getElementById('arch-info').textContent = info.arch;
    document.getElementById('cpu-info').textContent = info.cpus + ' CPU';
    document.getElementById('cpu-cores').textContent = info.cpus + ' Cores';
    document.getElementById('memory-total').textContent = (info.memory.total / (1024 ** 3)).toFixed(2) + ' GB';
    document.getElementById('memory-free').textContent = (info.memory.free / (1024 ** 3)).toFixed(2) + ' GB';
    document.getElementById('load-avg').textContent = info.cpus > 0 ? 
      `${systemInfo.loadAverage[0].toFixed(2)} / ${systemInfo.loadAverage[1].toFixed(2)} / ${systemInfo.loadAverage[2].toFixed(2)}` : '-';
  } catch (error) {
    console.error('Failed to load system info:', error);
  }
}

// Start project
async function startProject(projectId) {
  try {
    const response = await fetch(`/api/projects/${projectId}/start`, {
      method: 'POST'
    });
    
    if (response.ok) {
      showNotification('پروژه شروع شد', 'success');
      loadProjects();
    } else {
      const error = await response.json();
      showNotification(error.error, 'error');
    }
  } catch (error) {
    showNotification('خطا در شروع پروژه', 'error');
  }
}

// Stop project
async function stopProject(projectId) {
  if (!confirm('آیا مطمئن هستید؟')) return;

  try {
    const response = await fetch(`/api/projects/${projectId}/stop`, {
      method: 'POST'
    });
    
    if (response.ok) {
      showNotification('پروژه متوقف شد', 'success');
      loadProjects();
    } else {
      const error = await response.json();
      showNotification(error.error, 'error');
    }
  } catch (error) {
    showNotification('خطا در متوقف کردن پروژه', 'error');
  }
}

// Reset project
async function resetProject(projectId) {
  if (!confirm('آیا می خواهید پروژه را ریست کنید؟')) return;

  try {
    const response = await fetch(`/api/projects/${projectId}/reset`, {
      method: 'POST'
    });
    
    if (response.ok) {
      showNotification('پروژه ریست شد', 'success');
      loadProjects();
    } else {
      const error = await response.json();
      showNotification(error.error, 'error');
    }
  } catch (error) {
    showNotification('خطا در ریست کردن پروژه', 'error');
  }
}

// Delete project
async function deleteProject(projectId) {
  if (!confirm('آیا مطمئن هستید؟ این عمل قابل بازگشت نیست')) return;

  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      showNotification('پروژه حذف شد', 'success');
      loadProjects();
    } else {
      const error = await response.json();
      showNotification(error.error, 'error');
    }
  } catch (error) {
    showNotification('خطا در حذف پروژه', 'error');
  }
}

// View project logs
async function viewProjectLogs(projectId) {
  try {
    const response = await fetch(`/api/projects/${projectId}/logs`);
    const logs = await response.json();

    const project = projects.find(p => p.id == projectId);
    const logsHtml = logs.length === 0 
      ? '<p class="empty-message">هیچ لاگی موجود نیست</p>'
      : logs.map(log => `
        <div class="log-item ${log.type}">
          <span class="log-time">${new Date(log.timestamp).toLocaleString('fa-IR')}</span>
          <div>${log.message}</div>
        </div>
      `).join('');

    showModal(`
      <h2>${project.name} - لاگ ها</h2>
      <div style="margin-top: 20px;">
        ${logsHtml}
      </div>
    `);
  } catch (error) {
    showNotification('خطا در بارگذاری لاگ ها', 'error');
  }
}

// Edit project
function editProject(projectId) {
  const project = projects.find(p => p.id == projectId);
  if (!project) return;

  document.getElementById('project-name').value = project.name;
  document.getElementById('project-path').value = project.path;
  document.getElementById('project-desc').value = project.description || '';
  document.getElementById('start-command').value = project.startCommand;
  document.getElementById('stop-command').value = project.stopCommand || '';
  document.getElementById('project-tags').value = project.tags || '';
  
  if (project.projectType) {
    document.getElementById('project-type-display').textContent = `نوع: ${project.projectType}`;
  }

  document.getElementById('add-project-form').dataset.editId = projectId;
  navigateTo('add-project');
}

// Handle add project
async function handleAddProject(e) {
  e.preventDefault();

  const editId = e.target.dataset.editId;
  const tagsInput = document.getElementById('project-tags').value;
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

  // Validation
  const errors = [];
  const name = document.getElementById('project-name').value;
  const path = document.getElementById('project-path').value;
  const startCommand = document.getElementById('start-command').value;

  if (!name || name.trim() === '') errors.push('نام پروژه الزامی است');
  if (!path || path.trim() === '') errors.push('مسیر پروژه الزامی است');
  if (!startCommand || startCommand.trim() === '') errors.push('دستور شروع الزامی است');

  if (errors.length > 0) {
    document.getElementById('form-validation-errors').innerHTML = `
      <div class="alert alert-error">
        <strong>خطاهای اعتبار سنجی:</strong>
        <ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul>
      </div>
    `;
    return;
  }

  document.getElementById('form-validation-errors').innerHTML = '';

  const data = {
    name,
    path,
    description: document.getElementById('project-desc').value,
    startCommand,
    stopCommand: document.getElementById('stop-command').value,
    tags
  };

  try {
    let response;
    if (editId) {
      response = await fetch(`/api/projects/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }

    if (response.ok) {
      showNotification(editId ? 'پروژه به روزرسانی شد' : 'پروژه اضافه شد', 'success');
      resetForm();
      loadProjects();
      navigateTo('projects');
      delete e.target.dataset.editId;
    } else {
      const error = await response.json();
      if (error.validation) {
        document.getElementById('form-validation-errors').innerHTML = `
          <div class="alert alert-error">
            <strong>خطاهای اعتبار سنجی:</strong>
            <ul>${error.validation.errors.map(e => `<li>${e}</li>`).join('')}</ul>
            ${error.validation.warnings.length > 0 ? `
              <strong>اخطارها:</strong>
              <ul>${error.validation.warnings.map(w => `<li>${w}</li>`).join('')}</ul>
            ` : ''}
          </div>
        `;
      } else {
        showNotification(error.error, 'error');
      }
    }
  } catch (error) {
    showNotification('خطا در ذخیره پروژه', 'error');
  }
}

// Reset form
function resetForm() {
  document.getElementById('add-project-form').reset();
  delete document.getElementById('add-project-form').dataset.editId;
}

// Setup realtime updates
function setupRealtimeUpdates() {
  socket.on('project:status', (data) => {
    console.log('Project status update:', data);
    loadProjects();
  });

  socket.on('project:log', (data) => {
    console.log('New log:', data);
  });
}

// Utilities
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function showModal(content) {
  document.getElementById('modal-body').innerHTML = content;
  document.getElementById('modal').classList.add('active');
}

function closeModal() {
  document.getElementById('modal').classList.remove('active');
}

/**
 * Show command suggestions based on project type
 */
async function showCommandSuggestions() {
  const path = document.getElementById('project-path').value;
  
  if (!path) {
    showNotification('ابتدا مسیری انتخاب کنید - Please select a path first', 'error');
    return;
  }

  try {
    const response = await fetch('/api/browser/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });

    if (!response.ok) {
      showNotification('خطا در دریافت پیشنهادها', 'error');
      return;
    }

    const { projectType, suggestions } = await response.json();

    let html = `
      <h3>دستورات پیشنهادی - Suggested Commands</h3>
      <p><strong>نوع پروژه:</strong> ${projectType.name}</p>
      <div style="background: #f5f7fa; padding: 15px; border-radius: 8px;">
    `;

    if (suggestions.startCommand) {
      html += `
        <div style="margin: 10px 0;">
          <strong>دستور شروع:</strong>
          <div style="background: white; padding: 8px; border-radius: 4px; margin-top: 5px; cursor: pointer;" onclick="document.getElementById('start-command').value = '${suggestions.startCommand}'; closeModal(); showNotification('دستور اعمال شد', 'success')">
            <code>${suggestions.startCommand}</code>
          </div>
        </div>
      `;
    }

    if (suggestions.stopCommand) {
      html += `
        <div style="margin: 10px 0;">
          <strong>دستور متوقف:</strong>
          <div style="background: white; padding: 8px; border-radius: 4px; margin-top: 5px; cursor: pointer;" onclick="document.getElementById('stop-command').value = '${suggestions.stopCommand}'; closeModal(); showNotification('دستور اعمال شد', 'success')">
            <code>${suggestions.stopCommand}</code>
          </div>
        </div>
      `;
    }

    if (suggestions.alternates && suggestions.alternates.length > 0) {
      html += `
        <div style="margin-top: 15px;">
          <strong>دستورات دیگر:</strong>
          ${suggestions.alternates.map(cmd => `
            <div style="background: white; padding: 8px; border-radius: 4px; margin-top: 5px; cursor: pointer;" onclick="document.getElementById('start-command').value = '${cmd}'; closeModal(); showNotification('دستور اعمال شد', 'success')">
              <code>${cmd}</code>
            </div>
          `).join('')}
        </div>
      `;
    }

    html += '</div>';

    showModal(html);
  } catch (error) {
    showNotification(`خطا - ${error.message}`, 'error');
  }
}

// Add animations

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
