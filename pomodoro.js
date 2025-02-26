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
    pomoTime: 25 * 60,
    breakTime: 5 * 60,
};

// Load Pomodoro session data (tracks the current session)
let pomoData = JSON.parse(localStorage.getItem('pomoData')) || {
    goal: 5,
    current: 1,
    isPomoActive: true,
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
                    document.getElementById('timerText').innerText = "All Done"; 
                    return;
                }
            
                pomoData.isPomoActive = true;
                pomoSettings.pomoTime = JSON.parse(localStorage.getItem('pomoSettings')).pomoTime; // Reset pomo time
                pomoSettings.breakTime = JSON.parse(localStorage.getItem('pomoSettings')).breakTime; // Reset break time
                pomoData.current++;
            
                playDingSound();
                updateTimerDisplay();
            }
            
            else {
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
    const isModOrBroadcaster = userstate.mod || (userstate.badges && userstate.badges.broadcaster);

    if (command === '!pomogoal' && args[0]) {
        if (!isModOrBroadcaster) {
            client.say(channel, `@${username}, you must be a Moderator or Broadcaster to use this command.`);
            return;
        }

        pomoData.goal = parseInt(args[0], 10);
        client.say(channel, `Pomo goal set to ${pomoData.goal}`);
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
        localStorage.removeItem('userTasks');
        stopTimer();
        pomoSettings = { pomoTime: 25 * 60, breakTime: 5 * 60 };
        pomoData = { goal: 5, current: 1, isPomoActive: true, timerInterval: null, isPaused: false };
        userTasks = {};
        client.say(channel, 'Pomodoro settings and tasks cleared and reset.');
        updateTimerDisplay();
    }     else if (command === '!task' && args.length > 0) {
        const task = args.join(' ');
    
        // Inform user if they are updating an existing task
        if (userTasks[username]) {
            client.say(channel, `@${username}, your previous task "${userTasks[username]}" has been updated to: "${task}".`);
        } else {
            client.say(channel, `${username}, your task has been set: "${task}"`);
        }
    
        // Update or set the task
        userTasks[username] = task;
        localStorage.setItem('userTasks', JSON.stringify(userTasks));
    }

    if (command === '!pomogo' && args.length === 3) {
        if (!isModOrBroadcaster) {
            client.say(channel, `@${username}, you must be a Moderator or Broadcaster to use this command.`);
            return;
        }

        const pomoTime = parseInt(args[0], 10) * 60;
        const breakTime = parseInt(args[1], 10) * 60;
        const goal = args[2] === '?' ? '?' : parseInt(args[2], 10);

        if (isNaN(pomoTime) || isNaN(breakTime) || (goal !== '?' && isNaN(goal))) {
            client.say(channel, `@${username}, invalid format. Use: !pomogo {pomoTime} {breakTime} {goal or ?}`);
            return;
        }

        // Stop any running timer before setting new values
        if (pomoData.timerInterval) stopTimer();

        pomoSettings.pomoTime = pomoTime;
        pomoSettings.breakTime = breakTime;
        localStorage.setItem('pomoSettings', JSON.stringify(pomoSettings));

        pomoData.current = 1;
        pomoData.goal = goal;
        pomoData.isPomoActive = true;
        localStorage.setItem('pomoData', JSON.stringify(pomoData));

        client.say(channel, `Pomodoro updated: ${pomoTime / 60} min Pomo, ${breakTime / 60} min Break, Goal: ${goal === '?' ? 'Unlimited' : goal}`);
        startTimer();
    }
});


// Initialize timer display
updateTimerDisplay();
