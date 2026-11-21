/* ==========================================
   FOCUSFLOW PLUS — COMPLETE JAVASCRIPT
   ========================================== */


/* 1. HTML ELEMENTS */

const $ = (id) => document.getElementById(id);

const currentDate = $("currentDate");

const taskForm = $("taskForm");
const taskInput = $("taskInput");
const taskList = $("taskList");
const emptyTasks = $("emptyTasks");
const taskCount = $("taskCount");

const completedCount = $("completedCount");
const remainingCount = $("remainingCount");
const focusCount = $("focusCount");
const progressPercent = $("progressPercent");

const timerDisplay = $("timerDisplay");
const timerMode = $("timerMode");
const timerStatus = $("timerStatus");
const startTimer = $("startTimer");
const resetTimer = $("resetTimer");

const notesInput = $("notesInput");
const notesStatus = $("notesStatus");
const clearNotes = $("clearNotes");

const themeToggle = $("themeToggle");

const focusModeBtn = $("focusModeBtn");
const breakModeBtn = $("breakModeBtn");

const goalForm = $("goalForm");
const goalInput = $("goalInput");
const goalList = $("goalList");

const generatePlanBtn = $("generatePlanBtn");
const smartPlanList = $("smartPlanList");
const deadlineMessage = $("deadlineMessage");


/* 2. LOCAL STORAGE HELPERS */

function readStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    } catch (error) {
        console.error("Could not read storage:", key, error);
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error("Could not save data:", key, error);
    }
}


/* 3. APP DATA */

let tasks = readStorage("focusflowTasks", []);

if (!Array.isArray(tasks)) {
    tasks = [];
}

// Keep old tasks compatible with the current version.
tasks = tasks.map((task, index) => ({
    id: task.id ?? (Date.now() + index),
    text: task.text ?? task.title ?? "",
    subject: task.subject ?? "",
    dueDate: task.dueDate ?? "",
    priority: task.priority ?? "medium",
    completed: Boolean(task.completed),
    createdAt: task.createdAt ?? new Date().toISOString(),
    completedAt: task.completedAt ?? null
}));

let currentFilter = "all";

let focusSessions =
    Number(localStorage.getItem("focusflowSessions")) || 0;

let selectedMinutes = 25;
let remainingSeconds = selectedMinutes * 60;
let timerInterval = null;
let timerRunning = false;

let goals = readStorage("focusflowGoals", []);

if (!Array.isArray(goals)) {
    goals = [];
}

const todayKey = new Date().toLocaleDateString("en-CA");

let habits = readStorage("focusflowHabits", {
    date: todayKey,
    checked: {}
});

if (!habits || habits.date !== todayKey) {
    habits = {
        date: todayKey,
        checked: {}
    };

    writeStorage("focusflowHabits", habits);
}


/* 4. CURRENT DATE */

