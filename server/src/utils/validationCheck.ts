// const visaRegex = /^4[0-9]{12}(?:[0-9]{3})?$/;
// const mastercardRegex = /^5[1-5][0-9]{14}$/;
// const amexRegex = /^3[47][0-9]{13}$/;
// const discoverRegex = /^6(?:011|5[0-9]{2})[0-9]{12}$/;

// const isValidVisa = (cardNumber: string): boolean => {
//   return visaRegex.test(cardNumber);
// };

// const isValidMastercard = (cardNumber: string): boolean => {
//   return mastercardRegex.test(cardNumber);
// };

// const isValidAmex = (cardNumber: string): boolean => {
//   return amexRegex.test(cardNumber);
// };

// const isValidDiscover = (cardNumber: string): boolean => {
//   return discoverRegex.test(cardNumber);
// };

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// const urlRegex = ^(http|https)://[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(/.*)?$;

// const phoneNumberRegex = ^\+?(\d[\d-. ]+)?(\([\d-. ]+\))?[\d-. ]+\d$

const usernameRegex = /^[a-zA-Z0-9]+([_]?[a-zA-Z0-9])*$/;

const fullNameRegex = /^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/;

// is full name valid
const isValidFullName = (fullName: string): boolean => {
  return fullNameRegex.test(fullName);
};
// is user name valid
const isValidUsername = (username: string): boolean => {
  return usernameRegex.test(username);
};

// is email valid
const isValidEmail = (email: string): boolean => {
  return emailRegex.test(email);
};

// is password valid
const isValidPassword = (password: string): boolean => {
  return passwordRegex.test(password);
};

export {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  isValidFullName,
};