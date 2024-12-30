// File: newone.js
import { auth, db } from "./firebase.js";
import checkAuth from "./google.js";
import { addLongPressListeners } from "./test.js";
import { addDoc, collection, getDocs, updateDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
export { renderStoredEntries };


async function renderStoredEntries() {
    try {
        const labourContent = document.getElementById("labourContent");
        const placeholder = document.getElementById("placeholder");
        const addLabourBtn = document.getElementById("addLabourBtn");

        // Wait for Firebase to confirm authentication state
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                console.warn("No user is logged in. Cannot render entries.");
                return;
            }

            // Fetch entries from Firebase
            const userLabourCollection = collection(db, `users/${user.uid}/labourEntries`);
            const querySnapshot = await getDocs(userLabourCollection);
            const entries = querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

            if (!entries || entries.length === 0) {
                console.log("No entries to render.");
                placeholder.style.display = "block"; // Show placeholder if no entries exist
                return;
            }

            // Render entries
            entries.forEach((entry) => {
                const labourEntryWrapper = document.createElement("div");
                labourEntryWrapper.className = "labour-entry-wrapper";
                labourEntryWrapper.setAttribute("data-id", entry.id);

                const actionButtons = document.createElement("div");
                actionButtons.className = "action-buttons";

                const pButton = document.createElement("button");
                pButton.textContent = "P";
                pButton.className = "action-btn green";

                const aButton = document.createElement("button");
                aButton.textContent = "A";
                aButton.className = "action-btn red";

                const otButton = document.createElement("button");
                otButton.textContent = "OT";
                otButton.className = "action-btn orange";

                const hButton = document.createElement("button");
                hButton.textContent = "H";
                hButton.className = "action-btn grey";

                actionButtons.append(pButton, aButton, otButton, hButton);

                const labourEntryButton = document.createElement("button");
                labourEntryButton.className = "labour-entry-btn";

                const nameSpan = document.createElement("span");
                nameSpan.className = "labour-name";
                nameSpan.textContent = entry.labourName || "No Name";

                const tapHoldSpan = document.createElement("span");
                tapHoldSpan.className = "tap-hold";
                tapHoldSpan.textContent = "Tap & hold for more options";

                labourEntryButton.append(nameSpan, tapHoldSpan);

                labourEntryWrapper.append(actionButtons, labourEntryButton);

                if (placeholder) {
                    placeholder.remove();
                }

                labourContent.insertBefore(labourEntryWrapper, addLabourBtn);
            });

            addLongPressListeners();
            console.log("Entries rendered successfully.");
        });
    } catch (error) {
        console.error("Error rendering entries:", error);
    }
}
// Call this function after DOM content is loaded
renderStoredEntries();
// Hide popup1 and overlay when overlay1 is clicked
document.getElementById("popupOverlay1").addEventListener("click", () => {
    const popup1 = document.getElementById("popup1");
    const overlay1 = document.getElementById("popupOverlay1");

    // Hide the bottom popup and overlay
    popup1.style.bottom = "-100%";
    overlay1.classList.remove("visible");
});
const popup = document.querySelector(".popup");
const overlay = document.querySelector(".overlay");

let pressTimer; // Timer for long press
let isLongPress = false; // Flag to track if it was a long press
const LONG_PRESS_THRESHOLD = 500; // 500ms for a long press

