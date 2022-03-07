function newFn() {
    const obj = new Object(),
    Constructor = [].shift.call(arguments);

    Constructor.prototype = obj.__proto__;
    const ret = Constructor.apply(obj, arguments);
    return typeof ret === 'object' ? ret : obj;
}

function animal(name, age) {
    this.name = name;
    this.age = age;
}

const cat = newFn(animal, 'cat', 12);
console.log(cat.name, cat.age);