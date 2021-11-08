const isInt = (value) => {
  if (isNaN(value)) {
    return false;
  }
  var val = parseFloat(value);
  return (val | 0) === val;
};

const validateCandidateId = (id, count) => {
  if (!isInt(id)) {
    return false;
  }

  id = parseInt(id);
  if (id <= 0 || count < id) {
    return false;
  }

  return true;
};

module.exports = validateCandidateId;