// Function to show the pop-up and overlay
// Attach showPopup to the global window object
window.showPopup = async function (labourId, selectedDate = null) {
    const currentYearElem = document.querySelector(".current-year");
    const currentMonthElem = document.querySelector(".current-month");

    if (!selectedDate) {
        const selectedYear = parseInt(currentYearElem.textContent, 10);
        selectedDate = new Date(`${currentMonthElem.textContent} 1, ${selectedYear}`);
    }

    const popup = document.querySelector(".popup");
    const overlay = document.querySelector(".overlay");

    popup.style.display = "flex";
    overlay.classList.add("visible");

    // Fetch entries from Firebase
    const entries = await window.getLabourEntries();
    const labourEntry = entries.find((entry) => entry.id === labourId);

    if (!labourEntry) {
        console.info("Labour entry not found!");
        return;
    }

    // Populate popup details
    const labourTitleElem = document.querySelector(".popup .title");
    const labourCategoryElem = document.querySelector(".popup .category");

    labourTitleElem.textContent = labourEntry.labourName || "N/A";
    labourCategoryElem.textContent = labourEntry.labourCategory || "N/A";
    labourTitleElem.dataset.labourId = labourId;

    // Render spreadsheet rows based on attendance data
    const labourRows = document.querySelector(".spreadsheet");
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    labourRows.innerHTML = `
            <div class="row header">
                <div class="cell">Date</div>
                <div class="cell">Appearance</div>
                <div class="cell">Advance</div>
            </div>`;

    const today = new Date().toISOString().split("T")[0];

    for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const attendance = labourEntry.attendance.find((a) => a.date === date) || {};
        const isToday = date === today ? "highlight" : "";

        const overtimeDetails =
            attendance.overtime && attendance.status === "OT"
                ? `<br>OT: ${attendance.overtime.hours}h @ ${attendance.overtime.rate}/hr`
                : "";

        labourRows.insertAdjacentHTML(
            "beforeend",
            `
                <div class="row clickable ${isToday}" data-date="${date}">
                    <div class="cell">${new Date(date).toLocaleDateString("en-US", { weekday: "short", day: "2-digit" })}</div>
                    <div class="cell">${attendance.status || ""}${overtimeDetails}</div>
                    <div class="cell">${attendance.advances ? attendance.advances.reduce((sum, value) => sum + value, 0) : ""}</div>
                </div>`
        );
    }

    // Update the calculator
    updateCalculatorForMonth(labourId, selectedDate);
};

function setupYearSwitcher() {
    const currentYearElem = document.querySelector(".current-year");
    const yearDropdown = document.getElementById("yearDropdown");
    const yearList = document.getElementById("yearList");
    const currentYear = new Date().getFullYear();

    // Populate year dropdown (10 years back and forward)
    for (let year = currentYear - 10; year <= currentYear + 10; year++) {
        const yearItem = document.createElement("li");
        yearItem.textContent = year;
        yearItem.classList.add("year-item");
        yearItem.dataset.year = year;

        // Highlight current year
        if (year === currentYear) {
            yearItem.classList.add("selected");
        }

        // Add click event to change year
        yearItem.addEventListener("click", () => {
            // Update the selected year
            document.querySelectorAll(".year-item").forEach((item) => item.classList.remove("selected"));
            yearItem.classList.add("selected");
            currentYearElem.textContent = year;

            // Hide the dropdown
            yearList.style.display = "none";

            // Update spreadsheet and calculator
            updateYearAndMonth();
        });

        yearList.appendChild(yearItem);
    }

    // Toggle dropdown visibility
    yearDropdown.addEventListener("click", () => {
        yearList.style.display = yearList.style.display === "none" ? "block" : "none";
    });

    // Close dropdown if clicked outside
    document.addEventListener("click", (event) => {
        if (!yearDropdown.contains(event.target) && !yearList.contains(event.target)) {
            yearList.style.display = "none";
        }
    });
}
async function showBottomPopup(date, labourId) {
    try {
        // Await entries from Firebase or local storage
        const entries = await window.getLabourEntries();
        const labourEntry = entries.find((entry) => entry.id === labourId);

        if (!labourEntry) {
            console.warn(`Labour entry with ID ${labourId} not found.`);
            console.info("Labour entry not found!");
            return;
        }

        // Find attendance data for the selected date
        const attendance = labourEntry.attendance.find((a) => a.date === date) || {};

        // Populate the popup content
        const popup1 = document.getElementById("popup1");
        popup1.querySelector(".popup-date").textContent = date; // Set date
        popup1.querySelector(".labour-name").textContent = labourEntry.labourName || "N/A"; // Set labour name
        popup1.querySelector(".category").textContent = labourEntry.labourCategory || "N/A"; // Set category
        popup1.querySelector("#amount").value = attendance.advances
            ? attendance.advances.reduce((sum, value) => sum + value, 0)
            : "";
        renderAdvancesPopup(labourId, date); // Ensure advances are updated for the selected date

        // Show the bottom popup
        const overlay1 = document.getElementById("popupOverlay1");
        popup1.style.bottom = "0";
        popup1.style.transition = "bottom 0.3s ease";

        // Show the overlay
        overlay1.classList.add("visible");
    } catch (error) {
        console.error("Error displaying bottom popup:", error);
        console.info("An error occurred while loading the popup. Please try again.");
    }
}
// Event listener for row clicks
document.addEventListener("click", async (event) => {
    const clickedRow = event.target.closest(".clickable");
    if (clickedRow) {
        const date = clickedRow.dataset.date;
        const labourId = document.querySelector(".popup .title").dataset.labourId;
        await showBottomPopup(date, labourId);
    }
});
document.getElementById("prevMonth").addEventListener("click", () => switchMonth("prev"));
document.getElementById("nextMonth").addEventListener("click", () => switchMonth("next"));
function switchMonth(direction) {
    const currentMonthElem = document.querySelector(".current-month");
    const currentYear = new Date().getFullYear();
    const currentDate = new Date(`${currentMonthElem.textContent} 1, ${currentYear}`);
    const newDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + (direction === "next" ? 1 : -1),
        1
    );

    // Update the month in the UI
    currentMonthElem.textContent = newDate.toLocaleDateString("en-US", { month: "long" });

    // Fetch the labourId from the popup
    const labourId = document.querySelector(".popup .title").dataset.labourId;

    // Regenerate the spreadsheet rows for the new month
    if (labourId) {
        showPopup(labourId, newDate); // Update spreadsheet rows for the selected month
        updateCalculatorForMonth(labourId, newDate); // Update calculator for the selected month
    }
}

