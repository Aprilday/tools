const bucket = new WeakMap();
let activeEffect, effectStack = [];
const data = { OK: true, text: 'hello world', foo: 1 };
// const data = { foo: 1 };

const obj = new Proxy(data, {
    get(target, key) {
        // console.log(key)
        if (!activeEffect) return;
        track(target, key);

        return target[key];
    },
    set(target, key, newVal) {
        target[key] = newVal;
        trigger(target, key);

        return true;
    }
});

function track(target, key) {
    // debugger;
    let depsMap = bucket.get(target);
    if (!depsMap) {
        bucket.set(target, (depsMap = new Map()));
    }
    let deps = depsMap.get(key);
    if (!deps) {
        depsMap.set(key, (deps = new Set()));
    }
    deps.add(activeEffect);
    activeEffect.deps.push(deps);
    // console.warn('activeEffect deps = ', key, activeEffect.deps);
}

function trigger(target, key) {
    // debugger;
    const depsMap = bucket.get(target);
    if (!depsMap) return
    const effects = depsMap.get(key);
    const effectsToRun = new Set();
    effects && effects.forEach(effectFn => {
        if (effectFn !== activeEffect) {
            effectsToRun.add(effectFn)
        }
    })
    // console.warn(key, effectsToRun);
    effectsToRun.forEach(effectFn => {
        // effectFn()
        if (effectFn.options.scheduler) {
            effectFn.options.scheduler(effectFn);
        } else {
            effectFn();
        }
    });
    // effects.forEach(fn => fn());
}

function effect(fn, options = {}) {
    // console.warn('effect fn')
    const effectFn = () => {
        // debugger;
        cleanup(effectFn);
        activeEffect = effectFn;
        effectStack.push(effectFn);
        fn();
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
    }
    effectFn.deps = [];
    effectFn.options = options;
    effectFn();
}

function cleanup(effectFn) {
    for (let i = 0; i < effectFn.deps.length; i++) {
        const deps = effectFn.deps[i];
        deps.delete(effectFn);
    }
    effectFn.deps.length = 0;
}

const jobQueue = new Set();
let isFlushing = false;
const p = Promise.resolve();

function flushJob() {
    if (isFlushing) return;
    isFlushing = true;
    p.then(() => {
        jobQueue.forEach(job => job());
    }).finally(() => {
        isFlushing = false;
    })
}
// effect(() => {
//     console.log('effect run');
//     // document.body.innerText = obj.text;
//     document.body.innerText = obj.OK ? obj.text : 'not';
// });

// setTimeout(() => {
//     // console.log('0');
//     debugger;
//     obj.OK = false;
//     // console.log('1')
//     obj.text = 'hello vue3';
//     // console.log('2')
//     // obj.nonExist = 'hello vue3';
// }, 1000);

// let temp1, temp2;
// effect(function effectFn1() {
//     console.log('effect1 执行');
//     effect(function effectFn2() {
//         console.log('effect2 执行');
//         temp2 = obj.text;
//     });
//     temp1 = obj.OK;
// });
// obj.text = 'aaa'
// obj.OK = false;


// effect(() => {
//     console.log(obj.foo);
// });

// obj.foo = obj.foo + 1;

effect(() => {
    console.log(obj.foo);
}, {
    scheduler(fn) {
        // setTimeout(fn);
        jobQueue.add(fn);
        flushJob();
    }
})
obj.foo++
console.log('结束了');
