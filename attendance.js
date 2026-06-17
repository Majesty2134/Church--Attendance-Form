import { db } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

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

// --- Submit button ---
document.querySelector(".submit-btn").addEventListener("click", async () => {
  const name = document.getElementById("worker-name").value.trim();
  const arrival = document.getElementById("worker-arrival").value;
  const note = document.getElementById("worker-note").value.trim();

  const checkedDepts = [...document.querySelectorAll(".dept-option input:checked")]
    .map(cb => cb.value);

  // ✅ Correct validation for this form
  const errorEl = document.getElementById("form-error");

  if (!name) {
    errorEl.textContent = "Kindly fill in your full name before submitting.";
    errorEl.style.display = "block";
    return;
  }
  if (checkedDepts.length === 0) {
    errorEl.textContent = "Kindly select at least one department before submitting.";
    errorEl.style.display = "block";
    return;
  }
  if (selectedService.length === 0) {
    errorEl.textContent = "Kindly select a service before submitting.";
    errorEl.style.display = "block";
    return;
  }

  errorEl.style.display = "none";

  const submitBtn = document.querySelector(".submit-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  const data = {
    fullName: name,
    arrivalTime: arrival || "Not specified",
    departments: checkedDepts,
    service: selectedService,
    remarks: note || "None",
    date: today.toISOString().split("T")[0],
    markedAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "attendance"), data);
    showModal("Your attendance has been marked successfully. God bless you!");
    document.getElementById("worker-name").value = "";
    document.getElementById("worker-arrival").value = "";
    document.getElementById("worker-note").value = "";
    document.querySelectorAll(".dept-option input").forEach(cb => cb.checked = false);
    document.querySelectorAll(".service-card").forEach(c => c.classList.remove("selected"));
    selectedService = [];
  } catch (err) {
    console.error("Firestore error:", err);
    alert("❌ Submission failed. Please try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="ti ti-circle-check"></i> Submit attendance';
  }
});