// Function to hide the pop-up and overlay
function hidePopup() {
    popup.style.display = "none"; // Hide popup
    overlay.classList.remove("visible"); // Hide overlay
}

// Handle mousedown (start press)
document.addEventListener("mousedown", (event) => {
    const labourEntryWrapper = event.target.closest(".labour-entry-wrapper");
    if (labourEntryWrapper) {
        isLongPress = false; // Reset flag

        // Start the long press timer
        pressTimer = setTimeout(() => {
            isLongPress = true; // Mark as a long press
            pressTimer = null; // Clear timer reference
        }, LONG_PRESS_THRESHOLD);
    }
});

// Handle mouseup (end press)
document.addEventListener("mouseup", (event) => {
    const labourEntryWrapper = event.target.closest(".labour-entry-wrapper");
    if (labourEntryWrapper) {
        if (!isLongPress) {
            const labourId = labourEntryWrapper.dataset.id; // Get the labour ID
            document.querySelector(".popup .title").dataset.labourId = labourId; // Set labourId in popup
            showPopup(labourId); // Pass labour ID to showPopup
        }
    }
    // Clear the timer and reset flag
    if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
    }
    isLongPress = false;
});
// Cancel the press if mouse leaves the element
document.addEventListener("mouseleave", () => {
    if (pressTimer) {
        clearTimeout(pressTimer); // Cancel the long press
        pressTimer = null;
    }
    isLongPress = false;
});

// Add event listener to the overlay to hide popup on click
overlay.addEventListener("click", hidePopup);

