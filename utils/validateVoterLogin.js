const validateForm = (aadhaar, password) => {
  let errors = [];

  var aadhaarReg = /^[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}$/;

  if (!aadhaar || !password) {
    errors.push({ msg: "Please enter all fields" });
  }

  if (!aadhaarReg.test(aadhaar)) {
    errors.push({ msg: "Enter valid Aadhaar number" });
  }
  return errors;
};

module.exports = validateForm;
