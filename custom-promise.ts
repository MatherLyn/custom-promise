class CustomPromise {
  // There must be exactly 3 status in a promise:
  static PENDING: string = 'pending'
  static RESOLVED: string = 'resolved'
  static REJECTED: string = 'rejected'
  static deferred: any = function() {
    const defer = {
      promise: undefined,
      resolve: undefined,
      reject: undefined
    }
    defer.promise = new CustomPromise((resolve, reject) => {
      defer.resolve = resolve
      defer.reject = reject
    })
    return defer
  }

  status: string
  value: any
  reason: string
  resolveCallbacks: Array<Function> = []
  rejectCallbacks: Array<Function> = []
  constructor (executor: Function) {
    this.status = CustomPromise.PENDING
    this.bindThis()
    this.initialize(executor)
  }

  bindThis () {
    this.resolve = this.resolve.bind(this)
    this.reject = this.reject.bind(this)
  }

  resolve (value: any) {
    if (this.status === CustomPromise.PENDING) {
      setTimeout(() => {
        this.value = value
        this.resolveCallbacks.forEach(callback => callback(value))
        this.status = CustomPromise.RESOLVED
      })
    }
  }

  reject (reason: string) {
    if (this.status === CustomPromise.PENDING) {
      setTimeout(() => {
        this.reason = reason
        this.rejectCallbacks.forEach(callback => callback(reason))
        this.status = CustomPromise.REJECTED 
      })
    }
  }

  initialize (executor: Function) {
    try {
      executor(this.resolve, this.reject)
    } catch (e) {
      this.reject(e)
    }
  }

  then (onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : (value) => { return value }
    onRejected = typeof onRejected === 'function' ? onRejected : (err) => { throw err }
    let promise
    if (this.status === CustomPromise.RESOLVED) {
      promise = new CustomPromise((resolve: Function, reject: Function) => {
        setTimeout(() => {
          try {
            const x = onFulfilled(this.value)
            resolve(x)
          } catch (e) {
            reject(e)
          }
        })
      })
    }

    if (this.status === CustomPromise.REJECTED) {
      promise = new CustomPromise((resolve: Function, reject: Function) => {
        setTimeout(() => {
          try {
            const x = onRejected(this.value)
            resolve(x)
          } catch (e) {
            reject(e)
          }
        })
      })
    }

    if (this.status === CustomPromise.PENDING) {
      promise = new CustomPromise((resolve, reject) => {
        this.resolveCallbacks.push((value: any) => {
          try {
            const x = onFulfilled(value)
            resolve(x)
          } catch (e) {
            reject(e)
          }
        })
  
        this.rejectCallbacks.push((reason: string) => {
          try {
            const x = onRejected(reason)
            resolve(x)
          } catch (e) {
            reject(e)
          }
        })
      })
    }
  }

  static resolvePromise (promise: CustomPromise, x: any, resolve: Function, reject: Function) {
    let called: boolean = false
    if (promise === x) {
      return reject(new TypeError('Chaining cycle detected for promise.'))
    }

    if (x instanceof CustomPromise) {
      if (x.status === CustomPromise.PENDING) {
        x.then((y: any) => {
          this.resolvePromise(promise, y, resolve, reject)
        }, (reason: string) => {
          reject(reason)
        })
      } else {
        x.then(resolve, reject)
      }
    } else if ((x !== null && typeof x === 'object') || typeof x === 'function') {
      try {
        const then = x.then
        if (typeof then === 'function') {
          then.call(x, (y: any)=> {
            if (called) return
            called = true
            CustomPromise.resolvePromise(promise, y, resolve, reject)
          }, (r: string) => {
            if(called) return;
            called = true;
            reject(r);
          })
        } else {
          resolve(x)
        }
      } catch (e) {
        if (called) return
        called = true
        reject(e)
      }
    } else {
      resolve(x)
    }
  }

}
