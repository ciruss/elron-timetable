// format date from '2023-06-04T07:35:00.000+03:00' to '07:35'
export const formatDateToTime = (date) => {
  const dateObject = new Date(date);
  const hours = dateObject.getHours().toString().padStart(2, '0');
  const minutes = dateObject.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
};

export const getDateFromDateTimeString = (dateTimeString) => {
  const date = new Date(dateTimeString).toISOString().slice(0, 10);
  return date;
}
