$(function() {
  const MAX_MESSAGES_SENT = 3;
  //total displayed messages
  const MAX_MESSAGES_RECV = 30;
  //const DISPLAY_TIME = 15000;
  const TYPING_TIMER_LENGTH = 5000;
  //const MAX_CHARS = "40";
  var FADE_TIME = 400;
  var COLORS = [
    '#00008B', '#006400', '#8B0000', '#000000',
    '#8B008B', '#2F4F4F', '#B22222', '#228B22',
    '#FF4500', '#2E8B57', '#4B0082', '#FFD700'
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
  var typing = false;
  // Time and ID of last key pressed for unique IDs
  var typingTimes = [];
  var $currentInput = $usernameInput.focus();

  // Make connection
  var socket = io();//.connect('http://localhost:3000');
  var sentmsgs = [];
  var recievedmsgs = [];
  //var stimeout;
  //var rtimeout;

  $("body").niceScroll({cursorcolor:"grey"});
  // Scrolling for people online
  $(".messages").niceScroll({cursorcolor:"grey"});


  // ------------------------ SETUP FROM USERNAME PAGE ------------------------------------

  socket.emit('get usernames');
  const setUsername = () => {
    var usernameTemp = cleanInput($usernameInput.val().trim());
    if (usernames.includes(usernameTemp)) {
      document.getElementById("usernameTaken").style.display = "block";
      return;
    }else if (/\s/.test(usernameTemp)) {
      document.getElementById("noSpace").style.display = "block";
    }else {
      username = usernameTemp;
    }

    // If the username is valid, string is true?!
    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off();

      document.getElementById('intromsg').scrollIntoView({ inline: 'center', block: 'center' });
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
        return;
      } else {
        document.getElementById("usernameTaken").style.display = "none";
        document.getElementById("noSpace").style.display = "none";
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
    if (sentmsgs.filter(message => message.ID === id)) {
      console.log("Remove function called.");
      //document.getElementById(id).remove();
      $("#" + id).fadeOut(FADE_TIME, function() { $(this).remove(); });
      sentmsgs = sentmsgs.filter(e => e.ID !== id);
    } else {
      return;
    }
  }

  // If previous element is empty, remove it
  function isPreviousEmpty(list) {
    if (list.length > 1) {
      var value = document.getElementById(list[list.length - 2]['ID']).value;
      if (value === "") {
        console.log("Element is empty")
        removeTag(list[list.length - 2]['ID']);
      }
    }
  }

  // Maintains maximum number of messages shown per user
  function maxMessages(list, maxNum) {
    if (list.length > maxNum) {
      socket.emit('remove elem', {idValue : list[0]['ID']});
      //document.getElementById(list[0]).remove();
      $("#" + list[0]['ID']).fadeOut(FADE_TIME, function() { $(this).remove(); });
      list.shift();
    }
  }

  function isElementInViewport (el) {
    // If using jquery
    if (typeof jQuery === "function" && el instanceof jQuery) {
      el = el[0];
    }

    var rect = el.getBoundingClientRect();

    return (
      rect.top >=0 &&
      rect.left >=0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  // Find intercept (relative to viewport)
  function findIntercept (coord) {
    let a = {x: 0, y: 0};
    let b = {x: 0, y: window.innerHeight};
    let c = {x: window.innerWidth, y: 0};
    let d = {x: window.innerWidth, y: window.innerHeight};
    let mid = {x: window.innerWidth/2, y: window.innerHeight/2};

    if (!isLeft(d,a,coord) && isLeft(b,c,coord)){
      console.log("down");
      return {x: ((window.innerHeight-mid.y)*((coord.x-mid.x)/(coord.y-mid.y)) + mid.x) - 15, y: window.innerHeight - 15};
    }else if(isLeft(d,a,coord) && !isLeft(b,c,coord)){
      console.log("up");
      return {x: ((-mid.y)*((coord.x-mid.x)/(coord.y-mid.y)) + mid.x), y: 0};
    }else if(isLeft(d,a,coord) && isLeft(b,c,coord)){
      console.log("right");
      return {x: window.innerWidth-15, y: (window.innerWidth-mid.x)*((coord.y-mid.y)/(coord.x-mid.x))+mid.y};
    }else if(!isLeft(d,a,coord) && !isLeft(b,c,coord)){
      console.log("left");
      return {x: 0, y: (-mid.x)*((coord.y-mid.y)/(coord.x-mid.x))+mid.y};
    }
  }
  // Cross product to check which side of line a point is
  function isLeft(a, b, c) {
    return ((b.x - a.x)*(c.y - a.y) - (b.y - a.y)*(c.x - a.x)) > 0;
  }

  // Draws circle to indicate positions of unseen messages
  function drawCircle(display, id, username) {
    // If new position is in viewport
    if (!isElementInViewport(display)) {
      $('#circle'+id).show();
      //console.log("THIS AIN'T IN THE VIEWPORT")
      // If using jquery
      if (typeof jQuery === "function" && display instanceof jQuery) {
        display = display[0];
      }

      var object = display.getBoundingClientRect();
      var coordinate = {x: object.left, y: object.top};
      var intercept = findIntercept(coordinate);
      //console.log(intercept.x + window.screenX + ", ", + intercept.y + window.screenY);
      $('#circle' + id).remove();
      var circle = $('<div></div>').attr('id', 'circle' + id);

      $(".chat.page").append($(circle).css({
        position: 'fixed',
        left: (intercept.x ),
        top: (intercept.y ),
        height: '10px',
        width: '10px',
        'background-color': getUsernameColor(username),
        'border-radius': '50%',
        'display': 'inline-block'
      }));  
    } else {
      // Hide it but only if not hidden - hide
      $('#circle'+id).hide();
    }
  }


    // ---------------------- EMITTED MESSAGES ---------------------------------------------

  document.body.addEventListener('click', event => {
    if (connected) {
      if (distance == 0) {
        //const clicked = document.elementFromPoint(event.pageX, event.pageY)
        console.log(username + " created a new input.")
        
        if (false) {//clicked.matches('input')
          clicked.focus
        } else {
          const tag = document.createElement('input');
          tag.id = uniqId();
          //tag.setAttribute("maxlength", MAX_CHARS)
  
          sentmsgs.push({ID: tag.id, username: username});
          console.log(sentmsgs);
  
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
          socket.emit('new_position', {left : event.pageX, top : event.pageY, id : tag.id, username: username});
          
          
          // User is typing a message
          $("#" + tag.id).keyup(function() {
            this.style.width = ((this.value.length + 1) * 8) + 'px'; // could make a function to fine tune input box
            var value = tag.value;
            var iden = tag.id;
  
            updateTyping(tag.id);
            socket.emit('new_message', {inputToAdd : value, id: iden, username: username})
          })
        }
  
        isPreviousEmpty(sentmsgs);
        maxMessages(sentmsgs, MAX_MESSAGES_SENT);  
      }
    }   
  })

    // Sets callback for last time key pressed
    const updateTyping = (id) => {
      if (connected) {
        if (typingTimes.some(e => e.id === id)) {
          const index = typingTimes.findIndex(e => e.id === id);
          typingTimes[index] = {time: (new Date()).getTime(), id: id}
        } else {
          typingTimes.push({time: (new Date()).getTime(), id: id});
        }
        //lastTypingTime = (new Date()).getTime();
        //console.log(typingTimes)
  
        setTimeout(() => {
          var typingTimer = (new Date()).getTime();
          for (i=0; i < typingTimes.length; i++) {
            if (sentmsgs.filter(message => message.ID === typingTimes[i].id)) {
              var timeDiff = typingTimer - typingTimes[i].time;
              if (timeDiff >= TYPING_TIMER_LENGTH) {
                console.log("Reached into timeout")
                socket.emit('kill message', {id: typingTimes[i].id});
                typingTimes = typingTimes.filter(e => e.id !== typingTimes[i].id);
              }
            }
          }
        }, TYPING_TIMER_LENGTH);
      }
    }

   

  // ---------------------- LISTEN TO MESSAGES ---------------------------------------------

  // Log the login message
  socket.on('login', (data) => {
    connected = true;
    // Display the welcome message
    /*
    var message = "People Online:";
    var $li = $('<li>').addClass('log').text(message).css('font-weight', 'bold');
    addMessageElement($li, {prepend: true});
    
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
    */
  });

  // Callback function that removes element
  function removeElem(id) {
    if (recievedmsgs.filter(message => message.ID === id)) {
      //console.log("Removed bc empty.");
      //document.getElementById(id).remove();
      $("#" + id).fadeOut(FADE_TIME, function() { $(this).remove(); });
      $("#circle" + id).fadeOut(FADE_TIME, function() { $(this).remove(); });
      recievedmsgs = recievedmsgs.filter(e => e.ID !== id);
    } else {
      return;
    }
  }

   //Listening for new_position
   socket.on("new_position", (data) => {
     recievedmsgs.push({ID: data.id, username: data.username});
      var display = $("<p>|</p>").attr('id', data.id)
      console.log('Current ID is: ' + display.attr('id'));
      console.log(recievedmsgs);
      
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
    console.log(data.username);
    //clearTimeout(rtimeout);
    $("#" + data.id).text(data.inputToAdd).css('color', getUsernameColor(data.username));
    
    drawCircle($("#" + data.id), data.id, data.username);
    /*
    var rtimeout = setTimeout(() => {
      removeElem(data.id);
    }, DISPLAY_TIME);
    */
    //updateTyping(data.id);
   })

   socket.on("kill message", (data) => {
     console.log("Message got removed.")
     removeTag(data.id)
     removeElem(data.id)
   })

  socket.on('user joined', (data) => {
    for (i = 0; i < data.usernames.length; i++) {
      if (!(usernames.includes(data.usernames[i]))) {
        usernames.push(data.usernames[i]);
        log(data.usernames[i]);
      }
      
    }
    //addParticipantsMessage(data);
  });

  socket.on('remove elem', (data) => {
    removeElem(data.idValue);
  })

  socket.on('user left', (data) => {
    $("#" + data.username).remove()
    const lastmsgs = recievedmsgs.filter(msg => msg['username'] === data.username)
    lastmsgs.map((msg)=>{
      setTimeout(() =>{
        removeElem(msg['ID']) ,
        2000});
    })
    usernames = usernames.filter(e => e !== data.username);
    //log(data.username + ' left');
    //addParticipantsMessage(data);
    //removeChatTyping(data);
  });

  //Dragging the page
  var clicked = false;
  var yPos, xPos;
  var distance;

  $(document).on ({ 
    'mousemove': function(e) {
          clicked && updateScrollPos(e);
          for (i=0; i < recievedmsgs.length; i++) {
            drawCircle($("#" + recievedmsgs[i]['ID']), recievedmsgs[i]['ID'], recievedmsgs[i]['username'])
          }
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
   
});