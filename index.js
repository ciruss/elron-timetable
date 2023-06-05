import inquirer from "inquirer";
import inquirerPrompt from "inquirer-autocomplete-prompt";

const bottomBar = new inquirer.ui.BottomBar();

// format date from '2023-06-04T07:35:00.000+03:00' to '07:35'
const formatDate = (date) => {
  const dateObject = new Date(date);
  const hours = dateObject.getHours().toString().padStart(2, '0');
  const minutes = dateObject.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
};

(async () => {
  const stations = await fetch('https://api.ridango.com/v2/64/intercity/originstops');
  const stationsJson = await stations.json();

  const filterStations = (input) => {
    return stationsJson.filter((station) => station.stop_name.toLowerCase().includes(input.toLowerCase()));
  }

  const findStation = (answer, input = '') => {
    const matchingStations = filterStations(input);
    const matchingNames = matchingStations.map((station) => station.stop_name);

    return matchingNames;
  };

  inquirer.registerPrompt('timeTable', inquirerPrompt);
  inquirer
    .prompt([
      {
        type: 'timeTable',
        name: 'startStation',
        message: 'Select a station to travel from',
        source: findStation,
      },
      {
        type: 'timeTable',
        name: 'endStation',
        message: 'Select a station to travel to',
        source: findStation,
      },
    ])
    .then(async (answers) => {
      try {
        bottomBar.updateBottomBar('Loading trips...');
        const { startStation, endStation } = answers;

        // today's date in format YYYY-MM-DD
        const today = new Date().toISOString().slice(0, 10);
        const startStationId = stationsJson.find((station) => station.stop_name === startStation).stop_area_id;
        const endStationId = stationsJson.find((station) => station.stop_name === endStation).stop_area_id;

        const requestBody = {
          channel: 'web',
          date: today,
          origin_stop_area_id: startStationId,
          destination_stop_area_id: endStationId,
        }

        const trips = await fetch('https://api.ridango.com/v2/64/intercity/stopareas/trips/direct', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        const tripsJson = await trips.json();

        bottomBar.updateBottomBar('');

        console.log(`${startStation} to ${endStation} --- price ${tripsJson.journeys[0].trips[0].product.price}`);

        if (tripsJson.journeys.length === 0) {
          console.error('No trips found on this route');
          return;
        }

        tripsJson.journeys.forEach((trip) => {
          const currentTime = formatDate(new Date());
          const departureTime = formatDate(trip.trips[0].departure_time);

          if (currentTime < departureTime) {
            console.log(`Departure ${formatDate(trip.trips[0].departure_time)} arrival ${formatDate(trip.trips[0].arrival_time)}`);
          }
        });
      } catch (error) {
        console.log(error);
      }
    })
    .catch((error) => {
      console.log(error);
    });
})();
