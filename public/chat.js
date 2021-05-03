$(function() {
    const MAX_MESSAGES_SENT = 3;
    //total displayed messages
    const MAX_MESSAGES_RECV = 60;
    //const DISPLAY_TIME = 15000;
    const TYPING_TIMER_LENGTH = 5000;
    const MAX_CHARS = "60";
    const FADE_TIME = 400;
    const COLORS = [
        '#00008B', '#006400', '#8B0000', '#000000',
        '#8B008B', '#2F4F4F', '#B22222', '#228B22',
        '#FF4500', '#2E8B57', '#4B0082', '#FFD700'
    ];

    const $window = $(window);
    const $messages = $('.messages');
    const $usernameInput = $('.usernameInput');
    const $loginPage = $('.login.page');
    const $chatPage = $('.chat.page');

    // Prompt for setting a username
    let username;
    let usernames = [];
    let connected = false;
    // Time and ID of last key pressed for unique IDs
    let typingTimes = [];
    let $currentInput = $usernameInput.focus();

    // Make connection
    let socket = io();//.connect('http://localhost:3000');
    let sentmsgs = [];
    let recievedmsgs = [];

    $("body").niceScroll({cursorcolor:"grey"});
    $(".messages").niceScroll({cursorcolor:"grey"});

    // ---------------------- EMIT MESSAGES ----------------------

    document.body.addEventListener('click', event => {
        if (connected && distance == 0) {
            const tag = createNewtag();
            
            socket.emit('new_position', {left : event.pageX, top : event.pageY, id : tag.id, username: username});
            
            // User is typing a message
            $("#" + tag.id).on('keyup keydown', function() {
                this.style.width = ((this.value.length + 1) * 8) + 'px';
                updateTyping(tag.id, "emit");
                socket.emit('new_message', {inputToAdd : tag.value, id: tag.id, username: username})
            })
            isPreviousEmpty(sentmsgs);
            maxMessages(sentmsgs, MAX_MESSAGES_SENT);
        }     
    })

    // Sets callback for last time key pressed
    const updateTyping = (id, origin) => {
        if (connected) {
            if (typingTimes.some(e => e.id === id)) {
                const index = typingTimes.findIndex(e => e.id === id);
                typingTimes[index] = {time: (new Date()).getTime(), id: id}
            } else {
                typingTimes.push({time: (new Date()).getTime(), id: id});
            }

            setTimeout(() => {
                var typingTimer = (new Date()).getTime();
                for (i=0; i < typingTimes.length; i++) {
                    if (sentmsgs.filter(message => message.ID === typingTimes[i].id)) {
                        var timeDiff = typingTimer - typingTimes[i].time;
                        if (timeDiff >= TYPING_TIMER_LENGTH) {
                            if (origin == "emit") {
                                removeElem(typingTimes[i].id);
                            } else if (origin == "listen") {
                                removeTag(typingTimes[i].id);
                            }
                            typingTimes = typingTimes.filter(e => e.id !== typingTimes[i].id);
                        }
                    }
                }
            }, TYPING_TIMER_LENGTH);
        }
    }     

    // ---------------------- LISTEN TO MESSAGES ----------------------

    socket.on('login', () => {
        connected = true;
    });

    socket.on('user_joined', (data) => {
        for (i = 0; i < data.usernames.length; i++) {
            if (!(usernames.includes(data.usernames[i]))) {
                usernames.push(data.usernames[i]);
                log(data.usernames[i]);
            }
        }
    });

     //Listening for new_position
    socket.on("new_position", (data) => {
        recievedmsgs.push({ID: data.id, username: data.username});
        var display = $("<p>|</p>").attr('id', data.id)
        
        $("body").append(
            $(display).css({
                position:'absolute',
                left: data.left,
                top: data.top
            }))

        // If previous element is empty, remove it
        if (recievedmsgs.length > 1) {
            var value = document.getElementById(recievedmsgs[recievedmsgs.length - 2]['ID']).textContent;
            if (value === "|") {
                removeElem(recievedmsgs[recievedmsgs.length - 2]['ID']);
            }
        }

        maxMessages(recievedmsgs, MAX_MESSAGES_RECV);
     })
     
     //Listening for new_message (typing)
     socket.on("new_message", (data) => {
        $("#" + data.id).text(data.inputToAdd).css('color', getUsernameColor(data.username));
        updateTyping(data.id, "listen");
     })

    socket.on('remove_elem', (data) => {
        removeElem(data.idValue);
    })

    socket.on('user_left', (data) => {
        $("#" + data.username).remove()
        usernames = usernames.filter(e => e !== data.username);
    });

    //Dragging the page
    let clicked = false;
    let yPos, xPos;
    let distance;

    $(document).on ({ 
        'mousemove': function(e) {
            clicked && updateScrollPos(e);
        },
        'mousedown': function(e) {
            distance = 0;    
            clicked = true;
            yPos = e.pageY;
            xPos = e.pageX;
        },
        'mouseup': function() {
            clicked = false;
            $('html').css('cursor', 'auto');
        }
    })
    
    function updateScrollPos (e) {
        distance = Math.abs((yPos - e.pageY)) + Math.abs((xPos - e.pageX))
        $(window).scrollTop($(window).scrollTop() + (yPos - e.pageY));
        $(window).scrollLeft($(window).scrollLeft() + (xPos - e.pageX));
    }

    // ---------------------- SETUP FROM USERNAME PAGE ----------------------

    socket.emit('get usernames');
    const setUsername = () => {
        var usernameTemp = cleanInput($usernameInput.val().trim());
        if (usernames.includes(usernameTemp)) {
            document.getElementById("usernameTaken").style.display = "block";
            return;
        } else if (/\s/.test(usernameTemp)) {
            document.getElementById("noSpace").style.display = "block";
        } else {
            username = usernameTemp;
        }

        if (username) {
            $loginPage.fadeOut();
            $chatPage.show();
            $loginPage.off();

            document.getElementById('intromsg').scrollIntoView({ inline: 'center', block: 'center' });
            socket.emit('add_user', username);
        }
    }

    $window.keydown(event => {
        // Auto-focus the current input when a key is typed
        if (!(event.ctrlKey || event.metaKey || event.altKey)) {
            $currentInput.focus();
        }
        // Enter key pressed
        if (event.which === 13 && !username) {
            document.getElementById("usernameTaken").style.display = "none";
            document.getElementById("noSpace").style.display = "none";
            setUsername();
        }
    });

    // ---------------------- HELPER FUNCTIONS ----------------------

    // Create message input box
    function createNewtag() {
        const tag = document.createElement('input');
        tag.id = uniqId();
        tag.setAttribute("maxlength", MAX_CHARS)

        sentmsgs.push({ID: tag.id, username: username});
        tag.style.cssText = `
            position: absolute;
            top: ${event.pageY}px;
            left: ${event.pageX}px;
            width: 80px;
            background: transparent;
            border: none;
            outline: none;
            font-family: 'Nunito', sans-serif;
        `
        tag.style.color = getUsernameColor(username);

        document.body.append(tag)
        tag.focus()
        
        return tag
    }

    // Generates a unique ID for new elements
    function uniqId() {
        return Math.round(new Date().getTime() + (Math.random() * 100));
    }

    // Gets the color of a username through hash function
    const getUsernameColor = (username) => {
        let hash = 7;
        for (var i = 0; i < username.length; i++) {
                hash = username.charCodeAt(i) + (hash << 5) - hash;
        }
        // Calculate color
        let index = Math.abs(hash % COLORS.length);
        return COLORS[index];
    }

    // Add username to username list
    const log = (message) => {
        var $el = $('<li>').addClass('log').attr("id", message).text(message).css({
            color: getUsernameColor(message),
        });
        $messages.append($el);
    }

    // Callback to remove local message
    function removeTag(id) {
        if (sentmsgs.filter(message => message.ID === id)) {
            $("#" + id).fadeOut(FADE_TIME, function() { $(this).remove(); });
            sentmsgs = sentmsgs.filter(e => e.ID !== id);
        }
    }

    // Callback to remove recieved message
    function removeElem(id) {
        if (recievedmsgs.filter(message => message.ID === id)) {
            $("#" + id).fadeOut(FADE_TIME, function() { $(this).remove(); });
            $("#circle" + id).fadeOut(FADE_TIME, function() { $(this).remove(); });
            recievedmsgs = recievedmsgs.filter(e => e.ID !== id);
        }
    }

    // If previous element is empty, remove it
    function isPreviousEmpty(list) {
        if (list.length > 1) {
            var value = document.getElementById(list[list.length - 2]['ID']).value;
            if (value === "") {
                removeTag(list[list.length - 2]['ID']);
            }
        }
    }

    // Maintains maximum number of messages shown per user
    function maxMessages(list, maxNum) {
        if (list.length > maxNum) {
            socket.emit('remove_elem', {idValue : list[0]['ID']});
            $("#" + list[0]['ID']).fadeOut(FADE_TIME, function() { $(this).remove(); });
            list.shift();
        }
    }

    // Prevents input from having injected markup
    const cleanInput = (input) => {
        return $('<div/>').text(input).html();
    }
     
});