document.addEventListener("DOMContentLoaded", () => {

    // Year Switcher: Populate and handle year changes
    function setupYearSwitcher() {
        const currentYearElem = document.querySelector(".current-year");
        const yearDropdown = document.getElementById("yearDropdown");
        const yearList = document.getElementById("yearList");
        const currentYear = new Date().getFullYear();

        // Populate year dropdown (10 years back and forward)
        for (let year = currentYear - 10; year <= currentYear + 10; year++) {
            const yearItem = document.createElement("li");
            yearItem.textContent = year;
            yearItem.classList.add("year-item");
            yearItem.dataset.year = year;

            // Highlight current year
            if (year === currentYear) {
                yearItem.classList.add("selected");
            }

            // Add click event to change year
            yearItem.addEventListener("click", () => {
                // Update the selected year
                document.querySelectorAll(".year-item").forEach((item) => item.classList.remove("selected"));
                yearItem.classList.add("selected");
                currentYearElem.textContent = year;

                // Hide the dropdown
                yearList.style.display = "none";

                // Update spreadsheet and calculator
                updateYearAndMonth();
            });

            yearList.appendChild(yearItem);
        }

        // Toggle dropdown visibility
        yearDropdown.addEventListener("click", () => {
            yearList.style.display = yearList.style.display === "none" ? "block" : "none";
        });

        // Close dropdown if clicked outside
        document.addEventListener("click", (event) => {
            if (!yearDropdown.contains(event.target) && !yearList.contains(event.target)) {
                yearList.style.display = "none";
            }
        });
    }

    // Update spreadsheet and calculator for the selected year and month
    function updateYearAndMonth() {
        const selectedYear = parseInt(document.querySelector(".current-year").textContent, 10);
        const currentMonthElem = document.querySelector(".current-month");
        const labourId = document.querySelector(".popup .title").dataset.labourId;

        if (!labourId) {
            console.warn("No labour ID selected. Cannot update year and month.");
            return;
        }

        const selectedDate = new Date(`${currentMonthElem.textContent} 1, ${selectedYear}`);
        showPopup(labourId, selectedDate);
        updateCalculatorForMonth(labourId, selectedDate);
    }

    // Adjust the month switcher to consider the selected year
    function switchMonth(direction) {
        const currentMonthElem = document.querySelector(".current-month");
        const currentYearElem = document.querySelector(".current-year");
        const selectedYear = parseInt(currentYearElem.textContent, 10);

        const currentDate = new Date(`${currentMonthElem.textContent} 1, ${selectedYear}`);
        const newDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + (direction === "next" ? 1 : -1),
            1
        );

        // Update the month and year in the UI
        currentMonthElem.textContent = newDate.toLocaleDateString("en-US", { month: "long" });
        if (newDate.getFullYear() !== selectedYear) {
            currentYearElem.textContent = newDate.getFullYear();
        }

        // Update the spreadsheet and calculator
        const labourId = document.querySelector(".popup .title").dataset.labourId;
        if (labourId) {
            showPopup(labourId, newDate);
            updateCalculatorForMonth(labourId, newDate);
        }
    }
    // Call the year switcher setup function
    setupYearSwitcher();
    // Add listeners for action-buttons1 in popup1
    document.addEventListener("click", (event) => {
        if (event.target.classList.contains("action-btn1")) {
            const button = event.target;
            const statusMap = { P: "P", A: "A", OT: "OT", H: "H" };
            const status = statusMap[button.textContent];

            // Detect if the button is inside popup1
            const isPopup1 = button.closest(".popup1");

            if (status) {
                if (isPopup1) {
                    // If button is in popup1, update attendance for the popup1 context
                    const labourId = document.querySelector(".popup .title").dataset.labourId;
                    const date = document.querySelector(".popup1 .popup-date").textContent;

                    // Update status for the selected date in popup1
                    updatePopup1Status(labourId, date, status);
                } else {
                    // If button is in entryWrapper, update labour status directly
                    const wrapper = button.closest(".labour-entry-wrapper");
                    updateLabourStatus(button, status);
                }
            }
        }
    });
});
// File: popup1-action-buttons.js

document.addEventListener("DOMContentLoaded", () => {

    const popup1 = document.getElementById("popup1");
    // Add an event listener for the Pay button
    document.querySelector(".pay-btn").addEventListener("click", saveAdvanceAmount);

    // Add event listener for delete advance buttons
    document.getElementById("advance-list").addEventListener("click", deleteAdvance);
    // Function to toggle visibility and slide tapped button (for action-buttons1 in popup1)
    // Function to toggle visibility and slide tapped button (for action-buttons1 in popup1)
    // Function to toggle visibility and slide tapped button (for action-buttons1 in popup1)
    function togglePopup1ActionButtons(clickedButton) {
        const actionButtons = Array.from(
            document.querySelectorAll(".action-buttons1 .action-btn1")
        );

        // Check if other buttons are currently hidden
        const areHidden = actionButtons.some(
            (button) => button !== clickedButton && button.classList.contains("hidden")
        );

        if (!areHidden) {
            // Hide other buttons and center the clicked button
            actionButtons.forEach((button, index) => {
                if (button === clickedButton) {
                    button.style.order = Math.floor(actionButtons.length / 2); // Position in the center
                    button.classList.add("bounce"); // Add bounce animation
                    setTimeout(() => button.classList.remove("bounce"), 500);
                } else {
                    button.style.order = ""; // Reset order for hidden buttons
                    button.classList.remove("show");
                    button.classList.add("hidden");
                }
            });
        } else {
            // Show all buttons and reset their order
            actionButtons.forEach((button) => {
                button.style.order = ""; // Reset order
                button.classList.remove("hidden");
                button.classList.add("show");
            });
        }
    }

    // Function to open the overtime form
    function openPopup1OvertimeForm() {
        const overtimeForm = document.getElementById("overtimeForm");
        const popup1LabourName = popup1.querySelector(".labour-name").textContent;

        const overtimeName = document.getElementById("overtimeName");
        overtimeName.textContent = `Overtime for: ${popup1LabourName}`;

        overtimeForm.classList.add("visible");
    }

    // Event listener for action-buttons1 in popup1
    popup1.addEventListener("click", (event) => {
        if (event.target.classList.contains("action-btn1")) {
            const clickedButton = event.target;
            const buttonText = clickedButton.textContent;

            // Handle button actions
            switch (buttonText) {
                case "P":
                    console.info("Present action triggered!");
                    break;
                case "A":
                    console.info("Absent action triggered!");
                    break;
                case "OT":
                    openPopup1OvertimeForm();
                    break;
                case "H":
                    console.info("Halfday action triggered!");
                    break;
                default:
                    console.log("Unknown action");
            }

            // Apply toggle animation
            togglePopup1ActionButtons(clickedButton);
        }
    });
});
// Function to update attendance from popup1 buttons

