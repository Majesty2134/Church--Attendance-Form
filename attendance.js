import { db } from "./firebase-config.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// --- Modal ---
function showModal(message) {
  document.getElementById('modal-message').textContent = message;
  document.getElementById('success-modal').classList.add('show');
}

document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('success-modal').classList.remove('show');
});

// --- Show today's date ---
const todayDisplay = document.getElementById("today-display");
const today = new Date();
todayDisplay.textContent = today.toLocaleDateString("en-NG", {
  weekday: "long", year: "numeric", month: "long", day: "numeric"
});

// --- Service selection ---
let selectedService = [];

document.querySelectorAll(".service-card").forEach(card => {
  card.addEventListener("click", () => {
    card.classList.toggle("selected");
    selectedService = [...document.querySelectorAll(".service-card.selected")]
      .map(c => c.querySelector(".sc-label").textContent);
  });
});

// ============================
// GEOFENCING CONFIG
// ============================
const CHURCH_LAT = 6.5642208067978265;   //  
const CHURCH_LNG = 3.2756162865060308;   //  
const MAX_DISTANCE_METERS = 150; // adjust radius as needed

const clockInBtn = document.getElementById("clockInBtn");
const clockInBtnText = document.getElementById("clockInBtnText");
const locationStatus = document.getElementById("location-status");
const locationStatusText = document.getElementById("location-status-text");

let withinRange = false;

function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function updateButtonState() {
  // Don't override the button if it's already mid-submission or already clocked in
  if (clockInBtn.dataset.locked === "true") return;

  if (withinRange) {
    clockInBtn.disabled = false;
    clockInBtnText.textContent = "Clock In";
    locationStatus.className = "location-status in-range";
    locationStatusText.textContent = "You're at the church. You can clock in.";
  } else {
    clockInBtn.disabled = true;
    clockInBtnText.textContent = "Get closer to clock in";
  }
}

function checkLocation() {
  if (!navigator.geolocation) {
    locationStatus.className = "location-status error";
    locationStatusText.textContent = "Geolocation isn't supported on this device.";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const distance = getDistanceMeters(
        position.coords.latitude,
        position.coords.longitude,
        CHURCH_LAT,
        CHURCH_LNG
      );
      withinRange = distance <= MAX_DISTANCE_METERS;

      if (!withinRange) {
        locationStatus.className = "location-status error";
        locationStatusText.textContent = `You're about ${Math.round(distance)}m from the church. Move closer to clock in.`;
      }

      updateButtonState();
    },
    () => {
      withinRange = false;
      locationStatus.className = "location-status error";
      locationStatusText.textContent = "Location access denied. Please enable location to clock in.";
      updateButtonState();
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// Check immediately, then re-check every 20 seconds in case they're walking in
checkLocation();
setInterval(checkLocation, 20000);

// ============================
// DEVICE ID
// ============================
function getDeviceId() {
  let deviceId = localStorage.getItem("oew_device_id");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("oew_device_id", deviceId);
  }
  return deviceId;
}

function getCurrentSundayKey() {
  // Uses today's date as the attendance key (one key per calendar day)
  return today.toISOString().split("T")[0];
}

// --- Check on load if this device already clocked in today ---
(function checkAlreadyClockedIn() {
  const sundayKey = getCurrentSundayKey();
  const deviceId = getDeviceId();
  const localFlag = localStorage.getItem(`clockedIn_${sundayKey}_${deviceId}`);
  if (localFlag === "true") {
    clockInBtn.disabled = true;
    clockInBtn.dataset.locked = "true";
    clockInBtnText.textContent = "Already Clocked In";
    locationStatus.className = "location-status in-range";
    locationStatusText.textContent = "This device has already clocked in today.";
  }
})();

// --- Clock-in button ---
clockInBtn.addEventListener("click", async () => {
  const name = document.getElementById("worker-name").value.trim();
  const note = document.getElementById("worker-note").value.trim();

  const checkedDepts = [...document.querySelectorAll(".dept-option input:checked")]
    .map(cb => cb.value);

  const errorEl = document.getElementById("form-error");

  if (!withinRange) {
    errorEl.textContent = "You must be at the church location to clock in.";
    errorEl.style.display = "block";
    return;
  }
  if (!name) {
    errorEl.textContent = "Kindly fill in your full name before clocking in.";
    errorEl.style.display = "block";
    return;
  }
  if (checkedDepts.length === 0) {
    errorEl.textContent = "Kindly select at least one department before clocking in.";
    errorEl.style.display = "block";
    return;
  }
  if (selectedService.length === 0) {
    errorEl.textContent = "Kindly select a service before clocking in.";
    errorEl.style.display = "block";
    return;
  }

  errorEl.style.display = "none";

  clockInBtn.disabled = true;
  clockInBtnText.textContent = "Clocking in...";

  const sundayKey = getCurrentSundayKey();
  const deviceId = getDeviceId();
  const docId = `${sundayKey}_${deviceId}`;

  try {
    const attendanceRef = doc(db, "attendance", docId);
    const existing = await getDoc(attendanceRef);

    if (existing.exists()) {
      clockInBtn.dataset.locked = "true";
      clockInBtnText.textContent = "Already Clocked In";
      localStorage.setItem(`clockedIn_${sundayKey}_${deviceId}`, "true");
      errorEl.textContent = "This device has already been used to clock in today.";
      errorEl.style.display = "block";
      return;
    }

    const data = {
      fullName: name,
      departments: checkedDepts,
      service: selectedService,
      remarks: note || "None",
      date: sundayKey,
      deviceId,
      markedAt: serverTimestamp()
    };

    await setDoc(attendanceRef, data);

    localStorage.setItem(`clockedIn_${sundayKey}_${deviceId}`, "true");
    clockInBtn.dataset.locked = "true";
    clockInBtnText.textContent = "✓ Clocked In";

    showModal("Your attendance has been marked successfully. God bless you!");

    document.getElementById("worker-name").value = "";
    document.getElementById("worker-note").value = "";
    document.querySelectorAll(".dept-option input").forEach(cb => cb.checked = false);
    document.querySelectorAll(".service-card").forEach(c => c.classList.remove("selected"));
    selectedService = [];
  } catch (err) {
    console.error("Firestore error:", err);
    alert("❌ Clock-in failed. Please try again.");
    clockInBtn.disabled = false;
    clockInBtnText.textContent = "Clock In";
  }
});
// ---Manifest link -- //
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed:', err));
}