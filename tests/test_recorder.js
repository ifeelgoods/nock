var nock    = require('../.')
  , tap     = require('tap')
  , http    = require('http');

tap.test('records', function(t) {
  nock.restore();
  var cb1 = false
    , options = { method: 'POST'
                , host:'github.com'
                , path:'/session' }
  ;

  nock.recorder.rec(true);
  var req = http.request(options, function(res) {
    cb1 = true
    var ret;
    res.once('end', function() {
      nock.restore();
      ret = nock.recorder.play();
      t.equal(ret.length, 1);
      t.equal(ret[0].indexOf("\nnock('http://github.com')\n  .post('/session', \"ABCDEF\")\n  .reply("), 0);
      nock.recorder.clear();
      t.end();
    });
  });
  req.end('ABCDEF');
  return req;
});

tap.test('checks if filtered request is generated', function(t) {
  nock.recorder.setGeneratedBodyRequestFilters([{
    method: 'POST',
    path: '/session',
    pattern: /"created_at":(("[^"]+")|null),?/g,
    replacement: '"created_at":"now"'
  }]);

  var cb1 = false
    , options = { method: 'POST'
                , host:'github.com'
                , path:'/session' }
  ;

  nock.restore();
  nock.recorder.rec(true);
  var req = http.request(options, function(res) {
    cb1 = true
    var ret;

    res.once('end', function() {
      nock.restore();
      ret = nock.recorder.play();
      t.equal(ret.length, 1);
      var expected = '\nnock(\'http://github.com\')\n  .filteringRequestBody(/"created_at":(("[^"]+")|null),?/g, "created_at":"now")\n  .post(\'/session\', "{\\"data\\":{\\"created_at\\":\\"now\\"}}")';
      t.equal(ret[0].indexOf(expected), 0);
      t.end();
    });
  });
  req.end('{"data":{"created_at":"2014-05-06T15:00:00-07:00"}}');
  return req;
});