function showCurrentDate() {
    if (!currentDate) return;

    currentDate.textContent = new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

showCurrentDate();


/* 5. SAVE TASKS */

function saveTasks() {
    writeStorage("focusflowTasks", tasks);
}


/* 6. UPDATE DASHBOARD STATISTICS */

function updateStats() {
    const completed = tasks.filter(task => task.completed).length;
    const remaining = tasks.length - completed;

    const progress = tasks.length
        ? Math.round((completed / tasks.length) * 100)
        : 0;

    if (completedCount) {
        completedCount.textContent = completed;
    }

    if (remainingCount) {
        remainingCount.textContent = remaining;
    }

    if (focusCount) {
        focusCount.textContent = focusSessions;
    }

    if (progressPercent) {
        progressPercent.textContent = progress + "%";
    }

    if (taskCount) {
        taskCount.textContent =
            tasks.length + (tasks.length === 1 ? " task" : " tasks");
    }
}


/* 7. DISPLAY TODAY'S TASKS */

function renderTasks() {
    if (!taskList) return;

    taskList.innerHTML = "";

    const filteredTasks = tasks.filter(task => {
        if (currentFilter === "pending") {
            return !task.completed;
        }

        if (currentFilter === "completed") {
            return task.completed;
        }

        return true;
    });

    if (emptyTasks) {
        emptyTasks.style.display =
            filteredTasks.length === 0 ? "block" : "none";

        if (filteredTasks.length === 0) {
            if (currentFilter === "completed" && tasks.length > 0) {
                emptyTasks.textContent =
                    "No completed tasks yet. Keep going! ✨";
            } else if (
                currentFilter === "pending" &&
                tasks.length > 0
            ) {
                emptyTasks.textContent =
                    "Amazing! All your tasks are complete! 🎉";
            } else {
                emptyTasks.textContent =
                    "Your space is ready. Add your first task! ✨";
            }
        }
    }

    filteredTasks.forEach(task => {
        const taskItem = document.createElement("div");
        taskItem.className = "task-item";

        if (task.completed) {
            taskItem.classList.add("completed");
        }

        // Checkbox
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-checkbox";
        checkbox.checked = Boolean(task.completed);
        checkbox.setAttribute(
            "aria-label",
            "Mark task as completed"
        );

        checkbox.addEventListener("change", function () {
            toggleTask(task.id);
        });

        // Task information
        const taskDetails = document.createElement("div");
        taskDetails.className = "task-details";

        const taskText = document.createElement("span");
        taskText.className = "task-text";
        taskText.textContent = task.text;

        taskDetails.appendChild(taskText);

        // Subject and deadline
        const meta = [];

        if (task.subject) {
            meta.push(task.subject);
        }

        if (task.dueDate) {
            const dueDate = new Date(task.dueDate + "T00:00:00");

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const dateLabel = dueDate.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short"
            });

            if (dueDate < today && !task.completed) {
                meta.push("Overdue · " + dateLabel);
            } else {
                meta.push("Due · " + dateLabel);
            }
        }

        if (meta.length > 0) {
            const detailLine = document.createElement("small");
            detailLine.className = "task-meta";
            detailLine.textContent = meta.join(" · ");

            taskDetails.appendChild(detailLine);
        }

        // Priority badge
        if (task.priority) {
            const priority = document.createElement("span");

            priority.className =
                "priority-badge priority-" + task.priority;

            priority.textContent = task.priority;

            taskDetails.appendChild(priority);
        }

        // Delete button
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-task-btn";
        deleteButton.textContent = "×";
        deleteButton.setAttribute("aria-label", "Delete task");

        deleteButton.addEventListener("click", function () {
            deleteTask(task.id);
        });

        taskItem.append(checkbox, taskDetails, deleteButton);

        taskList.appendChild(taskItem);
    });

    updateStats();
    renderInsights();
    buildSmartPlan();
}


/* 8. ADD A NEW TASK */

if (taskForm && taskInput) {
    taskForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const text = taskInput.value.trim();

        if (!text) {
            taskInput.focus();
            return;
        }

        const subjectField = $("taskSubject");
        const dateField = $("taskDueDate");
        const priorityField = $("taskPriority");

        const newTask = {
            id: Date.now(),
            text: text,
            subject: subjectField ? subjectField.value.trim() : "",
            dueDate: dateField ? dateField.value : "",
            priority: priorityField
                ? priorityField.value || "medium"
                : "medium",
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        tasks.push(newTask);

        saveTasks();

        currentFilter = "all";

        document.querySelectorAll(".filter-btn").forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.filter === "all"
            );
        });

        renderTasks();

        taskForm.reset();
        taskInput.focus();
    });
}


/* 9. TICK / UNTICK TASK — FIXED */

function toggleTask(id) {
    const task = tasks.find(
        item => String(item.id) === String(id)
    );

    if (!task) {
        console.error("Task not found:", id);
        return;
    }

    task.completed = !task.completed;

    task.completedAt = task.completed
        ? new Date().toISOString()
        : null;

    saveTasks();
    renderTasks();
}