async function updatePopup1Status(labourId, date, status) {
    try {
        // Verify the authenticated user
        const user = auth.currentUser;
        if (!user) {
            console.error("No authenticated user found.");
            console.info("You must be logged in to update the status.");
            return;
        }

        // Reference the labor document in Firestore
        const labourDocRef = doc(db, `users/${user.uid}/labourEntries`, labourId);

        // Fetch the labor entry document
        const labourDocSnapshot = await getDoc(labourDocRef);
        if (!labourDocSnapshot.exists()) {
            console.warn(`Labour entry with ID ${labourId} not found.`);
            console.info("Labour entry not found!");
            return;
        }

        const labourEntry = labourDocSnapshot.data();

        // Find or create attendance for the specified date
        let attendance = labourEntry.attendance?.find((a) => a.date === date);
        if (!attendance) {
            attendance = { date, status: "", advances: [], overtime: null };
            labourEntry.attendance = labourEntry.attendance || [];
            labourEntry.attendance.push(attendance);
        }

        // Update status and handle overtime
        if (status === "OT") {
            attendance.status = "OT";
            attendance.overtime = attendance.overtime || { hours: 0, rate: 0 }; // Ensure overtime exists
        } else {
            attendance.status = status;
            attendance.overtime = null; // Clear overtime for non-OT statuses
        }

        // Save updated data back to Firebase
        await updateDoc(labourDocRef, { attendance: labourEntry.attendance });
        console.log("Updated labour entry successfully in Firebase.");

        // Update UI dynamically
        const spreadsheetRow = document.querySelector(`.spreadsheet .row[data-date="${date}"]`);
        if (spreadsheetRow) {
            spreadsheetRow.querySelector(".cell:nth-child(2)").innerHTML = `
                ${attendance.status}
                ${attendance.overtime
                    ? `<br>OT: ${attendance.overtime.hours}h @ ${attendance.overtime.rate}/hr`
                    : ""
                }
            `;
        }

        // Update the calculator
        updateCalculator(labourId);

        // Show success message
        console.info(`${labourEntry.labourName} marked as ${status} for ${date}`);
    } catch (error) {
        console.error("Error updating popup status:", error);
        console.info("An error occurred while updating status. Please try again.");
    }
}
// Function to save advance amount and update spread
async function saveAdvanceAmount() {
    const advanceList = document.getElementById("advance-list");
    advanceList.innerHTML = ""; // Clear previous entries

    const popup1 = document.getElementById("popup1");
    const labourId = document.querySelector(".popup .title").dataset.labourId; // Fetch labour ID from the main popup
    const date = popup1.querySelector(".popup-date").textContent; // Fetch selected date
    const amountInput = popup1.querySelector("#amount");
    const advanceAmount = parseFloat(amountInput.value.trim()); // Get the entered amount

    if (!advanceAmount || isNaN(advanceAmount)) {
        console.info("Please enter a valid amount.");
        return;
    }

    try {
        // Verify the authenticated user
        const user = auth.currentUser;
        if (!user) {
            console.error("No authenticated user found.");
            console.info("You must be logged in to save an advance amount.");
            return;
        }

        // Reference the labor document in Firestore
        const labourDocRef = doc(db, `users/${user.uid}/labourEntries`, labourId);

        // Fetch the labor entry document
        const labourDocSnapshot = await getDoc(labourDocRef);
        let labourEntry = labourDocSnapshot.exists() ? labourDocSnapshot.data() : null;

        if (!labourEntry) {
            // Initialize labor entry if it doesn't exist
            console.warn(`Labour entry with ID ${labourId} not found.`);
            labourEntry = { attendance: [] };
        }

        // Find attendance data for the selected date or create a new one
        let attendance = labourEntry.attendance.find((a) => a.date === date);
        if (!attendance) {
            attendance = { date, status: "", advances: [] };
            labourEntry.attendance.push(attendance);
        }

        // Add the new advance to the advances array
        attendance.advances = attendance.advances || [];
        attendance.advances.push(advanceAmount);

        // Save updated data back to Firebase
        await updateDoc(labourDocRef, { attendance: labourEntry.attendance });

        // Log success
        console.log(`Advance of ${advanceAmount} saved under ${date} for labour ID ${labourId}.`);

        // Re-render popup advances
        await renderAdvancesPopup(labourId, date);

        // Update the spreadsheet with the total advance
        const totalAdvance = attendance.advances.reduce((sum, value) => sum + value, 0);
        const spreadsheetRow = document.querySelector(`.spreadsheet .row[data-date="${date}"]`);
        if (spreadsheetRow) {
            spreadsheetRow.querySelector(".cell:nth-child(3)").textContent = totalAdvance || ""; // Update total
        }

        console.info(`Advance of ${advanceAmount} saved successfully!`);

        // Reset input field
        amountInput.value = "";
        updateCalculator(labourId); // Recalculate after updating attendance
    } catch (error) {
        console.error("Error saving advance amount:", error);
        console.info("An error occurred while saving the advance amount. Please try again.");
    }
}
// Add an event listener for the Pay button
document.querySelector(".pay-btn").addEventListener("click", saveAdvanceAmount);
// Function to render advances with delete option in popup1
async function renderAdvancesPopup(labourId, date) {
    const advanceList = document.getElementById("advance-list");
    advanceList.innerHTML = ""; // Clear previous entries

    try {
        // Verify user authentication
        const user = auth.currentUser;
        if (!user) {
            console.error("No authenticated user found.");
            return;
        }

        // Reference the labor document in Firestore
        const labourDocRef = doc(db, `users/${user.uid}/labourEntries`, labourId);

        // Fetch the labor entry document
        const labourDocSnapshot = await getDoc(labourDocRef);
        if (!labourDocSnapshot.exists()) {
            console.warn(`Labour entry with ID ${labourId} not found.`);
            return;
        }

        const labourEntry = labourDocSnapshot.data();

        // Find attendance data for the specific date
        const attendance = labourEntry.attendance?.find((a) => a.date === date);
        if (!attendance || !attendance.advances || attendance.advances.length === 0) {
            console.log("No advances found for the specified date.");
            return;
        }

        // Render each advance with a delete button
        attendance.advances.forEach((advance, index) => {
            const advanceItem = document.createElement("div");
            advanceItem.className = "advance-item";
            advanceItem.innerHTML = `
                Advance: ${advance} <button class="delete-advance" data-index="${index}" data-labour-id="${labourId}" data-date="${date}">🗑</button>
            `;
            advanceList.appendChild(advanceItem);
        });

        console.log("Advances rendered successfully.");
    } catch (error) {
        console.error("Error rendering advances popup:", error);
    }
}
// Function to delete an advance
async function deleteAdvance(event) {
    if (!event.target.classList.contains("delete-advance")) return;

    const labourId = event.target.dataset.labourId;
    const date = event.target.dataset.date;
    const index = parseInt(event.target.dataset.index, 10);

    try {
        // Verify the authenticated user
        const user = auth.currentUser;
        if (!user) {
            console.error("No authenticated user found.");
            console.info("You must be logged in to delete an advance.");
            return;
        }

        // Reference the labor document in Firestore
        const labourDocRef = doc(db, `users/${user.uid}/labourEntries`, labourId);

        // Fetch the labor entry document
        const labourDocSnapshot = await getDoc(labourDocRef);
        if (!labourDocSnapshot.exists()) {
            console.warn(`Labour entry with ID ${labourId} not found.`);
            return;
        }

        const labourEntry = labourDocSnapshot.data();

        // Find attendance data for the selected date
        const attendance = labourEntry.attendance?.find((a) => a.date === date);
        if (!attendance || !attendance.advances || attendance.advances.length <= index) {
            console.warn(`Advance at index ${index} not found for the specified date.`);
            return;
        }

        // Remove the advance at the specified index
        attendance.advances.splice(index, 1);

        // Save the updated attendance back to Firestore
        await updateDoc(labourDocRef, { attendance: labourEntry.attendance });

        // Re-render popup advances
        await renderAdvancesPopup(labourId, date);

        // Update the spreadsheet with the new total advance
        const totalAdvance = attendance.advances.reduce((sum, value) => sum + value, 0);
        const spreadsheetRow = document.querySelector(`.spreadsheet .row[data-date="${date}"]`);
        if (spreadsheetRow) {
            spreadsheetRow.querySelector(".cell:nth-child(3)").textContent = totalAdvance || ""; // Update total
        }

        console.info("Advance deleted successfully.");
        updateCalculator(labourId); // Recalculate after updating attendance
    } catch (error) {
        console.error("Error deleting advance:", error);
        console.info("An error occurred while deleting the advance. Please try again.");
    }
}
// Function to calculate and update the calculator section
export async function updateCalculator(labourId) {
    const calculator = document.querySelector(".calculator");

    try {
        const user = auth.currentUser;
        if (!user) {
            console.error("No authenticated user found.");
            return;
        }

        // Reference the labor document in Firestore
        const labourDocRef = doc(db, `users/${user.uid}/labourEntries`, labourId);

        // Fetch the labor entry document
        const labourDocSnapshot = await getDoc(labourDocRef);
        if (!labourDocSnapshot.exists()) {
            console.warn("Labour entry not found in Firebase.");
            calculator.innerHTML = "<p>No data available.</p>";
            return;
        }

        const labourEntry = labourDocSnapshot.data();
        const ratePerDay = labourEntry.ratePerDay;

        let balance = 0;
        let totalOTHours = 0; // Track overtime hours
        let totalAdvance = 0;

        labourEntry.attendance.forEach((attendance) => {
            // Handle statuses
            if (attendance.status === "P") {
                balance += ratePerDay; // Full-day
            } else if (attendance.status === "H") {
                balance += 0.5 * ratePerDay; // Half-day
            } else if (attendance.status === "OT" && attendance.overtime) {
                // Add both overtime earnings and full-day rate
                balance += attendance.overtime.hours * attendance.overtime.rate + ratePerDay;
                totalOTHours += attendance.overtime.hours; // Sum OT hours
            }

            // Sum advances
            if (attendance.advances) {
                totalAdvance += attendance.advances.reduce((sum, value) => sum + value, 0);
            }
        });

        const total = balance - totalAdvance;

        // Update calculator UI
        calculator.innerHTML = `
            <div class="row">
                <div class="cell">Balance:</div>
                <div class="cell">${balance.toFixed(2)}</div>

                 <div class="cell">Rate: ${ratePerDay}</div>

                <div class="cell">Advance Money:</div>
                <div class="cell">${totalAdvance.toFixed(2)}</div>
            </div>
            <div class="row">
                <div class="cell">Total:</div>
                <div class="cell">${total.toFixed(2)}</div>
            </div>
        `;
    } catch (error) {
        console.error("Error updating calculator:", error);
    }
}
async function updateCalculatorForMonth(labourId, selectedDate) {
    // Define the 'calculator' DOM element
    const calculator = document.querySelector(".calculator"); // Ensure the correct selector is used
    if (!calculator) {
        console.error("Calculator element not found in the DOM.");
        return;
    }

    // Fetch labour entries from Firebase
    const entries = await window.getLabourEntries();
    const labourEntry = entries.find((entry) => entry.id === labourId);

    if (!labourEntry) {
        console.warn("Labour entry not found in Firebase.");
        return;
    }

    // Fetch rate per day and filter attendance for the selected month
    const ratePerDay = labourEntry.ratePerDay;
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();

    const monthlyAttendance = labourEntry.attendance.filter((attendance) => {
        const [year, month] = attendance.date.split("-").map(Number);
        return year === selectedYear && month - 1 === selectedMonth; // Adjust month index
    });

    // Initialize calculation variables
    let balance = 0;
    let totalP = 0; // Total full-day attendance
    let totalH = 0; // Total half-day attendance
    let totalOT = 0; // Total overtime hours

    monthlyAttendance.forEach((attendance) => {
        if (attendance.status === "P") {
            balance += ratePerDay;
            totalP += 1;
        } else if (attendance.status === "H") {
            balance += 0.5 * ratePerDay;
            totalH += 0.5;
        } else if (attendance.status === "OT" && attendance.overtime) {
            balance += (attendance.overtime.hours * attendance.overtime.rate) + ratePerDay;
            totalOT += attendance.overtime.hours;
        }
    });

    // Calculate total advance money
    let advanceMoney = 0;
    monthlyAttendance.forEach((attendance) => {
        if (attendance.advances) {
            advanceMoney += attendance.advances.reduce((sum, value) => sum + value, 0);
        }
    });

    // Calculate final total
    const total = balance - advanceMoney;

    // Format attendance breakdown
    const attendanceSummary = `${totalP}+${totalH}+${totalOT}OT`;

    // Update the calculator fields in the DOM
    calculator.innerHTML = `
        <div class="row">
            <div class="cell">Balance:</div>
            <div class="cell">${balance.toFixed(2)}</div>
            <div class="cell">Rate: ${ratePerDay}</div>
            <div class="cell">Advance Money: ${advanceMoney.toFixed(2)}</div>
        </div>
        <hr class="separator">
        <div class="row">
            <div class="cell">Total:</div>
            <div class="cell">${attendanceSummary}</div>
            <div class="cell" colspan="2">${total.toFixed(2)}</div>
        </div>
    `;
}
/// Add event listener to the Share button
// Add event listener to the Share button
document.querySelector(".btn-share").addEventListener("click", () => {
    const labourId = document.querySelector(".popup .title").dataset.labourId;
    const currentMonthElem = document.querySelector(".current-month").textContent;

    // Fetch selected year from the year switcher
    const currentYearElem = document.querySelector(".current-year");
    const selectedYear = parseInt(currentYearElem.textContent, 10); // Get the selected year
    const selectedDate = new Date(`${currentMonthElem} 1, ${selectedYear}`); // Use the selected year

    if (!labourId) {
        console.info("No labour selected. Open a labour entry first.");
        return;
    }

    exportToCSV(labourId, selectedDate); // Pass the updated selectedDate
});

