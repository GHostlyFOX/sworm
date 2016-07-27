/**
 * this is a curious class
 *
 * Imagine this scenario:
 *
 * 1. we open a db connection.
 * 2. run two simultaneous queries against it, i.e. Promise.all([query1(), query2()])
 * 3. the first query breaks, due to an SQL exception
 * 4. We log the error and close the database immediately
 * 5. however, query2 is still executing and prevents the database connection from being closed
 * 6. the connection is now in a broken state, it cannot be used, but remains in the conneciton pool
 *
 * this class ensures that we don't close the connection until all queries have finished
 */
var promiseFinally = require('./promiseFinally');

module.exports = function() {
  return {
    queries: 0,

    execute(p) {
      this.queries++;
      return promiseFinally(p, () => {
        this.queries--;
        if (this.queries === 0 && this._whenFinished) {
          this._whenFinished();
        }
      });
    },

    whenNotExecuting(wf) {
      return new Promise(resolve => {
        if (this.queries == 0) {
          resolve(wf());
        } else {
          this._whenFinished = function() {
            resolve(wf());
          };
        }
      });
    }
  };
}