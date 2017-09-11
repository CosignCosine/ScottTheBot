/**
ScottTheBot v1.7
by Scott, alias @CosignCosine

Please don't copy any code without credit.
*/

// Dependencies
const Discord    = require('discord.js');
const fs         = require('fs');
const {app, BrowserWindow, dialog, Menu, MenuItem, ipcMain} = require('electron');
const path       = require('path');
const url        = require('url');
const {LocalStorage} = require('node-localstorage');

// Variables
var win,
disconnected     = false,
ls               = new LocalStorage('./scratch'),
messageCounter   = 0,
Scott            = new Discord.Client(),
games            = [
    'Something Scotty',
    'Beam me up, Scotty!',
    'Just scouting.',
    'poker or something.',
    'on Discord. Where else?'
],
badWordResponses = [
    'watch your language!',
    'there are better ways to say what you meant.',
    'http://www.dictionary.com/. Learn to use it.',
    'that\'s pretty low.',
    'get a real vocabulary.',
    'you do know there are better places to say that?',
    'really?',
    'you\'re really a poopie head.',
    '***why***???',
    'go away.'
],
kickBanResponses = [
  'Lol, $user$ was **finally** $type$. Saw that one coming a mile away.',
  'Whoa, $user$ was $type$! I wonder what they did???',
  'Get $type$, sucker!!!!!!',
  '$user$ just got **rekt** fam',
  '**LOL SCRUB**'
],
prefix           = "s+",
bw               = (function(){
  let bw;
  fs.readFile('./bot/bw.json', 'utf-8', function(errrr, data) {
      bw = JSON.parse(data);
  });
  return bw;
})(),
cities           = [
    'Brumsfield',
    'Wilson',
    'Port Dennis',
    'Fixer',
    'Delta1140',
    'Myst',
    'Lynnsdale',
    'Parker',
    'San Ciudad',
    'Sirap',
    'Kroywen',
    'Dyer',
    'Cyledown',
    'Boroughfal',
    'Zanesville',
    'Carret',
    'Daele',
    'Nyman',
    'Cristobal',
    'No-lo-sé',
    'Lalaki'
],
loc              = { // The world is on a map from (0, 0) to (50, 50). There are some islands scattered around the outside of the main map. It does not wrap.
    'Brumsfield': [0, 5],
    'Wilson': [15, 26],
    'Port Dennis': [35, 15],
    'Fixer': [5, 4],
    'Delta1140': [0, 0],
    'Myst': [19, 44],
    'Lynnsdale': [20, 22],
    'Parker': [45, 16],
    'San Ciudad': [22, 49],
    'Sirap': [10, 15],
    'Kroywen': [50, 50],
    'Dyer': [3, 49],
    'Cyledown': [19, 46],
    'Boroughfal': [45, 5],
    'Zanesville': [30, 35],
    'Carret': [37, 2],
    'Daele': [10, 25],
    'Nyman': [44, 19],
    'Cristobal': [64, 83],
    'No-lo-sé': [-26, -15],
    'Lalaki': [-56, 49]
},
airlines         = [
    "Delta Airlines",
    "United Airlines",
    "American Airlines",
    "Air Jordan",
    "Scott Air",
    "Feels Private",
    "Goober Airlines",
    "Unreal"
],
places           = [
    'Target',
    'Chick-Fil-A',
    'Starbucks',
    'Walmart',
    'Marden\'s',
    'Max\'s',
    'Best Buy',
    'Six Flags',
    'Arlo\'s',
    'West Bakery',
    'Home'
],
jobDescs         = [
    'Typist',
    'Teacher',
    'Professor',
    'Waiter/Waitress',
    'Concert Pianist',
    'Ballerina',
    'Computer Programmer',
    'Scientist',
    'Game Developer',
    'Software Engineer',
    'Civil Engineer',
    'Professional Gamer',
    'State Employee',
    'Barista',
    'Scientist'
];
for(var i = 0; i < places.length; i++){
    jobDescs.push('Cashier at ' + places[i]);
    jobDescs.push('Manager at ' + places[i]);
}

