var through = require('through');


function rain(val, pass) {
  process.nextTick(pass.bind(null, true));
}


var middleware = require('../lib/middleware')({
  forms: {
    settings: {
      fields: {
        username: {
          required: true,
          validate: [
            { fn: /^[a-z]{1,15}$/i, msg: 'Only alphabetic characters' },
            { fn: rain, msg: 'no!' }
          ]
        }
      }
    }
  }
});


exports.tearDown = function(callback) {
  middleware.die();
  callback();
};


exports['server client Javascript file'] = function(test) {
  var req = through();
  req.url = '/castform/castform.js';

  var res = {
    writeHead: function(code, headers) {
      test.equal(code, 200);
      test.deepEqual(headers, { 'Content-Type': 'text/javascript' });
    },
    end: function(data) {
      test.ok(data);
      test.ok(data.length);
      test.done();
    }
  };

  function next() {
    throw Error('should not call next()');
  }

  middleware(req, res, next);
};


exports['dont match any castform routes'] = function(test) {
  var req = through();
  req.url = '/socket.io/socket.io.js';

  var res = {};

  middleware(req, res, test.done);
};


exports['invalid id'] = function(test) {
  var req = through();
  req.url = '/castform/async';
  req.setEncoding = function() {};
  var data = JSON.stringify({
    id: 'signout',
  });
  req.headers = {
    'content-type': 'application/json; charset=UTF-8',
    'content-length': data.length
  };

  process.nextTick(function() {
    req.write(data);
    req.end();
  });

  var res = {
    writeHead: function(code, headers) {
      test.equal(code, 200);
      test.deepEqual(headers, { 'Content-Type': 'application/json' });
    },
    end: function(data) {
      test.equal(data, '{"success":false,"msg":"no such id signout"}');
      test.done();
    }
  };

  function next() {
    throw Error('should not call next()');
  }

  middleware(req, res, next);
};


exports['validate field asynchronously'] = function(test) {
  var req = through();
  req.url = '/castform/async';
  req.setEncoding = function() {};
  var data = JSON.stringify({
    id: '0',
    values: 'bobby hill'
  });
  req.headers = {
    'content-type': 'application/json; charset=UTF-8',
    'content-length': data.length
  };

  process.nextTick(function() {
    req.write(data);
    req.end();
  });

  var res = {
    writeHead: function(code, headers) {
      test.equal(code, 200);
      test.deepEqual(headers, { 'Content-Type': 'application/json' });
    },
    end: function(data) {
      var result = { success: true };
      test.equal(data, JSON.stringify(result));
      test.done();
    }
  };

  function next() {
    throw Error('should not call next()');
  }

  middleware(req, res, next);
};


exports['validate submitted form'] = function(test) {
  var req = through();
  req.url = '/castform/submit';
  req.setEncoding = function() {};
  var data = JSON.stringify({
    id: 'settings',
    values: {
      username: 'bobby hill'
    }
  });
  req.headers = {
    'content-type': 'application/json; charset=UTF-8',
    'content-length': data.length
  };

  process.nextTick(function() {
    req.write(data);
    req.end();
  });

  var res = {
    writeHead: function(code, headers) {
      test.equal(code, 200);
      test.deepEqual(headers, { 'Content-Type': 'application/json' });
    },
    end: function(data) {
      var result = {
        success: false,
        msg: {
          username: {
            success: false,
            msg: 'Only alphabetic characters',
            value: 'bobby hill'
          }
        }
      };
      test.equal(data, JSON.stringify(result));
      test.done();
    }
  };

  function next() {
    throw Error('should not call next()');
  }

  middleware(req, res, next);
};
