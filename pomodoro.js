const client = new tmi.Client({
    options: { debug: true },
    connection: {
        reconnect: true,
        secure: true,
    },
    identity: {
        username: 'Bot_Username_Here', // Replace with your bot's username
        password: 'oauth:Bot_Access_Token_Here', // Replace with your OAuth token
    },
    channels: ['Username_here'], // Replace with your channel name
});

client.connect().catch(console.error);

const twitchChannel = 'Username_Here'; // Replace with your actual channel name


// Load Pomodoro settings (fixed values set by !pomostart)
let pomoSettings = JSON.parse(localStorage.getItem('pomoSettings')) || {
    pomoTime: 25 * 60, // Default 25 minutes
    breakTime: 5 * 60, // Default 5 minutes
};

// Load Pomodoro session data (tracks the current session)
let pomoData = JSON.parse(localStorage.getItem('pomoData')) || {
    goal: 5, // Default pomo goal
    current: 1,
    isPomoActive: true, // true for pomo, false for break
    timerInterval: null,
    isPaused: false,
};

// Format time to hh:mm:ss
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Get audio element
const dingSound = document.getElementById('dingSound');

function playDingSound() {
    dingSound.play();
}

// Initialize timer
function initializeTimer() {
    updateTimerDisplay();
    startTimer();
}

initializeTimer();

// Start Pomodoro timer
function startTimer() {
    if (pomoData.timerInterval) return; // Prevent multiple intervals

    pomoData.timerInterval = setInterval(() => {
        if (pomoData.isPaused) return;

        if (pomoData.isPomoActive) {
            if (pomoSettings.pomoTime <= 0) {
                // Pomodoro ended, switch to break
                pomoData.isPomoActive = false;

                playDingSound();
                updateTimerDisplay();
            } else {
                pomoSettings.pomoTime--;
                updateTimerDisplay();
            }
        } else {
            if (pomoSettings.breakTime <= 0) {
                // Break ended, switch back to Pomodoro
                if (pomoData.goal !== "?" && pomoData.current >= pomoData.goal) {
                    stopTimer();
                    client.say(twitchChannel, `Pomodoro goal of ${pomoData.goal} reached! Timer stopped.`);
                    return;
                }

                pomoData.isPomoActive = true;
                pomoSettings.pomoTime = JSON.parse(localStorage.getItem('pomoSettings')).pomoTime; // Reset pomo time
                pomoData.current++;
                playDingSound();
                updateTimerDisplay();
            } else {
                pomoSettings.breakTime--;
                updateTimerDisplay();
            }
        }

        localStorage.setItem('pomoData', JSON.stringify(pomoData));
    }, 1000);
}

function stopTimer() {
    clearInterval(pomoData.timerInterval);
    pomoData.timerInterval = null;
}

function updateTimerDisplay() {
    const pomoText = pomoData.isPomoActive ? 'Pomo' : 'Break';
    const timeLeft = pomoData.isPomoActive ? pomoSettings.pomoTime : pomoSettings.breakTime;
    document.getElementById('timerText').innerText = `${pomoText} ${pomoData.current}/${pomoData.goal} | ${formatTime(timeLeft)}`;
}

client.on('message', (channel, userstate, message, self) => {
    if (self) return;

    const command = message.split(' ')[0].toLowerCase();
    const args = message.split(' ').slice(1);
    const username = userstate.username;

    // Check if the user is a Moderator or Broadcaster
    const isModOrBroadcaster = userstate.mod || userstate.badges && userstate.badges.broadcaster;

    if (command === '!pomogoal' && args[0]) {
        if (!isModOrBroadcaster) {
            client.say(channel, `@${username}, you must be a Moderator or Broadcaster to use this command.`);
            return;
        }

        if (args[0] === "?") {
            pomoData.goal = "?";  // Set the goal to "?"
            client.say(channel, "Pomodoro goal set to unlimited (indefinite timer).");
        } else {
            pomoData.goal = parseInt(args[0], 10);
            client.say(channel, `Pomo goal set to ${pomoData.goal}`);
        }
        localStorage.setItem('pomoData', JSON.stringify(pomoData));
        updateTimerDisplay();
    } else if (command === '!pomostart' && args.length === 2) {
        if (!isModOrBroadcaster) {
            client.say(channel, `@${username}, you must be a Moderator or Broadcaster to use this command.`);
            return;
        }

        if (pomoData.timerInterval) stopTimer();

        pomoSettings.pomoTime = parseInt(args[0], 10) * 60;
        pomoSettings.breakTime = parseInt(args[1], 10) * 60;
        localStorage.setItem('pomoSettings', JSON.stringify(pomoSettings));

        pomoData.current = 1;
        pomoData.isPomoActive = true;

        client.say(channel, `Starting Pomodoro: ${pomoSettings.pomoTime / 60} min Pomo, ${pomoSettings.breakTime / 60} min Break`);
        startTimer();
    } else if (command === '!setpomo') {
        if (!isModOrBroadcaster) {
            client.say(channel, `@${username}, you must be a Moderator or Broadcaster to use this command.`);
            return;
        }

        stopTimer();
        pomoSettings.pomoTime = 25 * 60;
        pomoSettings.breakTime = 5 * 60;
        pomoData.current = 1;
        pomoData.isPomoActive = true;
        client.say(channel, `Pomodoro timer reset.`);
        localStorage.setItem('pomoSettings', JSON.stringify(pomoSettings));
        startTimer();
    } else if (command === '!pause') {
        if (!isModOrBroadcaster) {
            client.say(channel, `@${username}, you must be a Moderator or Broadcaster to use this command.`);
            return;
        }

        if (!pomoData.isPaused) {
            pomoData.isPaused = true;
            stopTimer();
            client.say(channel, 'Pomodoro timer paused.');
            localStorage.setItem('pomoData', JSON.stringify(pomoData));
        }
    } else if (command === '!resume') {
        if (!isModOrBroadcaster) {
            client.say(channel, `@${username}, you must be a Moderator or Broadcaster to use this command.`);
            return;
        }

        if (pomoData.isPaused) {
            pomoData.isPaused = false;
            startTimer();
            client.say(channel, 'Pomodoro timer resumed.');
            localStorage.setItem('pomoData', JSON.stringify(pomoData));
        }
    } else if (command === '!clearstorage') {
        if (!isModOrBroadcaster) {
            client.say(channel, `@${username}, you must be a Moderator or Broadcaster to use this command.`);
            return;
        }

        localStorage.removeItem('pomoSettings');
        localStorage.removeItem('pomoData');
        stopTimer();
        pomoSettings = { pomoTime: 25 * 60, breakTime: 5 * 60 };
        pomoData = { goal: 5, current: 1, isPomoActive: true, timerInterval: null, isPaused: false };
        client.say(channel, 'Pomodoro settings cleared and reset.');
        updateTimerDisplay();
    }
});


// Initialize timer display
updateTimerDisplay();
