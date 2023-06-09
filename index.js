import chalk from "chalk";
import inquirer from "inquirer";
import inquirerDate from 'inquirer-date-prompt';
import inquirerPrompt from "inquirer-autocomplete-prompt";
import { formatDateToTime, getDateFromDateTimeString } from "./utils.js";

const bottomBar = new inquirer.ui.BottomBar();

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
  inquirer.registerPrompt('dateForTrip', inquirerDate);
  inquirer
    .prompt([
      {
        type: 'dateForTrip',
        name: 'tripDate',
        message: 'Select the date for the trip',
        locale: 'en-GB',
        format: { day: 'numeric', month: 'long', year: undefined, hour: undefined, minute: undefined },
      },
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
        const { startStation, endStation, tripDate } = answers;

        // today's date in format YYYY-MM-DD
        const today = new Date().toISOString().slice(0, 10);
        const formatedTripDate = getDateFromDateTimeString(tripDate);
        const startStationId = stationsJson.find((station) => station.stop_name === startStation).stop_area_id;
        const endStationId = stationsJson.find((station) => station.stop_name === endStation).stop_area_id;

        const tripDateObject = new Date(tripDate);
        const tripDay = tripDateObject.getDate();
        const tripMonth = tripDateObject.toLocaleString('default', { month: 'long' });
        
        const requestBody = {
          channel: 'web',
          date: formatedTripDate,
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

        if (tripsJson.journeys.length === 0) {
          console.error(chalk.bold.red('No trips found on this route'));
          return;
        }

        console.log(chalk.green(`${startStation} - ${endStation} on ${tripMonth} ${tripDay} --- price ${tripsJson.journeys[0].trips[0].product.price} \n`));

        console.log(chalk.underline(`https://elron.pilet.ee/et/otsing/${startStation}/${endStation}/${formatedTripDate}`),'\n');

        tripsJson.journeys.filter(trip => {
          if (today !== formatedTripDate) return true;

          const currentTime = formatDateToTime(new Date());
          const departureTime = formatDateToTime(trip.trips[0].departure_time);

          if (currentTime < departureTime) return true;

          return false;
        }).forEach((trip) => {
          const departureTime = formatDateToTime(trip.trips[0].departure_time);
          const arrivalTime = formatDateToTime(trip.trips[0].arrival_time);

          console.log(`Departure ${departureTime} arrival ${arrivalTime}`);
        });
      } catch (error) {
        console.log(error);
      }
    })
    .catch((error) => {
      console.log(error);
    });
})();
