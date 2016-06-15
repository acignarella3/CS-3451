// the MousePosition interface
export interface MousePosition {
    x: number;
    y: number;
}

export class PointSet {

// The PointSet class needs to be created here.
// 
// PointSet should be implemented as a circular buffer of fixed size 
// (the size is fixed at compile time), and when the buffer is full and a new point is added
// it overwrites the oldest point.  
//
// The key feature of a cicular buffer is that internally, it is implemented with an array,
// and with a "start" and "count" indices that show you were the first element is, and how many
// elements are in the buffer.  When the buffer is full, "count" is the size of the array.
// 
// When an element is removed from either end of the buffer, the "start" and "count" indices are 
// updated.  When a new element is added, "count" is incremented.  When an element is added to 
// a full buffer, the oldest element is overwritten (and the "start" is incremented).
// 
// Care must be taken to deal with wrapping around the end.
//
// You should implement these methods, at least:
//      addPoint(m: MousePosition) { ... }           // add a new point, overwritting the oldest if full
//   	dropPoint() { ... }                          // remove the oldest point
//  	getCount(): number { ... }                   // get the current count
//  	getPoint(i: number): MousePosition { ... }   // get point number "i" (not array element "i")

    //Set the size, which for this program is always 30
    size = 30;

    //Set up start and count
    //Start is the oldest spot in the array, while count is the total number of filled-up spots
    start;
    count;

    //Set up empty array
    arr = [];
    
    //This constructor initializes start and count as 0
    constructor() {
        
        this.start = 0;
        this.count = 0;
        
    }

    //This function takes in a MousePosition and puts it into the array
    addPoint(m: MousePosition) {
        
        //Add together start and count in order to get "spot", the spot in the array to
        //put in the MousePosition
        var spot = this.start + this.count;
        
        //If spot goes over the size, subtract size from spot in order to properly loop
        //around the array
        if (spot >= this.size) {
            
            spot = spot - this.size;
            
        }
        
        //Special measures for if count has reached (or somehow exceeded) size
        if (this.count >= this.size) {
            
            //Increment start to get the new oldest spot
            this.start = this.start + 1;
            
            //If start has gone past the size, go back to 0 to loop
            if (this.start >= this.size) {
                
                this.start = 0;
                
            }
            
            //This subtraction "corrects" the later addition in order to keep count the same
            this.count = this.count - 1;
            
        }
        
        //Put m to spot's spot in arr
        this.arr[spot] = m;
        
        //Increment count
        this.count = this.count + 1;
    
    }

    //This function drops the oldest point in the array
    dropPoint() {
        
        //Increment start
        this.start = this.start + 1;
        
        //If it's gone over, loop
        if (this.start >= this.size) {
            
            this.start = 0;
            
        }
        
        //Decrement size
        //We don't need to actually remove what's inside the array since it'll be overwritten
        this.count = this.count - 1;
    
    }

    //Get the current total count
    getCount(): number {
    
        return this.count;
    
    }

    //Get the mouse position point in a particular spot of the array
    getPoint(i: number): MousePosition {
    
        return this.arr[i];
    
    }

}