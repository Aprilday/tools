const bucket = new WeakMap();
let activeEffect, effectStack = [];
const data = { OK: true, text: 'hello world', foo: 1, bar: 2 };
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
        if (effectFn.options.scheduler) {
            effectFn.options.scheduler(effectFn);
        } else {
            effectFn();
        }
    });
    // effects.forEach(fn => fn()); 
}

function effect(fn, options = {}) {
    console.warn('effect fn')
    const effectFn = () => {
        // debugger;
        cleanup(effectFn);
        activeEffect = effectFn;
        effectStack.push(effectFn);
        const res = fn();
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
        return res;
    }
    effectFn.deps = [];
    effectFn.options = options;
    if (options.lazy) { 
        effectFn();
    }
    return effectFn;
}

function cleanup(effectFn) {
    for (let i = 0; i < effectFn.deps.length; i++) {
        const deps = effectFn.deps[i];
        deps.delete(effectFn);
    }
    effectFn.deps.length = 0;
}

function computed(getter) {
    let value;
    let dirty = true;
    const effectFn = effect(getter, {
        lazy: true,
        scheduler() {
            dirty = true;
            trigger(obj, 'value')
        }
    })

    const obj = {
        get value() {
            if (dirty) {
                value = effectFn()
                dirty = false;
            }
            track(obj, 'value')
            return value;
        }
    }
    return obj;
}

function watch(source, cb) {
    debugger
    let getter;
    if (typeof source === 'function') {
        getter = source;
    } else {
        getter = () => traverse(source)
    }

    effect(
        () => getter(),
        {
            scheduler() {
                cb();
            },
            lazy: true
        }
    )
}

function traverse(value, seen = new Set()) {
    // console.warn('traverse',  value)
    // debugger
    if (typeof value !== 'object' || value === null || seen.has(value)) return;
    seen.add(value);
    for (const k in value) {
        traverse(value[k], seen);
    }
    console.warn('value = ', value)
    return value;
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

/* effect(() => {
    console.log(obj.foo);
}, {
    scheduler(fn) {
        // setTimeout(fn);
        jobQueue.add(fn);
        flushJob();
    }
})
obj.foo++
console.log('结束了'); */

// const sum = computed(() => obj.foo + obj.bar);
// console.log(sum);

watch(() => obj.foo, () => console.log('obj 的值变了'));
obj.foo = 4;