/* 10. DELETE TASK — FIXED */

function deleteTask(id) {
    const previousLength = tasks.length;

    tasks = tasks.filter(
        task => String(task.id) !== String(id)
    );

    if (tasks.length === previousLength) {
        console.error("Task could not be found for deletion:", id);
        return;
    }

    saveTasks();
    renderTasks();
}


/* 11. TASK FILTERS */

document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", function () {
        currentFilter = this.dataset.filter || "all";

        document.querySelectorAll(".filter-btn").forEach(item => {
            item.classList.toggle("active", item === this);
        });

        renderTasks();
    });
});


/* 12. POMODORO TIMER */

function updateTimerDisplay() {
    if (!timerDisplay) return;

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    timerDisplay.textContent =
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0");
}

function stopTimer() {
    clearInterval(timerInterval);

    timerInterval = null;
    timerRunning = false;

    if (startTimer) {
        startTimer.textContent = "▶ Start Focus";
    }
}

function startCountdown() {
    if (timerRunning) {
        stopTimer();

        if (timerStatus) {
            timerStatus.textContent = "Paused — take your time.";
        }

        return;
    }

    if (remainingSeconds <= 0) {
        remainingSeconds = selectedMinutes * 60;
        updateTimerDisplay();
    }

    timerRunning = true;

    if (startTimer) {
        startTimer.textContent = "Ⅱ Pause Timer";
    }

    if (timerStatus) {
        timerStatus.textContent = "You're doing great. Keep going!";
    }

    timerInterval = setInterval(function () {
        remainingSeconds--;

        updateTimerDisplay();

        if (remainingSeconds <= 0) {
            stopTimer();

            if (timerStatus) {
                timerStatus.textContent =
                    "Session complete! Great work! 🎉";
            }

            // Count completed focus sessions, not short breaks.
            if (selectedMinutes !== 5) {
                focusSessions++;

                localStorage.setItem(
                    "focusflowSessions",
                    String(focusSessions)
                );

                const logs = readStorage("focusflowSessionLog", []);

                logs.push({
                    date: new Date().toISOString(),
                    minutes: selectedMinutes
                });

                writeStorage("focusflowSessionLog", logs);

                updateStats();
                renderInsights();
            }

            alert("Your timer is complete! Time for a little break. 🎉");
        }
    }, 1000);
}

if (startTimer) {
    startTimer.addEventListener("click", startCountdown);
}

if (resetTimer) {
    resetTimer.addEventListener("click", function () {
        stopTimer();

        remainingSeconds = selectedMinutes * 60;

        updateTimerDisplay();

        if (timerStatus) {
            timerStatus.textContent = "Ready when you are.";
        }
    });
}


/* 13. TIMER PRESETS */

document.querySelectorAll(".preset-btn").forEach(button => {
    button.addEventListener("click", function () {
        stopTimer();

        const minutes = Number(this.dataset.minutes);

        if (!Number.isFinite(minutes) || minutes <= 0) {
            return;
        }

        selectedMinutes = minutes;
        remainingSeconds = selectedMinutes * 60;

        document.querySelectorAll(".preset-btn").forEach(item => {
            item.classList.toggle("active", item === this);
        });

        if (timerMode) {
            timerMode.textContent =
                selectedMinutes === 5
                    ? "SHORT BREAK"
                    : "FOCUS SESSION";
        }

        if (timerStatus) {
            timerStatus.textContent = "Ready when you are.";
        }

        updateTimerDisplay();
    });
});


/* 14. QUICK BREAK */