// Functions
var log          = (type, err) => {
  win.webContents.send('log', JSON.stringify({type: type.toString().length > 0 ? type : 99, err: err || 'none'}))
},
openWindow       = ()          => {
  // Create the browser window.
  win = new BrowserWindow({width: 800, height: 600, titleBarStyle: 'hiddenInset'})
  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, '../frontend/index.html'),
    protocol: 'file:',
    slashes: true
  }))
  win.on('dom-ready', function(){
    log(99)
  })
  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })

},
embed            = (cba)       => {
  return (new Discord.RichEmbed()).setFooter('Called by ' + cba.username, cba.avatarURL);
};

// Menus
const cmenu = new Menu()
cmenu.append(new MenuItem({ label: 'ScottTheBot v2.1' }))
cmenu.append(new MenuItem({ type: 'separator' }))
cmenu.append(new MenuItem({ label: 'Responsive', type: 'checkbox', checked: true }))
cmenu.append(new MenuItem({ label: 'Use Global Blocks', type: 'checkbox', checked: true}))

// Commands
var commands = [
    {
        name: 'test',
        nsfw: false,
        func: (message, args) => {
            var emb = embed(message.author);
            emb.setTitle('Test Command')
            emb.setDescription(args.length > 0 ? args : 'There aren\'t any arguments for this command.')
            message.channel.send({embed: emb})
                .catch((e) => {
                    message.channel.send('```' + e + '```')
                })
        }
    },
    {
        name: 'nsfwtest',
        nsfw: true,
        func: (message, args) => {
            message.channel.send('testing lol')
        }
    },

    {
      name: 'ban',
      nsfw: false,
      func: (message, args) => {
        message.guild.ban(args[0])
      }
    },

    // Word Filter Commands
    {
        name: 'bannedwords',
        nsfw: true,
        needsperms: ['MANAGE_MESSAGES'],
        func: (message, args) => {
            fs.readFile('./bot/bw.json', 'utf-8', function(err, data) {
                if(err){
                    message.channel.send('```' + err + '```');
                    return;
                }
                data = JSON.parse(data);
                bw = data;
                if(data[message.guild.id] && data[message.guild.id].length > 0){
                    var words = data[message.guild.id];
                    var emb = embed(message.author);
                    emb.setTitle('Banned Words')
                    emb.setDescription(words.join(", "))
                    emb.setColor('#ff7700')
                    message.channel.send({embed: emb})
                        .catch((e) => {
                            message.channel.send('```' + e + '```')
                        })
                }else{
                    data[message.guild.id] = [];
                    fs.writeFile('./bot/bw.json', JSON.stringify(data), 'utf-8', function(){
                        log(2)
                        var emb = embed(message.author);
                        emb.setTitle('Banned Words')
                        emb.setDescription('There are no banned words for this server.')
                        emb.setColor('#ff0000')
                        message.channel.send({embed: emb})
                            .catch((e) => {
                                message.channel.send('```' + e + '```')
                            })
                    })
                }
            });
        }
    },
    {
        name: 'addbannedwords',
        nsfw: true,
        needsperms: ['MANAGE_MESSAGES'],
        func: (message, args) => {
            fs.readFile('./bot/bw.json', 'utf-8', function(err, data) {
                if(err){
                    message.channel.send('```' + err + '```');
                    return;
                }
                data = JSON.parse(data);
                if(!data[message.guild.id]){
                    data[message.guild.id] = [];
                }
                for(var i = 0; i < args.length; i++){
                    data[message.guild.id].push(args[i]);
                }
                var emb = embed(message.author);
                emb.setTitle('Banned Words')
                emb.setDescription(data[message.guild.id].join(", "))
                emb.setColor('#ff7700')
                message.channel.send({embed: emb})
                    .catch((e) => {
                        message.channel.send('```' + e + '```')
                    })
                fs.writeFile('./bot/bw.json', JSON.stringify(data), 'utf-8', function(){
                    log(2)
                    bw = data;
                })
            });
        }
    },
    {
        name: 'removebannedwords',
        nsfw: true,
        needsperms: ['MANAGE_MESSAGES'],
        func: (message, args) => {
            fs.readFile('./bot/bw.json', 'utf-8', function(err, data) {
                if(err){
                    message.channel.send('```' + err + '```');
                    return;
                }
                data = JSON.parse(data);
                if(!data[message.guild.id] || data[message.guild.id].length < 1){
                    var emb = embed(message.author);
                    emb.setTitle('Banned Words')
                    emb.setDescription('There are no banned words for this server.')
                    emb.setColor('#ff0000')
                    message.channel.send({embed: emb})
                        .catch((e) => {
                            message.channel.send('```' + e + '```')
                        })
                }else{
                    var nonBanned = [];
                    for(var i = 0; i < args.length; i++){
                        if(data[message.guild.id].indexOf(args[i]) !== -1){
                            for(var j = 0; j < data[message.guild.id].length; j++){
                                if(args[i] === data[message.guild.id][j]){
                                    data[message.guild.id].splice(j, 1);
                                }
                            }
                        }else{
                            nonBanned.push(args[i])
                        }
                    }
                    var emb = embed(message.author);
                    emb.setTitle('Banned Words')
                    emb.setDescription(data[message.guild.id].join(", "))
                    if(nonBanned.length > 0){
                        emb.addField('Cannot remove words that aren\'t banned!', nonBanned.join(", "))
                    }
                    emb.setColor('#ff7700')
                    message.channel.send({embed: emb})
                        .catch((e) => {
                            message.channel.send('```' + e + '```')
                        })
                    fs.writeFile('./bot/bw.json', JSON.stringify(data), 'utf-8', function(){
                        log(2)
                        bw = data;
                    })
                }
            });
        }
    },

    //Life Bot Commands
    {
        name: 'game',
        nsfw: false,
        func: (message, args) => {
            message.channel.startTyping();
            var emb = embed(message.author);
            emb.setTitle('The Life Game');
            emb.setDescription(`${message.author.username}, welcome to the game of life!`)
            emb.setColor("#7d42f4");
            fs.readFile('./bot/ranks.json', 'utf-8', function(err, data) {
                data = JSON.parse(data);
                data.characters.sort(function(a, b) {
                    return a.id*1 - b.id*1;
                });
                var personalData = null;
                for(var i = 0; i < data.characters.length; i++){
                    if(data.characters[i].id === message.author.id){
                        personalData = data.characters[i];
                        break;
                    }
                }
                if(personalData !== null){
                    emb.addField('Character Name', personalData.character.name);
                    emb.addField('Hair Color', personalData.character.hairColor);
                    emb.addField('Eye Color', personalData.character.eyeColor);
                    emb.addField('Skin Color', personalData.character.skinColor);
                    emb.addField('About Me', personalData.character.aboutMe);
                    emb.addField('Bank', '🔰' + personalData.bank)
                    emb.addField('Job', personalData.job.desc);
                    emb.addField('Salary', '🔰' + personalData.job.salary);
                    emb.addField('Education', personalData.education);
                    emb.addField('Belongings', personalData.belongings.length > 0 ? personalData.belongings.join(",") : "None")
                    emb.addField('Location', personalData.location)
                }else{
                    emb.addField('You don\'t have a character!', 'Change its info with `s+charset <key>, <description>`.')
                    emb.addField('Character Name', 'Unset');
                    emb.addField('Hair Color', 'Unset');
                    emb.addField('Eye Color', 'Unset');
                    emb.addField('Skin Color', 'Unset');
                    emb.addField('About Me', 'Unset');
                    emb.addField('Bank', '🔰100000')
                    emb.addField('Belongings', 'None')
                    data.characters.push({
                        id: message.author.id,
                        character: {
                            name: 'Unset',
                            hairColor: 'Unset',
                            eyeColor: 'Unset',
                            skinColor: 'Unset',
                            aboutMe: 'Unset'
                        },
                        bank: 100000,
                        belongings: [],
                        job: {
                            desc: 'None',
                            salary: 0
                        },
                        education: 'None',
                        location: cities[Math.floor(Math.random()*cities.length)]
                    })
                    fs.writeFile('./bot/ranks.json', JSON.stringify(data), 'utf-8', function(){
                        log(2)
                    })
                }
                message.channel.send({embed: emb})
                    .catch((e) => {
                        message.channel.send('```' + e + '```')
                    })
            })
        }
    },
    {
        name: 'charset',
        nsfw: false,
        func: (message, args) => {
            const keys = [
                'name',
                'hairColor',
                'skinColor',
                'eyeColor',
                'aboutMe'
            ]
            if(keys.includes(args[0])){
                fs.readFile('./bot/ranks.json', 'utf-8', function(err, data) {
                    data = JSON.parse(data);
                    data.characters.sort(function(a, b) {
                        return a.id*1 - b.id*1;
                    });
                    var personalData = null;
                    for(var i = 0; i < data.characters.length; i++){
                        if(data.characters[i].id === message.author.id){
                            personalData = data.characters[i];
                            break;
                        }
                    }
                    if(personalData !== null){
                        data.characters[i].character[args[0]] = args[1][0].toUpperCase() + (args[0] === 'aboutMe' ? args[1].substr(1, 250) : args[1].substr(1, 30));
                        fs.writeFile('./bot/ranks.json', JSON.stringify(data), 'utf-8', function(){
                            log(2)
                            var errorEmbed = embed(message.author);
                            errorEmbed.setTitle('Memory Written.');
                            errorEmbed.setDescription('Your character has been changed!');
                            errorEmbed.setColor("#28ffa9");
                            message.channel.send({embed: errorEmbed});
                        })
                    }else{
                        var errorEmbed = embed(message.author);
                        errorEmbed.setTitle('Invalid Character');
                        errorEmbed.setDescription('You don\'t have a character! Make one with s+game.');
                        errorEmbed.addField('Valid Keys', keys.join(", "))
                        errorEmbed.setColor("#ff0000");
                        message.channel.send({embed: errorEmbed});
                        log(3, 'Invalid Character')
                    }
                })
            }else{
                var errorEmbed = embed(message.author);
                errorEmbed.setTitle('Invalid Key');
                errorEmbed.setDescription('Please use a valid key.');
                errorEmbed.addField('Valid Keys', keys.join(", "))
                errorEmbed.setColor("#ff0000");
                message.channel.send({embed: errorEmbed});
                log(3, 'Invalid Key')
            }
        }
    },
    {
        name: 'jobs',
        nsfw: false,
        func: (message, args) => {
            fs.readFile('./bot/ranks.json', 'utf-8', function(err, data) {
                data = JSON.parse(data);
                var personalData = null;
                for(var i = 0; i < data.characters.length; i++){
                    if(data.characters[i].id === message.author.id){
                        personalData = data.characters[i];
                        break;
                    }
                }
                if(personalData !== null){
                    var thisCitysJobs = [];
                    for(var i = 0; i < data.jobs.length; i++){
                        if(data.jobs[i].city === personalData.location){
                            thisCitysJobs.push(data.jobs[i])
                        }
                    }
                    var smallSelection = thisCitysJobs.slice(0, 9)
                    var emb = embed(message.author);
                    emb.setTitle('Jobs');
                    emb.setColor('#9ab749')
                    var str = "";
                    for(var i = 0; i < smallSelection.length; i++){
                        str += "`" + i + " | " + smallSelection[i].desc + (" ".repeat(20)).substr(0, 20-smallSelection[i].desc.length) + " | 🔰" + smallSelection[i].salary + (" ".repeat(7)).substr(0, 7-smallSelection[i].salary.toString().length) + "|`\n"
                    }
                    emb.setDescription(str.length === 0 ? "None" : str);
                    emb.addField('Options', 'Type `apply <num>` to apply for a job with the id "num" and `global` to see global jobs. Type anything else to cancel out of the menu.')
                    message.channel.send({embed: emb})
                        .then(() => {
                            message.channel.awaitMessages(m => m.author.id === message.author.id, {max: 1, time: 60000, errors: ['time']})
                                .then(collected => {
                                    switch(collected.array()[0].content.substr(0, 6)){
                                        case 'apply ':
                                            var job = collected.array()[0].content[6]*1;
                                            if(!isNaN(job)){
                                                var emb = embed(message.author);
                                                emb.setTitle('Job Application');
                                                emb.setDescription('You have successfully applied for **' + smallSelection[job].desc + '**!');
                                                emb.setColor('#0065ff')
                                                if(Math.random() < 0.5){
                                                    emb.addField('Status', 'Accepted');
                                                    data.characters[data.characters.indexOf(personalData)].job = smallSelection[job];
                                                }else{
                                                    emb.addField('Status', 'Denied');
                                                }
                                                data.jobs.splice(data.jobs.indexOf(smallSelection[job]), 1);
                                                fs.writeFile('./bot/ranks.json', JSON.stringify(data), 'utf-8', function(){
                                                    log(2)
                                                    message.channel.send({embed: emb});
                                                })
                                            }
                                            break;
                                        case 'global':
                                            var offset = 0;
                                            var inside = function(){
                                                var emb = embed(message.author);
                                                emb.setTitle('Jobs (' + (offset+1) + "-" + (offset+15 > data.jobs.length ? data.jobs.length : offset + 15) + " of " + data.jobs.length + ")");
                                                emb.setColor('#ff9000')
                                                var str = "";
                                                var slice = data.jobs.slice(offset, offset+15);
                                                for(var i = 0; i < slice.length; i++){
                                                    str += "`" + (i+1+offset) + (" ".repeat(3)).substr(0, 3-(i+1+offset).toString().length) + " | " + slice[i].desc + (" ".repeat(28)).substr(0, 28-slice[i].desc.length) + " | 🔰" + slice[i].salary + (" ".repeat(6)).substr(0, 6-slice[i].salary.toString().length) + " | " + slice[i].city + (" ".repeat(12)).substr(0, 12-slice[i].city.length) + "|`\n"
                                                }
                                                emb.setDescription(str);
                                                emb.addField('Info', 'In order to apply for a global job, you must first travel to the city by plane. Ticket prices not included in salary.\nThese are only the first 15 jobs (for reasons of space). Press `+` to see the next 15 and `-` to see the last 15. Press anything else to exit the menu.')
                                                emb.addField('Current Location', personalData.location)
                                                message.channel.send({embed: emb})
                                                    .then(() => {
                                                        message.channel.awaitMessages(m => m.author.id === message.author.id, {max: 1, time: 60000, errors: ['time']})
                                                            .then(collected => {
                                                                switch(collected.array()[0].content){
                                                                    case '+':
                                                                        offset += 15;
                                                                        if(offset < data.jobs.length){
                                                                            inside();
                                                                        }
                                                                    break;
                                                                    case '-':
                                                                        offset -= 15;
                                                                        if(offset >= 0){
                                                                            inside();
                                                                        }
                                                                }
                                                            })
                                                    })
                                            };
                                            inside();
                                        break;
                                        default:
                                            var errorEmbed = embed(message.author);
                                            errorEmbed.setTitle('Exited Menu');
                                            errorEmbed.setColor("#ff0000");
                                            message.channel.send({embed: errorEmbed});
                                    }
                                })
                        })
                }else{
                    var errorEmbed = embed(message.author);
                    errorEmbed.setTitle('Invalid Character');
                    errorEmbed.setDescription('You don\'t have a character! Make one with s+game.');
                    errorEmbed.setColor("#ff0000");
                    message.channel.send({embed: errorEmbed});
                    log(3, 'Invalid Character')
                }
            })
        }
    },
    {
        name: 'flights',
        nsfw: false,
        func: (message, args) => {
            fs.readFile('./bot/ranks.json', 'utf-8', function(err, data) {
                data = JSON.parse(data);
                var personalData = null;
                for(var i = 0; i < data.characters.length; i++){
                    if(data.characters[i].id === message.author.id){
                        personalData = data.characters[i];
                        break;
                    }
                }
                if(personalData !== null){
                    var thisCitysFlights = [];
                    for(var i = 0; i < data.flights.length; i++){
                        if(data.flights[i].from === personalData.location){
                            thisCitysFlights.push(data.flights[i])
                        }
                    }
                    var smallSelection = thisCitysFlights.slice(0, 9)
                    var emb = embed(message.author);
                    emb.setTitle('Flights');
                    emb.setColor('#9ab749')
                    var str = "";
                    for(var i = 0; i < smallSelection.length; i++){
                        str += "`" + i + " | to " + smallSelection[i].to + (" ".repeat(20)).substr(0, 20-smallSelection[i].to.length) + " | 🔰" + smallSelection[i].price + (" ".repeat(7)).substr(0, 7-smallSelection[i].price.toString().length) + "|`\n"
                    }
                    emb.setDescription(str.length === 0 ? "None" : str);
                    emb.addField('Options', 'Type `take <num>` to take the flight with the id "num" and `global` to see global flights. Type anything else to cancel out of the menu.')
                    message.channel.send({embed: emb})
                        .then(() => {
                            message.channel.awaitMessages(m => m.author.id === message.author.id, {max: 1, time: 60000, errors: ['time']})
                                .then(collected => {
                                    switch(collected.array()[0].content.substr(0, 5)){
                                        case 'take ':
                                            var flight = collected.array()[0].content[5]*1;
                                            if(!isNaN(flight)){
                                                var emb = embed(message.author);
                                                emb.setTitle('You are now on a flight!');
                                                emb.setDescription('You are flying from **' + smallSelection[flight].from + '** to **' + smallSelection[flight].to + '**!');
                                                emb.setColor('#0065ff')
                                                data.flights.splice(data.flights.indexOf(smallSelection[flight]), 1);
                                                data.characters[data.characters.indexOf(personalData)].location = smallSelection[flight].to;
                                                fs.writeFile('./bot/ranks.json', JSON.stringify(data), 'utf-8', function(){
                                                    log(2)
                                                    message.channel.send({embed: emb});
                                                })
                                            }
                                            break;
                                        case 'globa':
                                            var offset = 0;
                                            var inside = function(){
                                                var emb = embed(message.author);
                                                emb.setTitle('Flights (' + (offset+1) + "-" + (offset+15 > data.flights.length ? data.flights.length : offset + 15) + " of " + data.flights.length + ")");
                                                emb.setColor('#ff9000')
                                                var str = "";
                                                var slice = data.flights.slice(offset, offset+15);
                                                for(var i = 0; i < slice.length; i++){
                                                    str += "`" + (i+1+offset) + (" ".repeat(3)).substr(0, 3-(i+1+offset).toString().length) + " | " + slice[i].from + (" ".repeat(11)).substr(0, 11-slice[i].from.length) + " to " + slice[i].to + (" ".repeat(11)).substr(0, 11-slice[i].to.length) +  " | 🔰" + slice[i].price + (" ".repeat(6)).substr(0, 6-slice[i].price.toString().length) + " | " + (Math.floor(slice[i].dist*30)) + ' kliks '+ (" ".repeat(13)).substr(0, 13-((Math.floor(slice[i].dist*30) + ' kliks ').length)) + "|`\n"
                                                }
                                                emb.setDescription(str);
                                                emb.addField('Info', 'Press `+` to see the next 15 and `-` to see the last 15. Press anything else to exit the menu.')
                                                emb.addField('Current Location', personalData.location)
                                                message.channel.send({embed: emb})
                                                    .then(() => {
                                                        message.channel.awaitMessages(m => m.author.id === message.author.id, {max: 1, time: 60000, errors: ['time']})
                                                            .then(collected => {
                                                                switch(collected.array()[0].content){
                                                                    case '+':
                                                                        offset += 15;
                                                                        if(offset < data.flights.length){
                                                                            inside();
                                                                        }
                                                                    break;
                                                                    case '-':
                                                                        offset -= 15;
                                                                        if(offset >= 0){
                                                                            inside();
                                                                        }
                                                                }
                                                            })
                                                    })
                                            };
                                            inside();
                                        break;
                                        default:
                                            var errorEmbed = embed(message.author);
                                            errorEmbed.setTitle('Exited Menu');
                                            errorEmbed.setColor("#ff0000");
                                            message.channel.send({embed: errorEmbed});
                                    }
                                })
                        })
                }else{
                    var errorEmbed = embed(message.author);
                    errorEmbed.setTitle('Invalid Character');
                    errorEmbed.setDescription('You don\'t have a character! Make one with s+game.');
                    errorEmbed.setColor("#ff0000");
                    message.channel.send({embed: errorEmbed});
                    log(3, 'Invalid Character')
                }
            })
        }
    }
    /*
    {
        name: 'collect',
        nsfw: false,
        func: (message, args) => {
            fs.readFile('./bot/ranks.json', 'utf-8', function(err, data) {
                data = JSON.parse(data);
                var personalData = null;
                for(var i = 0; i < data.characters.length; i++){
                    if(data.characters[i].id === message.author.id){
                        personalData = data.characters[i];
                        break;
                    }
                }
                if(personalData !== null){

        }
    }*/

];
commands.push({
    name: 'help',
    nsfw: false,
    func: (message, args) => {
        var str = ""
        for(var i = 0; i < commands.length; i++){
            if(message.channel.nsfw || commands[i].nsfw === false){
                str += "`s+" + commands[i].name + "`,";
            }
        }
        str = str.substr(0, str.length-1);

        var help = embed(message.author);
        help.setTitle('Command List');
        help.setDescription(str);
        help.setColor("#9054a3");
        message.channel.send({embed: help});
    }
})

