/**
 * Information that describes a brick.
 */
class Brick {
    constructor(width, height, price, color, x = 0, y = 0) {
        this.width = width;
        this.height = height;
        this.price = price;
        this.color = color;
        this.x = x;
        this.y = y;
    }

    /**
     * Compares two bricks for equality.
     * 
     * @param {*} obj Object to compare to this
     */
    isEqual(obj) {
        if (!obj instanceof Brick) {
            return false;
        }
        if (this.width != obj.width || this.height != obj.height || this.x != obj.x || this.y != obj.y
                || this.price != obj.price || this.color != obj.color) {
            return false;
        }
        return true;
    }

    /**
     * Returns true if no properties have the value undefined
     */
    isComplete() {
        if (this.width === undefined || this.height === undefined || this.price === undefined || this.color === undefined
            || this.x === undefined || this.y === undefined) {
                return false;
        }
        return true;
    }

    /**
     * Returns a string representation of the Brick
     */
    toString() {
        return `{s:${this.width}x${this.height}, p:${this.price}, c:${this.color}, x:${this.x}, y:${this.y}}`;
    }
}
