$(function() {
  const MAX_MESSAGES = 3;
  const DISPLAY_TIME = 15000;
  const MAX_CHARS = "40";

  // Make connection
  var socket = io();//.connect('http://localhost:3000');
  var ids = [];

  // Generates a unique ID for new elements
  function uniqId() {
    return Math.round(new Date().getTime() + (Math.random() * 100));
  }

  // Callback function that removes element
  function removeTag(id) {
    if (ids.includes(id)) {
      console.log("Removed bc empty.");
      document.getElementById(id).remove();
      ids = ids.filter(e => e !== id);
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

  document.body.addEventListener('click', event => {   
    const clicked = document.elementFromPoint(event.clientX, event.clientY)
    
    if (clicked.matches('input')) {
      clicked.focus
    } else {
      const tag = document.createElement('input');
      tag.id = uniqId();
      //tag.setAttribute("maxlength", MAX_CHARS)
      setTimeout(() => {
        removeTag(tag.id);
      }, DISPLAY_TIME);
      ids.push(tag.id);
      console.log(ids);

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
        console.log("Pressing")
        var value = tag.value;
        var iden = tag.id;
        socket.emit('new_message', {inputToAdd : value, id: iden})
      })
    }

    isPreviousEmpty(ids);
    maxMessages(ids);   
  })

    /*
    document.body.addEventListener('keyup', () => {
      console.log(clicked.value);
    })
    */

   var recievedmsgs = [];

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

    setTimeout(() => {
      removeElem(data.id);
    }, DISPLAY_TIME);

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
      $("#" + data.id).text(data.inputToAdd);
   })
   
});