/*jslint browser */

"use strict";

const ENDPOINT = "https://formcarry.com/s/TIRK9C4JF8x";
const STORAGE_KEY = "feedbackFormDraft";
const FIELDS = ["name", "email", "phone", "organization", "message"];
const FORM_HASH = "#feedback";

const dialog = document.getElementById("feedback-dialog");
const form = document.getElementById("feedback-form");
const openButton = document.getElementById("open-form");
const closeButton = document.getElementById("close-form");
const submitButton = document.getElementById("submit-btn");
const statusBox = document.getElementById("status");

function showStatus(text, kind) {
    statusBox.textContent = text;
    statusBox.className = "status " + kind;
}

function clearStatus() {
    statusBox.textContent = "";
    statusBox.className = "status";
}

function saveDraft() {
    const draft = {};
    FIELDS.forEach(function (name) {
        draft[name] = form.elements[name].value;
    });
    draft.agree = form.elements.agree.checked;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch (ignore) {
        // Хранилище недоступно — форма продолжает работать без сохранения.
    }
}

function restoreDraft() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw === null) {
            return;
        }
        const draft = JSON.parse(raw);
        FIELDS.forEach(function (name) {
            if (typeof draft[name] === "string") {
                form.elements[name].value = draft[name];
            }
        });
        form.elements.agree.checked = draft.agree === true;
    } catch (ignore) {
        // Повреждённые данные просто игнорируем.
    }
}

function clearDraft() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (ignore) {
        // Ничего не делаем, если хранилище недоступно.
    }
}

function showForm() {
    if (!dialog.open) {
        dialog.showModal();
    }
}

function hideForm() {
    if (dialog.open) {
        dialog.close();
    }
    clearStatus();
}

function openForm() {
    showForm();
    if (window.location.hash !== FORM_HASH) {
        window.history.pushState({form: true}, "", FORM_HASH);
    }
}

function closeForm() {
    if (window.location.hash === FORM_HASH && window.history.state !== null) {
        window.history.back();
    } else {
        window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search
        );
        hideForm();
    }
}

function collectData() {
    const data = {};
    FIELDS.forEach(function (name) {
        data[name] = form.elements[name].value.trim();
    });
    data.agree = form.elements.agree.checked;
    return data;
}

async function sendForm(event) {
    event.preventDefault();
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    submitButton.disabled = true;
    showStatus("Отправляем…", "");
    try {
        const response = await fetch(ENDPOINT, {
            body: JSON.stringify(collectData()),
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            method: "POST"
        });
        if (!response.ok) {
            showStatus("Ошибка " + response.status + ": сообщение не отправлено. Попробуйте ещё раз.", "error");
        } else {
            form.reset();
            clearDraft();
            showStatus("Спасибо! Сообщение отправлено.", "ok");
        }
    } catch (ignore) {
        showStatus("Не удалось отправить: проверьте интернет и попробуйте снова.", "error");
    }
    submitButton.disabled = false;
}

function syncWithUrl() {
    if (window.location.hash === FORM_HASH) {
        showForm();
    } else {
        hideForm();
    }
}

restoreDraft();
openButton.addEventListener("click", openForm);
closeButton.addEventListener("click", closeForm);
form.addEventListener("input", saveDraft);
form.addEventListener("change", saveDraft);
form.addEventListener("submit", sendForm);
window.addEventListener("popstate", syncWithUrl);

dialog.addEventListener("cancel", function (event) {
    event.preventDefault();
    closeForm();
});

dialog.addEventListener("click", function (event) {
    if (event.target === dialog) {
        closeForm();
    }
});

if (window.location.hash === FORM_HASH) {
    showForm();
}