// Main
try{
  // Events
  var token = ls.getItem('token')
  if(token){
    Scott.login(token)
      .catch((e) => {
        disconnected = true;
        setInterval(function(){
          win.webContents.send("disconnected", "disconnected")
          clearInterval(this)
        }, 5000)
      })
  }else{
    throw 'No token! Please set a token.';
  }
  app.on('ready', ()=>{
    openWindow();
    ready = true;
  })
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
  app.on('activate', () => {
    if (win === null) {
      openWindow()
    }
  })
  app.on('browser-window-created', function (event, win) {
    win.webContents.on('context-menu', function (e, params) {
      cmenu.popup(win, params.x, params.y)
    })
  })
  Scott.on('message', (message) => {
      messageCounter++;
      app.setBadgeCount(messageCounter)
      if(!message.author.bot){

          var removingBadWord = false;

          // commands
          for(var i = 0; i < commands.length; i++){
              var cap = prefix + commands[i].name + ' ';
              if((message.content.includes(" ") ? (message.content.substr(0, cap.length-1)) : (message.content.substr(0, cap.length))) + " " === cap){
                  var hasPermissions = 0;
                  var guildMember = Scott.guilds.get(message.guild.id).members.get(message.author.id);
                  if(commands[i].needsperms){
                      for(var j = 0; j < commands[i].needsperms.length; j++){
                          if(guildMember.permissions.has(commands[i].needsperms[j])){
                              hasPermissions++;
                          }
                      }
                  }
                  if(!commands[i].needsperms || hasPermissions === commands[i].needsperms.length){
                      log(1)
                      var args = message.content.substr(cap.length, message.content.length - cap.length).split(",");
                      for(var j = 0; j < args.length; j++){
                          args[j] = args[j].trim();
                          if(args[j] === ""){
                              args.splice(j, 1)
                          }
                      }
                      if(commands[i].nsfw){
                          if(message.channel.nsfw){
                              commands[i].func(message, args);
                              if(commands[i].name === 'removebannedwords') removingBadWord = true;
                              log(4)
                          }else{
                              var errorEmbed = embed(message.author);
                              errorEmbed.setTitle('NSFW-Only Command');
                              errorEmbed.setDescription('This command is only allowed in NSFW channels. Please do not use NSFW commands in public channels.');
                              errorEmbed.setColor("#ff0000");
                              message.channel.send({embed: errorEmbed});
                              log(3, 'NSFW')
                          }
                      }else{
                          commands[i].func(message, args);
                          log(5)
                      }
                  }else{
                      var errorEmbed = embed(message.author);
                      errorEmbed.setTitle('Restricted Command');
                      errorEmbed.setDescription('You need more permissions to run this command.');
                      errorEmbed.setColor("#ff0000");
                      message.channel.send({embed: errorEmbed});
                      log(3, 'Permissions')
                  }
                  break;
              }
          }

          // censorship
          if(bw && bw[message.guild.id] && !removingBadWord){
              var ts = ' ' + message.content.toLowerCase() + ' ';
              ts = ts.replace(/\W/gim, ' ');
              for(var i = 0; i < bw[message.guild.id].length; i++){
                  if(ts.includes(' ' + bw[message.guild.id][i] + ' ')){
                      log(6)
                      message.reply(badWordResponses[Math.floor(Math.random()*badWordResponses.length)])
                          .then((sentMessage) => {
                              sentMessage.delete(3000);
                              message.delete()
                                  .catch(console.error);
                          })
                  }
              }
          }

          message.channel.stopTyping(true);
      }
  });
  Scott.on('ready', () => {

      //bot stuff
      log('')
      Scott.user.setGame(games[Math.floor(Math.random()*games.length)]);
      Scott.user.setAvatar('bot/cool_and_good.png');

      //game of life stuff
      setInterval(function(){
          if(Math.random() < 0.1){
              fs.readFile('./bot/ranks.json', 'utf-8', function(err, data) {
                  data = JSON.parse(data);
                  var newJob = {
                      city: cities[Math.floor(Math.random()*cities.length)],
                      desc: jobDescs[Math.floor(Math.random()*jobDescs.length)],
                      salary: Math.round(Math.random()*30 + 3)
                  };
                  for(var j = 0; j < 5; j++){
                      var newFlight = {
                          from: cities[Math.floor(Math.random()*cities.length)],
                          to: cities[Math.floor(Math.random()*cities.length)],
                          airline: airlines[Math.floor(Math.random()*airlines.length)],
                          price: Math.round(Math.random()*10 + 3),
                          dist: null
                      };
                      newFlight.dist = Math.sqrt(((loc[newFlight.from][0] - loc[newFlight.to][0]) * (loc[newFlight.from][0] - loc[newFlight.to][0])) + ((loc[newFlight.from][1] - loc[newFlight.to][1]) * (loc[newFlight.from][1] - loc[newFlight.to][1])));
                      newFlight.price = Math.round(newFlight.price * newFlight.dist);
                      if(newFlight.from !== newFlight.to){
                          data.flights.push(newFlight);
                      }
                  }
                  data.jobs.push(newJob);
                  fs.writeFile('./bot/ranks.json', JSON.stringify(data), 'utf-8', function(){
                      log(2)
                  });
              })
          }
      }, 5000)
  });

  // Electron IPC
  ipcMain.on('evaluate-code', (event, arg) => {
    console.log('lol', ' | ', arg)
    try{
      eval(arg);
    }catch(e){
      event.sender.send('eval-error', JSON.stringify(e))
    }
  })
  ipcMain.on('statistics-send', (event, arg) => {
    if(Scott.guilds === undefined || Scott.guilds.array().length > 0){
      event.sender.send('statistics-response', JSON.stringify({
        guilds: Scott.guilds.array().length,
        users: Scott.users.array().length,
        uptimestart: new Date()
      }))
      var userList = Scott.users.array();
      var strUserList = [];
      for(var i = 0; i < userList.length; i++){
        strUserList.push({
          username: userList[i].username,
          id: userList[i].id,
          discriminator: userList[i].discriminator
        })
      }
      var guildList = Scott.guilds.array();
      var strGuildList = [];
      for(var i = 0; i < guildList.length; i++){
        strGuildList.push({
          name: guildList[i].name,
          id: guildList[i].id
        })
      }
      event.sender.send('client-users-stringified', JSON.stringify(strUserList))
      event.sender.send('client-guilds-stringified', JSON.stringify(strGuildList))
    }else{
      event.sender.send('statistics-response', JSON.stringify({err: 'disconnected'}))
    }
  })
  ipcMain.on('user-block', (event, arg) => {
    const options = {
      type: 'info',
      title: 'User Block',
      message: "Are you sure that you want to block this user? This will make them unable to interact with the bot.",
      buttons: ['Yes', 'No', 'More info...']
    }
    dialog.showMessageBox(options, function (index) {
      event.sender.send('user-block-selection', {id: arg.id, node: arg.node, type: arg.type, index: index})
    })
  })
  ipcMain.on('user-block-confirmed', (event, id) => {
    fs.readFile('./bot/backend.json', 'utf-8', function(err, data) {
      data = JSON.parse(data)
      data.blockedIDs.push(id);
      fs.writeFile('./bot/backend.json', JSON.stringify(data))
    })
  })
} catch (error) {
  log(3, error);
}
