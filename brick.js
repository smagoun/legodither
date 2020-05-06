/**
 * Information that describes a brick.
 */
class Brick {
    constructor(size, price, color, x = 0, y = 0) {
        this.size = size;
        this.price = price;
        this.color = color;
        this.x = x;
        this.y = y;
    }
}
