// Updated dashboard.js for API integration
document.addEventListener('DOMContentLoaded', function() {
    const applicationList = document.getElementById('application-list');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const statusFilter = document.getElementById('status-filter');
    const priorityFilter = document.getElementById('priority-filter');

    // Statistics elements
    const totalApplications = document.getElementById('total-applications');
    const pendingApplications = document.getElementById('pending-applications');
    const approvedApplications = document.getElementById('approved-applications');
    const rejectedApplications = document.getElementById('rejected-applications');

    // Global function to update application status via API
    // Must be attached to 'window' to be accessible by 'onchange' inline HTML
    window.updateApplicationStatus = async function(applicationId, newStatus) {
        try {
            const response = await fetch(`/api/applications/${applicationId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newStatus })
            });

            if (!response.ok) throw new Error('Status update failed');
            
            // Reload the applications to reflect the change
            loadApplications();
            showStatusUpdateMessage(newStatus);
        } catch (error) {
            console.error('Status Update Error:', error);
            alert('⚠️ فشل تحديث حالة الطلب.');
        }
    }

    // Load and display applications from API
    async function loadApplications() {
        try {
            const response = await fetch('/api/applications');
            if (!response.ok) throw new Error('Failed to fetch applications from API');
            
            const applications = await response.json();
            
            const filteredApplications = filterApplications(applications);
            
            updateStatistics(applications); // Statistics are based on ALL applications
            displayApplications(filteredApplications);
        } catch (error) {
            console.error('Error loading applications:', error);
            applicationList.innerHTML = `<div class="empty-state">❌ فشل تحميل البيانات من الخادم</div>`;
        }
    }

    // Event listeners
    clearAllBtn.addEventListener('click', clearAllApplications);
    refreshBtn.addEventListener('click', loadApplications);
    statusFilter.addEventListener('change', loadApplications);
    priorityFilter.addEventListener('change', loadApplications);

    // Load applications on page load
    loadApplications();


    // Filter applications based on selected filters (local filtering)
    function filterApplications(applications) {
        const statusValue = statusFilter.value;
        const priorityValue = priorityFilter.value;

        return applications.filter(app => {
            const statusMatch = statusValue === 'all' || app.status === statusValue;
            const priorityMatch = priorityValue === 'all' || app.priority === priorityValue;
            return statusMatch && priorityMatch;
        });
    }

    // Update statistics
    function updateStatistics(applications) {
        const total = applications.length;
        const pending = applications.filter(app => app.status === 'قيد الانتظار').length;
        const approved = applications.filter(app => app.status === 'معتمد').length;
        const rejected = applications.filter(app => app.status === 'مرفوض').length;

        totalApplications.textContent = total;
        pendingApplications.textContent = pending;
        approvedApplications.textContent = approved;
        rejectedApplications.textContent = rejected;
    }

    // Display applications in the list
    function displayApplications(applications) {
        if (applications.length === 0) {
            applicationList.innerHTML = `
                <div class="empty-state">
                    📭 لا توجد طلبات مرفوعة حتى الآن
                </div>
            `;
            return;
        }

        applicationList.innerHTML = applications.map(app => `
            <div class="application-card ${getStatusClass(app.status)}" data-id="${app.id}">
                <div class="app-card-header">
                    <div>
                        <h3>${app.name}</h3>
                        <div class="app-id">رقم الطلب: ${app.id}</div>
                    </div>
                    <div class="priority-badge ${getPriorityClass(app.priority)}">
                        ${app.priority}
                    </div>
                </div>
                
                <div class="app-details">
                    <div class="detail-row">
                        <span class="detail-label">معلومات التواصل:</span>
                        <span>${app.contact}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">نوع مقدم الطلب:</span>
                        <span>${app.type}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">تفاصيل الدعم:</span>
                        <span>${app.details}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">تاريخ التقديم:</span>
                        <span>${app.submissionDate}</span>
                    </div>
                </div>
                
                <div class="status-section">
                    <span class="status-label">الحالة الحالية:</span>
                    <select class="status-select" onchange="window.updateApplicationStatus('${app.id}', this.value)">
                        <option value="قيد الانتظار" ${app.status === 'قيد الانتظار' ? 'selected' : ''}>قيد الانتظار</option>
                        <option value="قيد المراجعة" ${app.status === 'قيد المراجعة' ? 'selected' : ''}>قيد المراجعة</option>
                        <option value="معتمد" ${app.status === 'معتمد' ? 'selected' : ''}>معتمد</option>
                        <option value="مرفوض" ${app.status === 'مرفوض' ? 'selected' : ''}>مرفوض</option>
                    </select>
                </div>
            </div>
        `).join('');
    }

    // Get CSS class for status
    function getStatusClass(status) {
        const statusClasses = {
            'قيد الانتظار': 'pending',
            'قيد المراجعة': 'review',
            'معتمد': 'approved',
            'مرفوض': 'rejected'
        };
        return statusClasses[status] || '';
    }

    // Get CSS class for priority
    function getPriorityClass(priority) {
        const priorityClasses = {
            'عاجل': 'urgent',
            'متوسط': 'medium',
            'منخفض': 'low'
        };
        return priorityClasses[priority] || '';
    }

    // Clear all applications via API
    function clearAllApplications() {
        if (confirm('⚠️ هل أنت متأكد من رغبتك في مسح جميع الطلبات؟ لا يمكن التراجع عن هذا الإجراء.')) {
            fetch('/api/applications', { method: 'DELETE' })
                .then(response => {
                    if (!response.ok) throw new Error('Failed to clear applications');
                    return response.json();
                })
                .then(() => {
                    loadApplications();
                    alert('تم مسح جميع الطلبات بنجاح');
                })
                .catch(error => {
                    console.error('Clear Error:', error);
                    alert('فشل في مسح الطلبات');
                });
        }
    }

    // Show status update message
    function showStatusUpdateMessage(status) {
        const statusMessages = {
            'قيد الانتظار': 'تم تعيين الحالة إلى "قيد الانتظار"',
            'قيد المراجعة': 'تم تعيين الحالة إلى "قيد المراجعة"',
            'معتمد': '✅ تم اعتماد الطلب',
            'مرفوض': '❌ تم رفض الطلب'
        };
        
        const message = statusMessages[status] || 'تم تحديث الحالة';
        alert(message);
    }
});