// Updated Export to CSV Function
function exportToCSV(labourId, selectedDate) {
    const entries = window.getLabourEntries();
    const labourEntry = entries.find((entry) => entry.id === labourId);

    if (!labourEntry) {
        console.info("Labour entry not found!");
        return;
    }

    // Parse selected year and month
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    // Filter attendance for the selected month
    const monthlyAttendance = labourEntry.attendance.filter((a) => {
        const [year, month] = a.date.split("-").map(Number);
        return year === selectedYear && month - 1 === selectedMonth; // Match year and month
    });

    // Check for no data
    if (monthlyAttendance.length === 0) {
        console.info("No attendance data found for the selected month.");
        return;
    }

    // Build CSV rows
    const csvRows = [["Date", "Appearance", "Advance"].join(",")];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const attendance = monthlyAttendance.find((a) => a.date === date) || {};

        // Format appearance and advance
        const appearance = attendance.status
            ? attendance.status === "OT"
                ? `OT ${attendance.overtime?.hours || 0}h @ ${attendance.overtime?.rate || 0}/hr`
                : attendance.status
            : "";
        const advance = attendance.advances
            ? attendance.advances.reduce((sum, value) => sum + value, 0)
            : 0;

        // Add the row to the CSV
        csvRows.push([
            new Date(date).toLocaleDateString("en-US", { weekday: "short", day: "2-digit" }),
            appearance,
            advance,
        ].join(","));
    }

    // Add summary rows (totals)
    const ratePerDay = labourEntry.ratePerDay;
    let balance = 0;
    let totalP = 0; // Full-day attendance
    let totalH = 0; // Half-day attendance
    let totalOT = 0; // Overtime hours
    let advanceMoney = 0;

    monthlyAttendance.forEach((attendance) => {
        if (attendance.status === "P") {
            balance += ratePerDay;
            totalP += 1;
        } else if (attendance.status === "H") {
            balance += 0.5 * ratePerDay;
            totalH += 0.5;
        } else if (attendance.status === "OT" && attendance.overtime) {
            balance += (attendance.overtime.hours * attendance.overtime.rate) + ratePerDay;
            totalOT += attendance.overtime.hours;
        }

        if (attendance.advances) {
            advanceMoney += attendance.advances.reduce((sum, value) => sum + value, 0);
        }
    });

    const total = balance - advanceMoney;
    const attendanceSummary = `${totalP}+${totalH}+${totalOT}OT`;

    csvRows.push(["", "", ""].join(",")); // Separator
    csvRows.push(["Balance", balance.toFixed(2), `Rate: ${ratePerDay}, Advance Money: ${advanceMoney.toFixed(2)}`].join(","));
    csvRows.push(["Total", attendanceSummary, total.toFixed(2)].join(","));

    // Generate and download CSV
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${labourEntry.labourName}_attendance_${selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}.csv`;
    link.click();
}