if (breakModeBtn) {
    breakModeBtn.addEventListener("click", function () {
        stopTimer();

        selectedMinutes = 5;
        remainingSeconds = 5 * 60;

        document.querySelectorAll(".preset-btn").forEach(button => {
            button.classList.toggle(
                "active",
                Number(button.dataset.minutes) === 5
            );
        });

        if (timerMode) {
            timerMode.textContent = "SHORT BREAK";
        }

        if (timerStatus) {
            timerStatus.textContent =
                "Relax your shoulders, sip water, and rest.";
        }

        updateTimerDisplay();

        if ($("focus")) {
            $("focus").scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    });
}


/* 15. FOCUS MODE */

if (focusModeBtn) {
    focusModeBtn.addEventListener("click", function () {
        document.body.classList.toggle("focus-mode-active");

        const active =
            document.body.classList.contains("focus-mode-active");

        focusModeBtn.textContent = active
            ? "✕ Exit Focus Mode"
            : "⛶ Focus Mode";

        if (active && $("focus")) {
            $("focus").scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    });
}


/* 16. QUICK NOTES */

if (notesInput) {
    notesInput.value =
        localStorage.getItem("focusflowNotes") || "";

    notesInput.addEventListener("input", function () {
        localStorage.setItem("focusflowNotes", notesInput.value);

        if (notesStatus) {
            notesStatus.textContent = "Saved automatically ✓";
        }
    });
}

if (clearNotes) {
    clearNotes.addEventListener("click", function () {
        if (notesInput) {
            notesInput.value = "";
        }

        localStorage.removeItem("focusflowNotes");

        if (notesStatus) {
            notesStatus.textContent = "Notes cleared.";
        }
    });
}


/* 17. LIGHT / DARK THEME */

const savedTheme = localStorage.getItem("focusflowTheme");

if (savedTheme === "light") {
    document.body.classList.add("light-theme");
}

function updateThemeButton() {
    if (!themeToggle) return;

    const lightMode =
        document.body.classList.contains("light-theme");

    themeToggle.innerHTML = lightMode
        ? "<span>☾</span> Switch to Dark"
        : "<span>☼</span> Switch to Light";
}

updateThemeButton();

if (themeToggle) {
    themeToggle.addEventListener("click", function () {
        document.body.classList.toggle("light-theme");

        const lightMode =
            document.body.classList.contains("light-theme");

        localStorage.setItem(
            "focusflowTheme",
            lightMode ? "light" : "dark"
        );

        updateThemeButton();
    });
}


/* 18. SIDEBAR NAVIGATION */

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", function () {
        document.querySelectorAll(".nav-link").forEach(item => {
            item.classList.remove("active");
        });

        this.classList.add("active");
    });
});


/* 19. GOALS */

function saveGoals() {
    writeStorage("focusflowGoals", goals);
}

function renderGoals() {
    if (!goalList) return;

    goalList.innerHTML = "";

    if (goals.length === 0) {
        const message = document.createElement("p");
        message.className = "muted-small";
        message.textContent = "Your goals will show up here.";

        goalList.appendChild(message);
        return;
    }

    goals.forEach(goal => {
        const row = document.createElement("div");

        row.className = "goal-item";

        if (goal.done) {
            row.classList.add("goal-done");
        }

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = Boolean(goal.done);
        checkbox.setAttribute("aria-label", "Complete goal");

        checkbox.addEventListener("change", function () {
            goal.done = checkbox.checked;

            saveGoals();
            renderGoals();
            renderInsights();
        });

        const label = document.createElement("span");
        label.textContent = goal.text;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-task-btn";
        deleteButton.textContent = "×";
        deleteButton.setAttribute("aria-label", "Delete goal");

        deleteButton.addEventListener("click", function () {
            goals = goals.filter(
                item => String(item.id) !== String(goal.id)
            );

            saveGoals();
            renderGoals();
            renderInsights();
        });

        row.append(checkbox, label, deleteButton);
        goalList.appendChild(row);
    });
}

if (goalForm && goalInput) {
    goalForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const text = goalInput.value.trim();

        if (!text) return;

        goals.push({
            id: Date.now(),
            text: text,
            done: false,
            createdAt: new Date().toISOString()
        });

        saveGoals();

        goalInput.value = "";

        renderGoals();
        renderInsights();
    });
}


