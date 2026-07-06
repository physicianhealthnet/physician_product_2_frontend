function formatDateToDDMMYYYY(date) {
  if (!(date instanceof Date)) {
    date = new Date(date); // Convert string/number to Date
  }

  const day = String(date.getDate()).padStart(2, "0"); // Add leading zero if needed
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export default formatDateToDDMMYYYY;
