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