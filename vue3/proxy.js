const reactive = (obj) => {
    return new Proxy(obj, {
        get(target, key, receiver) {
            // console.log('get', target, receiver);
            return Reflect.get(target, key, receiver);
        },
        set(target, key, value, receiver) {
            console.log('set', target, receiver);
            return Reflect.set(target, key, value, receiver);
        }
    })
}
const obj = { foo: 1 };
const proto = { bar: 2 };
const child = reactive(obj);
const parant = reactive(proto);

Object.setPrototypeOf(child, parant);
// console.log('end = ', child.bar)
child.bar = 3;
// console.log(child.bar);

// let miaoMiao = {
//     _name: '疫苗',
//     get name () {
//         return this._name;
//     }
// }
// let miaoXy = new Proxy(miaoMiao, {
//     get (target, prop, receiver) {
//         // console.log(target, receiver);
//         return target[prop];
//     }
// });

// let kexingMiao = {
//     __proto__: miaoXy,
//     _name: '科兴疫苗'
// };

// console.log(kexingMiao.name);
