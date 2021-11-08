const validatePhone = (phoneNumber) => {
  let errors = [];

  var phoneRegex = /^[6-9]\d{9}$/;

  if (!phoneNumber) {
    errors.push({ msg: "Please enter all fields" });
  }

  if (!phoneRegex.test(phoneNumber)) {
    errors.push({ msg: "Enter valid Phone number" });
  }
  return errors;
};

module.exports = validatePhone;