/* 20. DAILY HABITS */

function renderHabits() {
    const checkboxes = document.querySelectorAll(".habit-check");

    checkboxes.forEach(checkbox => {
        const habitName = checkbox.dataset.habit;

        checkbox.checked = Boolean(habits.checked[habitName]);

        checkbox.onchange = function () {
            habits.checked[habitName] = checkbox.checked;

            writeStorage("focusflowHabits", habits);

            updateHabitProgress();
        };
    });

    updateHabitProgress();
}

function updateHabitProgress() {
    const total = document.querySelectorAll(".habit-check").length;
    const completed = document.querySelectorAll(
        ".habit-check:checked"
    ).length;

    const progress = $("habitProgress");

    if (progress) {
        progress.textContent =
            `${completed} of ${total} habits completed today`;
    }
}


/* 21. SMART STUDY PLAN + DEADLINE ALERTS */

function buildSmartPlan() {
    if (!smartPlanList) return;

    const priorityRank = {
        high: 0,
        medium: 1,
        low: 2
    };

    const pending = tasks
        .filter(task => !task.completed)
        .slice()
        .sort(function (a, b) {
            const priorityDifference =
                (priorityRank[a.priority] ?? 1) -
                (priorityRank[b.priority] ?? 1);

            if (priorityDifference !== 0) {
                return priorityDifference;
            }

            if (a.dueDate && b.dueDate) {
                return a.dueDate.localeCompare(b.dueDate);
            }

            if (a.dueDate) return -1;
            if (b.dueDate) return 1;

            return 0;
        });

    smartPlanList.innerHTML = "";

    if (pending.length === 0) {
        const message = document.createElement("p");
        message.className = "muted-small";
        message.textContent =
            "No pending tasks. Add a task to create your plan.";

        smartPlanList.appendChild(message);
    }

    pending.slice(0, 8).forEach(function (task, index) {
        const item = document.createElement("div");
        item.className = "smart-plan-item";

        const number = document.createElement("span");
        number.className = "plan-number";
        number.textContent = String(index + 1).padStart(2, "0");

        const body = document.createElement("div");

        const title = document.createElement("strong");
        title.textContent = task.text;

        const detail = document.createElement("p");

        const estimate =
            task.priority === "high"
                ? "Start with a 25-minute focus block"
                : task.priority === "low"
                    ? "Fit this into a lighter study slot"
                    : "Try one focused 25-minute block";

        const information = [];

        if (task.subject) {
            information.push(task.subject);
        }

        if (task.dueDate) {
            information.push(
                "Due " +
                new Date(task.dueDate + "T00:00:00")
                    .toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short"
                    })
            );
        } else {
            information.push("No deadline set");
        }

        information.push(estimate);

        detail.textContent = information.join(" · ");

        body.append(title, detail);
        item.append(number, body);

        smartPlanList.appendChild(item);
    });

    if (deadlineMessage) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = tasks
            .filter(task => !task.completed && task.dueDate)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

        if (upcoming.length === 0) {
            deadlineMessage.textContent =
                "No deadlines yet. Add a due date to a task to keep track.";
        } else {
            const nextTask = upcoming[0];

            const due = new Date(nextTask.dueDate + "T00:00:00");

            const days = Math.round(
                (due.getTime() - today.getTime()) / 86400000
            );

            if (days < 0) {
                deadlineMessage.textContent =
                    `"${nextTask.text}" is overdue. Consider tackling it first.`;
            } else if (days === 0) {
                deadlineMessage.textContent =
                    `"${nextTask.text}" is due today. Make space for it.`;
            } else {
                deadlineMessage.textContent =
                    `Next up: "${nextTask.text}" in ${days} day${days === 1 ? "" : "s"}.`;
            }
        }
    }
}

if (generatePlanBtn) {
    generatePlanBtn.addEventListener("click", buildSmartPlan);
}


