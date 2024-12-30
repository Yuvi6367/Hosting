
// // JavaScript can be used to control the loader's visibility
// document.addEventListener("DOMContentLoaded", function() {
//     const loader = document.querySelector('.loader');
//     // Simulate a loading process
//     setTimeout(() => {
//         loader.style.display = 'none';
//         // loader.style.top = '-100%';
//     }, 3000); // Hide loader after 3 seconds
// });
// Import the functions you need from the SDKs you need



document.addEventListener("DOMContentLoaded", function () {
    
  const skipButton = document.getElementById("skip-button");

  skipButton.addEventListener("click", function () {
    window.location.href = "Dashboard/dashboard.html"; // Navigates to the dashboard page
  });
});
document.addEventListener("DOMContentLoaded", () => {

    // Close popups when clicking outside
    [popup, categoryPopup].forEach((popupElement) => {
        popupElement.addEventListener("click", (e) => {
            if (e.target === popupElement) {
                popupElement.style.display = "none";
            }
        });
    });
});
let currentDate = new Date(); // Start with the current date

// Function to format the date into a readable format
function formatDate(date) {
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const day = daysOfWeek[date.getDay()];
    const dayOfMonth = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' }); // Get the abbreviated month name
    return { day, dayOfMonth, month };
}

// Function to update the displayed dates
function updateDateDisplay() {
    const prevDate = document.getElementById('prev-date');
    const currentDateElem = document.getElementById('current-date');
    const nextDate = document.getElementById('next-date');

    const prev = new Date(currentDate);
    prev.setDate(currentDate.getDate() - 1); // Previous day

    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + 1); // Next day

    const prevFormatted = formatDate(prev);
    const currentFormatted = formatDate(currentDate);
    const nextFormatted = formatDate(next);

    prevDate.innerHTML = `<p>${prevFormatted.day}</p><p>${prevFormatted.dayOfMonth} ${prevFormatted.month}</p>`;
    currentDateElem.innerHTML = `<p>${currentFormatted.day}</p><p>${currentFormatted.dayOfMonth} ${currentFormatted.month}</p>`;
    nextDate.innerHTML = `<p>${nextFormatted.day}</p><p>${nextFormatted.dayOfMonth} ${nextFormatted.month}</p>`;
}

// Function to change the date when clicking next/prev
function changeDate(direction) {
    if (direction === 'prev') {
        currentDate.setDate(currentDate.getDate() - 1); // Move one day back
    } else if (direction === 'next') {
        currentDate.setDate(currentDate.getDate() + 1); // Move one day forward
    }
    updateDateDisplay();
}

// Initialize the display with the current date
updateDateDisplay();