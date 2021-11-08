const validateEthereum = (accNo) => {
  let errors = [];

  var ethereumRegex = /^0x[a-fA-F0-9]{40}$/;

  if (!accNo) {
    errors.push({ msg: "Please enter all fields" });
  }

  if (!ethereumRegex.test(accNo)) {
    errors.push({ msg: "Enter valid Ethereum account" });
  }
  return errors;
};

module.exports = validateEthereum;
