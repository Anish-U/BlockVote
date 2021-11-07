const validateForm = (username, password) => {
  let errors = [];

  var usernameRegex = /^[0-9A-Za-z]{4,}$/;

  if (!username || !password) {
    errors.push({ msg: "Please enter all fields" });
  }

  if (!usernameRegex.test(username)) {
    errors.push({ msg: "Enter valid username" });
  }
  return errors;
};

module.exports = validateForm;
