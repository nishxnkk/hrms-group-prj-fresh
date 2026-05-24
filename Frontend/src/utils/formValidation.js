export const focusField = (field) => {
  if (!field) return;
  field.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => {
    if (typeof field.focus === "function") field.focus({ preventScroll: true });
  }, 150);
};

export const focusFirstInvalid = (form) => {
  if (!form) return false;
  const invalid = form.querySelector(":invalid");
  if (!invalid) return false;
  focusField(invalid);
  if (typeof invalid.reportValidity === "function") invalid.reportValidity();
  return true;
};

export const validateRequiredFields = (fields, setError) => {
  for (const field of fields) {
    const value = typeof field.value === "string" ? field.value.trim() : field.value;
    if (value === undefined || value === null || value === "") {
      if (setError) setError(field.message || `${field.label || "This field"} is required`);
      focusField(field.ref?.current || field.element);
      return false;
    }
  }
  if (setError) setError("");
  return true;
};

export const handleInvalidCapture = (event) => {
  event.preventDefault();
  focusField(event.target);
  if (typeof event.target.reportValidity === "function") {
    window.setTimeout(() => event.target.reportValidity(), 150);
  }
};
