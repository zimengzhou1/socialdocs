$(function() {
  const MAX_MESSAGES_SENT = 3;
  const MAX_MESSAGES_RECV = 6;
  const DISPLAY_TIME = 15000;
  const MAX_CHARS = "40";
  var FADE_TIME = 150;
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  var $window = $(window);
  var $messages = $('.messages');
  var $usernameInput = $('.usernameInput'); // Input for username
  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page

  // Prompt for setting a username
  var username;
  var usernames = [];
  var connected = false;
  var $currentInput = $usernameInput.focus();

  // Make connection
  var socket = io();//.connect('http://localhost:3000');
  var sentmsgs = [];
  var recievedmsgs = [];
  //var stimeout;
  //var rtimeout;



  // ------------------------ SETUP FROM USERNAME PAGE ------------------------------------

  const setUsername = () => {
    username = cleanInput($usernameInput.val().trim());

    // If the username is valid, string is true?!
    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');

      // Tell the server your username
      socket.emit('add user', username);
    }
  }

  // Prevents input from having injected markup
  const cleanInput = (input) => {
    return $('<div/>').text(input).html();
  }

  $window.keydown(event => {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
      } else {
        setUsername();
      }
    }
  });


  // ---------------------- HELPER FUNCTIONS ----------------------------------------------

  // Generates a unique ID for new elements
  function uniqId() {
    return Math.round(new Date().getTime() + (Math.random() * 100));
  }

  // Gets the color of a username through our hash function
  const getUsernameColor = (username) => {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // Log a message
  const log = (message, options) => {
    var $el = $('<li>').addClass('log').attr("id", message).text(message).css('color', getUsernameColor(message));
    addMessageElement($el, options);
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  const addMessageElement = (el, options) => {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Callback function that removes element
  function removeTag(id) {
    if (sentmsgs.includes(id)) {
      console.log("Removed bc empty.");
      document.getElementById(id).remove();
      sentmsgs = sentmsgs.filter(e => e !== id);
    } else {
      return;
    }
  }

  // If previous element is empty, remove it
  function isPreviousEmpty(list) {
    if (list.length > 1) {
      var value = document.getElementById(list[list.length - 2]).value;
      if (value === "") {
        console.log("Element is empty")
        removeTag(list[list.length - 2]);
      }
    }
  }

  // Maintains maximum number of messages shown per user
  function maxMessages(list, maxNum) {
    if (list.length > maxNum) {
      document.getElementById(list[0]).remove();
      list.shift();
    }
  }

    // ---------------------- EMITTED MESSAGES ---------------------------------------------

  document.body.addEventListener('click', event => {   
    const clicked = document.elementFromPoint(event.clientX, event.clientY)
    console.log(username + " created a new input.")
    
    if (clicked.matches('input')) {
      clicked.focus
    } else {
      const tag = document.createElement('input');
      tag.id = uniqId();
      //tag.setAttribute("maxlength", MAX_CHARS)
      /*
      setTimeout(() => {
        removeTag(tag.id);
      }, DISPLAY_TIME);
      */
      sentmsgs.push(tag.id);
      console.log(sentmsgs);

      tag.style.cssText = `
        position: absolute;
        top: ${event.clientY}px;
        left: ${event.clientX}px;
        width: 300px;
        background: transparent;
        border: none;
        outline: none;
        font-family: 'Noto Serif', serif;
      `
      tag.style.color = getUsernameColor(username);

      document.body.append(tag)
      tag.focus()
      socket.emit('new_position', {left : event.clientX, top : event.clientY, id : tag.id});
      
      
      // User is typing a message
      $("#" + tag.id).keyup(function() {
        //if (tag.id != sentmsgs[sentmsgs.length-2])
        clearTimeout(stimeout);
        console.log("Pressing")
        var value = tag.value;
        var iden = tag.id;
        var stimeout = setTimeout(() => {
          removeTag(tag.id);
        }, DISPLAY_TIME);
        socket.emit('new_message', {inputToAdd : value, id: iden, username: username})
      })
    }

    isPreviousEmpty(sentmsgs);
    maxMessages(sentmsgs, MAX_MESSAGES_SENT);   
  })

    /*
    document.body.addEventListener('keyup', () => {
      console.log(clicked.value);
    })
    */

   

  // ---------------------- LISTEN TO MESSAGES ---------------------------------------------

  // Log the login message
  socket.on('login', (data) => {
    connected = true;
    // Display the welcome message
    var message = "People Online:";
    var $li = $('<li>').addClass('log').text(message).css('font-weight', 'bold');
    addMessageElement($li, {prepend: true});
    /*
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
    */
  });

  // Callback function that removes element
  function removeElem(id) {
    if (recievedmsgs.includes(id)) {
      console.log("Removed bc empty.");
      document.getElementById(id).remove();
      recievedmsgs = recievedmsgs.filter(e => e !== id);
    } else {
      return;
    }
  }

   //Listening for new_position
   socket.on("new_position", (data) => {
     recievedmsgs.push(data.id);
      var display = $("<p>|</p>").attr("id", data.id)
      console.log('Current ID is: ' + display.attr('id'));
      console.log(recievedmsgs);
      
      $("body").append(
         $(display).css({
            position:'absolute',
            left: data.left,
            top: data.top
         }))
    /*
    setTimeout(() => {
      removeElem(data.id);
    }, DISPLAY_TIME);
    */

    // If previous element is empty, remove it
    if (recievedmsgs.length > 1) {
      var value = document.getElementById(recievedmsgs[recievedmsgs.length - 2]).textContent;
      if (value === "|") {
        removeElem(recievedmsgs[recievedmsgs.length - 2]);
      }
    }

    maxMessages(recievedmsgs, MAX_MESSAGES_RECV);
   })
   
   //Listening for new_message (typing)
   socket.on("new_message", (data) => {
    console.log(data.username);
    clearTimeout(rtimeout);
    $("#" + data.id).text(data.inputToAdd).css('color', getUsernameColor(data.username));
    var rtimeout = setTimeout(() => {
      removeElem(data.id);
    }, DISPLAY_TIME);
   })

  socket.on('user joined', (data) => {
    for (i = 0; i < data.usernames.length; i++) {
      if (!(usernames.indexOf(data.usernames[i]) >= 0)) {
        usernames.push(data.usernames[i]);
        log(data.usernames[i]);
      }
      
    }
    //addParticipantsMessage(data);
  });

  socket.on('user left', (data) => {
    $("#" + data.username).remove()
    usernames = usernames.filter(e => e !== data.username);
    //log(data.username + ' left');
    //addParticipantsMessage(data);
    //removeChatTyping(data);
  });
   
});