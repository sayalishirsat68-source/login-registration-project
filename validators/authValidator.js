function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function validateRegistration(body) {
  const fullName = String(body.full_name || '').trim();
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const confirmPassword = String(body.confirm_password || '');
  const role = String(body.role || '').trim();

  const errors = {};

  if (!fullName) errors.full_name = 'Full name is required.';
  else if (fullName.length < 2) errors.full_name = 'Full name must be at least 2 characters.';

  if (!email) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please provide a valid email address.';

  if (!password) errors.password = 'Password is required.';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters long.';
  else if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) errors.password = 'Password must contain at least one uppercase letter and one number.';

  if (!confirmPassword) errors.confirm_password = 'Please confirm your password.';
  else if (password !== confirmPassword) errors.confirm_password = 'Passwords do not match.';

  if (!role) errors.role = 'Role is required.';
  else if (!['Volunteer', 'Donor', 'Member', 'Admin'].includes(role)) errors.role = 'Invalid role selected.';

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: { fullName, email, password, role }
  };
}

function validateLogin(body) {
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const errors = {};

  if (!email) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please provide a valid email address.';

  if (!password) errors.password = 'Password is required.';

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: { email, password }
  };
}

function validatePasswordChange(body) {
  const currentPassword = String(body.current_password || '');
  const newPassword = String(body.new_password || '');
  const errors = {};

  if (!currentPassword) errors.current_password = 'Current password is required.';
  if (!newPassword) errors.new_password = 'New password is required.';
  else if (newPassword.length < 8) errors.new_password = 'New password must be at least 8 characters long.';
  else if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) errors.new_password = 'New password must contain at least one uppercase letter and one number.';

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: { currentPassword, newPassword }
  };
}

module.exports = {
  normalizeEmail,
  validateRegistration,
  validateLogin,
  validatePasswordChange
};
