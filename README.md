# 🎯 Misery Twitch Pomodoro Timer  

A browser-based Pomodoro timer for Twitch streamers, designed to be used as a browser source in OBS. This bot allows you to manage a focus timer via Twitch chat commands, keeping you and your viewers productive!  

## 🚀 Features  

- **Pomodoro Timer for Streamers** – Add it as a browser source in OBS.  
- **Twitch Chat Integration** – Moderators and broadcasters can control the timer.  
- **Local Storage Support** – Saves session progress automatically.  
- **Customizable CSS** – Modify styles to match your overlay.  

## 🎮 Commands  

| Command | Description |  
|---------|-------------|  
| `!pomostart [work] [break]` | Starts a Pomodoro session (minutes). Example: `!pomostart 25 5` |  
| `!pomogoal [number]` | Sets the number of Pomodoro sessions before stopping (`?` for unlimited). |  
| `!setpomo` | Resets the timer to default (25 min work, 5 min break). |  
| `!pause` | Pauses the current Pomodoro session. |  
| `!resume` | Resumes a paused session. |  
| `!clearstorage` | Clears stored Pomodoro settings. |  

> **Note:** Only **moderators and broadcasters** can use these commands.  

## 🛠 Setup Instructions  

1. **Add the URL as a Browser Source in OBS**  
   - Download the bot to a folder.  
   - Add index.html as a **browser source** in OBS.  

2. **Customize the CSS** *(Optional)*  
   Modify the appearance using CSS to match your stream:  

   ```css  
   #timerText {  
       font-size: 36px;  
       font-weight: 600;  
       color: white;  
       background: rgba(0, 0, 0, 0.8);  
       padding: 10px 20px;  
       border-radius: 15px;  
   }  
   ```  

## 🔗 Connecting to Twitch Chat  

This project uses [`tmi.js`](https://github.com/tmijs/tmi.js) to connect to Twitch chat. The bot listens for commands and interacts with your chat.  

### ✨ How It Works  

The bot connects to your Twitch channel using the following configuration:  

```js
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
```

### 🔧 Setting Up Your Bot  

1. **Create a Twitch Bot Account** *(If you don’t have one already)*  
   - Go to [Twitch](https://www.twitch.tv) and create a new account for your bot.  

2. **Generate an OAuth Token**  
   - Get an OAuth token from [twitchtokengenerator.com](https://twitchtokengenerator.com/).  
   - Copy and replace the `password` field in the code with your generated access token.  

3. **Set Your Channel Name**  
   - Replace `'Username_here'` with your actual Twitch channel name in the `channels` array.  

Once set up, the bot will join your chat automatically and respond to commands!  

## 📌 Notes  

- The bot works **entirely in the browser** (no Node.js needed).  
- Your bot must be a **moderator** in your Twitch chat to send messages.  
- The timer plays a sound when switching between work and break sessions.  

## 📜 License  

This project is licensed under the **MIT License**.  

## 🏆 Contributing  

Feel free to suggest features or submit pull requests! 🎉  
