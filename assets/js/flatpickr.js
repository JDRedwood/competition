document.addEventListener('DOMContentLoaded', function() {
    const datePicker = document.getElementById('datePicker');
    let fpInstance;

    function initDatePicker() {
        if (fpInstance) {
            fpInstance.destroy();
        }
        fpInstance = flatpickr(datePicker, {
            altInput: true,
            altFormat: "F j, Y",
            dateFormat: "Y-m-d",
            onChange: function(selectedDates, dateStr, instance) {
                handleNewDate(dateStr);
            }
        });
    }

    function initMonthPicker() {
        if (fpInstance) {
            fpInstance.destroy();
        }
        fpInstance = flatpickr(datePicker, {
            altInput: true,
            altFormat: "F Y",
            dateFormat: "Y-m",
            plugins: [
                new monthSelectPlugin({
                    shorthand: true, // display as "Sep" rather than "September"
                    dateFormat: "Y-m", // format to return to input
                    altFormat: "F Y", // format for display in alt input
                })
            ],
            onChange: function(selectedDates, dateStr, instance) {
                handleNewDate(dateStr);
            }
        });
    }

    function handleNewDate(dateStr) {
        // Add your logic here to handle the new date
        console.log("Handling new date:", dateStr);
        window.updateData(dateStr);
    }

    // Initialize with date picker by default
    initDatePicker();

    // Export functions to switch modes
    window.showDateSelection = function() {
        initDatePicker();
    };

    window.showMonthSelection = function() {
        initMonthPicker();
    };
});