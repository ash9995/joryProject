// Updated app.js for API integration
document.addEventListener('DOMContentLoaded', function() {
    const applicationForm = document.getElementById('application-form');
    const successMessage = document.getElementById('success-message');
    const applicationIdSpan = document.getElementById('application-id');

    // Form submission handler
    applicationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Use a stringified timestamp as the unique ID
        const submissionId = String(Date.now());

        // Get form values
        const formData = {
            id: submissionId, 
            name: document.getElementById('applicantName').value.trim(),
            contact: document.getElementById('contactInfo').value.trim(),
            type: document.getElementById('applicantType').value,
            details: document.getElementById('supportNeeded').value.trim(),
            priority: document.getElementById('priority').value,
status: 'قيد الانتظار', // Default status            
submissionDate: new Date().toLocaleString('ar-EG')
        };

        // Validate form
        if (!validateForm(formData)) {
            return;
        }

        try {
            // Send application to the server API
            const response = await fetch('/api/applications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Server submission failed.');
            }

            // Show success message
            showSuccessMessage(formData.id);

            // Reset form
            applicationForm.reset();

        } catch (error) {
            console.error('Submission Error:', error);
            alert('⚠️ حدث خطأ أثناء تقديم الطلب. يرجى المحاولة مرة أخرى.');
        }
    });

    // Form validation
    function validateForm(data) {
        if (!data.name || !data.contact || !data.type || !data.details || !data.priority) {
            alert('⚠️ يرجى ملء جميع الحقول الإلزامية');
            return false;
        }

        // Basic email/phone validation
        const contact = data.contact;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;

        if (!emailRegex.test(contact) && !phoneRegex.test(contact)) {
            alert('⚠️ يرجى إدخال بريد إلكتروني أو رقم هاتف صحيح');
            return false;
        }

        return true;
    }

    // Show success message
    function showSuccessMessage(applicationId) {
        applicationIdSpan.textContent = applicationId;
        successMessage.classList.remove('hidden');
        
        // Hide message after 5 seconds
        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 5000);
    }
});