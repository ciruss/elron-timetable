// format date from '2023-06-04T07:35:00.000+03:00' to '07:35'
export const formatDateTime = (date) => {
  const dateObject = new Date(date);
  const hours = dateObject.getHours().toString().padStart(2, '0');
  const minutes = dateObject.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
};

export const ticketLink = (startStation, endStation) => {
  const today = new Date().toISOString().slice(0, 10);
  return `https://elron.pilet.ee/et/otsing/${startStation}/${endStation}/${today}`;
}
