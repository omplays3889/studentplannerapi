const checkLength = (param, maxLength) => {
    return (
      typeof param === 'string' &&
      param.trim() !== '' &&
      param.length >= 1 &&
      param.length <= maxLength
    );
  };

  const checkNumber = (param) => {
    return (
      typeof param === 'number' &&
      !isNaN(param) &&
      param >= 1 
    );
  };
  module.exports = {checkLength, checkNumber};