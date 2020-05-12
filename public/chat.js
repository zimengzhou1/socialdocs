$(function() {
  const MAX_MESSAGES = 3;
  const DISPLAY_TIME = 15000;
  const MAX_CHARS = "40";
  var FADE_TIME = 150;

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

  // Log a message
  const log = (message, options) => {
    var $el = $('<li>').addClass('log').attr("id", message).text(message);
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
  function maxMessages(list) {
    if (list.length > MAX_MESSAGES) {
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
        socket.emit('new_message', {inputToAdd : value, id: iden})
      })
    }

    isPreviousEmpty(sentmsgs);
    maxMessages(sentmsgs);   
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
    addMessageElement($('<li>').addClass('log').text(message), {prepend: true});
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

    maxMessages(recievedmsgs);
   })
   
   //Listening for new_message (typing)
   socket.on("new_message", (data) => {
    clearTimeout(rtimeout);
    $("#" + data.id).text(data.inputToAdd);
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