/* 22. WEEKLY REPORT + FOCUSFLOW INSIGHTS */

function renderInsights() {
    const weeklyTasks = $("weeklyTasks");
    const weeklySessions = $("weeklySessions");
    const completedGoals = $("completedGoals");
    const weeklyBars = $("weeklyBars");
    const insightMessage = $("insightMessage");

    const now = new Date();

    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - 6);

    const completedTasks = tasks.filter(task => task.completed);

    const weeklyCompleted = completedTasks.filter(task => {
        return task.completedAt &&
            new Date(task.completedAt) >= weekStart;
    }).length;

    const sessionLog = readStorage("focusflowSessionLog", []);

    const weeklySessionCount = Array.isArray(sessionLog)
        ? sessionLog.filter(session => {
            return new Date(session.date) >= weekStart;
        }).length
        : 0;

    if (weeklyTasks) {
        weeklyTasks.textContent = weeklyCompleted;
    }

    if (weeklySessions) {
        weeklySessions.textContent = weeklySessionCount;
    }

    if (completedGoals) {
        completedGoals.textContent =
            goals.filter(goal => goal.done).length;
    }

    // Weekly activity chart
    if (weeklyBars) {
        weeklyBars.innerHTML = "";

        const dayNames = [
            "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
        ];

        const counts = [];

        for (let i = 6; i >= 0; i--) {
            const day = new Date(now);
            day.setDate(now.getDate() - i);
            day.setHours(0, 0, 0, 0);

            const nextDay = new Date(day);
            nextDay.setDate(day.getDate() + 1);

            const count = completedTasks.filter(task => {
                if (!task.completedAt) return false;

                const date = new Date(task.completedAt);

                return date >= day && date < nextDay;
            }).length;

            counts.push({
                label: dayNames[day.getDay()],
                count: count
            });
        }

        const maxCount = Math.max(
            1,
            ...counts.map(day => day.count)
        );

        counts.forEach(function (day) {
            const column = document.createElement("div");
            column.className = "bar-column";

            const number = document.createElement("span");
            number.textContent = day.count;

            const track = document.createElement("div");
            track.className = "bar-track";

            const fill = document.createElement("div");
            fill.className = "bar-fill";

            fill.style.height =
                Math.max(
                    day.count ? 12 : 4,
                    (day.count / maxCount) * 100
                ) + "%";

            const label = document.createElement("small");
            label.textContent = day.label;

            track.appendChild(fill);
            column.append(number, track, label);

            weeklyBars.appendChild(column);
        });
    }

    // Personalized insight
    if (insightMessage) {
        const pendingCount =
            tasks.filter(task => !task.completed).length;

        const highPriorityCount =
            tasks.filter(task => {
                return !task.completed && task.priority === "high";
            }).length;

        if (tasks.length === 0) {
            insightMessage.textContent =
                "Start by adding one small task. Your report will grow with your progress.";
        } else if (highPriorityCount > 0) {
            insightMessage.textContent =
                `You have ${highPriorityCount} high-priority task${highPriorityCount === 1 ? "" : "s"} pending. Try starting with one, then take a short break.`;
        } else if (pendingCount > 0) {
            insightMessage.textContent =
                `You have ${pendingCount} task${pendingCount === 1 ? "" : "s"} left. A single focused session is a good next step.`;
        } else {
            insightMessage.textContent =
                "All your tasks are complete — take a moment to appreciate your progress! 🎉";
        }
    }
}

const refreshInsights = $("refreshInsights");

if (refreshInsights) {
    refreshInsights.addEventListener("click", renderInsights);
}


/* 23. SAVE ALL INITIAL DATA */

saveTasks();


/* 24. START THE APP */

renderTasks();
renderGoals();
renderHabits();
renderInsights();
buildSmartPlan();
updateTimerDisplay();
updateStats();

console.log("FocusFlow Plus is ready! ✨");
