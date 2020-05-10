$(function() {
  const MAX_MESSAGES = 3;
  const DISPLAY_TIME = 15000;
  const MAX_CHARS = "40";

  // Make connection
  var socket = io.connect('http://localhost:3000');
  var ids = [];

  // Generates a unique ID for new elements
  function uniqId() {
    return Math.round(new Date().getTime() + (Math.random() * 100));
  }

  // Callback function that removes id
  function removeTag(id) {
    console.log("hi");

    if (ids.includes(id)) {
      document.getElementById(id).remove();
      ids = ids.filter(e => e !== id);
    } else {
      return;
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
        console.log("pressing")
        var value = tag.value;
        var iden = tag.id;
        socket.emit('new_message', {inputToAdd : value, id: iden})
      })
    }

    if (ids.length > 1) {
      var value = document.getElementById(ids[ids.length - 2]).value;
      if (value === "") {
        console.log("empty")
        //document.getElementById(ids[ids.length - 2]).remove();
        removeTag(ids[ids.length - 2]);
      }
    }

    if (ids.length > MAX_MESSAGES) {
      document.getElementById(ids[0]).remove();
      ids.shift();
    }
         
  })

    /*
    document.body.addEventListener('keyup', () => {
      console.log(clicked.value);
    })
    */

   function removePara(id) {
    document.getElementById(id).remove();
   }
   //Listening for new_position
   socket.on("new_position", (data) => {
      var display = $("<p>|</p>").attr("id", data.id)
      console.log('Current ID is: ' + display.attr('id'));
      
      $("body").append(
         $(display).css({
            position:'absolute',
            left: data.left,
            top: data.top
         }))

    setTimeout(() => {
      removePara(data.id);
    }, DISPLAY_TIME);
   })
   
   //Listening for new_message (typing)
   socket.on("new_message", (data) => {
      $("#" + data.id).text(data.inputToAdd);
   })
   
});