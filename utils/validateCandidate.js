const validateCandidate = (candidateName, partyName, partySlogan) => {
  let errors = [];

  var nameRegex = /^[A-Za-z ]{4,}$/;
  var sloganRegex = /^[A-Za-z0-9 ]{4,}$/;

  if (!candidateName || !partyName || !partySlogan) {
    errors.push({ msg: "Please enter all fields" });
  }

  if (!nameRegex.test(candidateName)) {
    errors.push({ msg: "Enter valid Candidate name" });
  }

  if (!nameRegex.test(partyName)) {
    errors.push({ msg: "Enter valid Party name" });
  }

  if (!sloganRegex.test(partySlogan)) {
    errors.push({ msg: "Enter valid Party slogan" });
  }

  return errors;
};

module.exports = validateCandidate;
