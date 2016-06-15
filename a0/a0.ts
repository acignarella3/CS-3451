import ps = require('./pointset');

//------------------
// Global utility functions.
// getRandomColor creates a random web color
function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// a simple wrapper to reliably get the offset within an element  
// see: http://www.jacklmoore.com/notes/mouse-position/
function getOffset(e: MouseEvent): ps.MousePosition {
    e = e || <MouseEvent> window.event;

    var target = <Element> e.target || e.srcElement,
        rect = target.getBoundingClientRect(),
        offsetX = e.clientX - rect.left,
        offsetY = e.clientY - rect.top;

    return {x: offsetX, y: offsetY};
}
//------------------

// an interface that describes what our Rectangle object looks like
interface Rectangle {
    p1: ps.MousePosition;
    p2: ps.MousePosition;
    color: string;
}

// A class for our application state and functionality
class Drawing {
    // the public paramater "canv" is automatically created by "public" constructor parameter

    // rendering context for the canvas    
    ctx: CanvasRenderingContext2D;

    // last known mouse position
    mousePosition: ps.MousePosition;

    // mouse position when we clicked
    clickStart: ps.MousePosition = undefined;

    // our current rectangle set.  Grows as we add more rectangles
    rects: Array <Rectangle>;

    // the set of points trailing after the mouse
    points: ps.PointSet;
    
    // use the animationFrame to do continuous rendering.  Call it once to get things going.
    render() {
        // Store the current transformation matrix (and other state)
        this.ctx.save();
        
        // Use the identity matrix while clearing the canvas (just in case you change it someday!)
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.fillStyle = "lightgrey";
        this.ctx.clearRect(0, 0, this.canv.width, this.canv.height);
        
        // Restore the transform
        this.ctx.restore();        
        
        // add a point to the points object for the current mouse position (if the mouse position
        // is over the canvas and we've received it from onmousemove below).  
        // If the mouse isn't over the canvas, drop the oldest point instead.

        if (this.mousePosition != undefined && this.mousePosition.x >= 0 && this.mousePosition.x <= 512 &&
            this.mousePosition.y >= 0 && this.mousePosition.y <= 512) {
          
            //If the mouse is within the canvas and is defined, then add the point
            this.points.addPoint(this.mousePosition);
                
        } else {
            
            //If not, then drop the oldest
            this.points.dropPoint();
                
        }

        
        const rectCount = this.rects.length;
        // draw rectangles first
        
        //Check to make sure there are rectangles in the first place
        if (rectCount > 0) {
            
            //Loop for all rectangles
            for (var i = 0; i < rectCount; i++) {
                
                //Find the appropriate rectangle
                var box = this.rects[i];
            
                //Set the proper color
                this.ctx.fillStyle = box.color;
            
                //Draw the box, starting from p1 and ending at p2 - p1
                this.ctx.fillRect(box.p1.x, box.p1.y, box.p2.x - box.p1.x, box.p2.y - box.p1.y);
            
            }
            
        }


        const pointCount = this.points.getCount();
        // draw blue points with the oldest ones more transparent, 3x3 in size
        // hint: use the point number to create an rgba color
        // https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#rgba()
     
        //Check if there's points               
        if (pointCount > 0) {
            
            //Starting counter
            var n = 0;
            
            //Start off at the oldest point
            var pointer = this.points.start;
            
            //Loop for all points
            for (var i = 0; i < pointCount; i++) {
                
                //Get the spot in the array
                var spot = this.points.arr[pointer];
                
                //Divide n by 30, since the maximum size is 30
                var trans = (n / 30);
                
                //The RGB color is (0, 0, 255), which is blue
                //Use trans to set the alpha, which needs to be added in like a variable in a string
                this.ctx.fillStyle = "rgba(0, 0, 255, " + trans + ")";
                
                //Draw a 3x3 point starting at spot
                this.ctx.fillRect(spot.x, spot.y, 3, 3);
                
                //Increment n
                n = n + 1;
                
                //Increment pointer
                pointer = pointer + 1;
                
                //Loop around if necessary
                if (pointer >= this.points.size) {
                    
                    pointer = 0;
                    
                }
                
            }
            
        }

        // if we've clicked, draw the rubber band.  use a strokeStyle of gray, and use strokeRect instead of fillRect
        if (this.clickStart) {
            
            //Set the color
            this.ctx.strokeStyle = "gray";
            
            //Draw the box
            //Note: mousePosition is the mouse's current location, while clickStart is where the mouse was
            //when it was clicked
            this.ctx.strokeRect(this.mousePosition.x, this.mousePosition.y,
                this.clickStart.x - this.mousePosition.x, this.clickStart.y - this.mousePosition.y);
            
        }

        // do it again!  and again!  AND AGAIN!  AND ...       
        requestAnimationFrame(() => this.render());
    }
    
    // constructor for our state object
    constructor (public canv: HTMLCanvasElement) {
        this.clickStart = undefined;
        this.ctx = canv.getContext("2d");
        this.rects = new Array(0);  // start with no rects
        this.points = new ps.PointSet();
 
        canv.onmousedown = (ev: MouseEvent) => {
             this.clickStart = getOffset(ev);        
        }
        
        canv.onmouseup = (ev: MouseEvent) => {
            if (this.clickStart != undefined) {
                const clickEnd = getOffset(ev);
                var rect: Rectangle = {
                    p1: this.clickStart,
                    p2: clickEnd,
                    color: getRandomColor()
                };      
                this.rects.push(rect);          
                this.clickStart = undefined; 
            }
        }
        
        canv.onmousemove = (ev: MouseEvent) => {
            const m = getOffset(ev);
            this.mousePosition = m;
        }
        
        canv.onmouseout = (ev: MouseEvent) => {
            this.mousePosition = undefined;
            this.clickStart = undefined;
        }
    }
}

// a global variable for our state
var myDrawing: Drawing;

// main function, to keep things together and keep the globals
function exec() {
    // find our container
    var div = document.getElementById("drawing");
    // let's create a canvas and to draw in
    var canv = document.createElement("canvas");
    canv.id = "main";
    canv.width = 512;
    canv.height = 512;
    div.appendChild(canv);
    
    // create a Drawing object
    myDrawing = new Drawing(canv);
    
    // kick off the rendering!
    myDrawing.render(); 
}

exec();