const { assert } = require('chai');
const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('return a user when presented with a valid email', function() {
    const user = getUserByEmail("user2@example.com", testUsers);
    const expectedOutput = testUsers.user2RandomID;
    assert.equal(user, expectedOutput);
  });
  it('return undefined when presented with an invalid email', function() {
    const user = getUserByEmail("user3@example.com", testUsers);
    assert.equal(user, undefined);
  });
});