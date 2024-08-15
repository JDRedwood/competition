import { setData, getData } from './data.js';
import { setLabels, setDataset, changeTitle, changeYAxis } from './charts.js';

document.addEventListener('DOMContentLoaded', async function () {
    const googleApiKey = 'AIzaSyAhH_VUgkhoPPUWp7GgTauSN_gx_cwrdhc';
    const supabaseUrl = 'https://mqvxtjqmiamjlbexwhbk.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xdnh0anFtaWFtamxiZXh3aGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk1MjYzNTMsImV4cCI6MjAzNTEwMjM1M30.MAD3avhcjcvqEBECSgAsmkvRpY_zoQiF7OLqnYat6jk';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    const locationName = getData("locationName");
    const tableName = getData("tableName");
    const link = getData("link");
    const city = getData("city");
    const state_abr = getData("state_abr");
    const price = getData("price");

    console.log("Fetching data from Supabase...");
    console.log("Table Name:", tableName);
    console.log("Location Name:", locationName);
    console.log("Link:", link);
    console.log("City:", city);
    console.log("State:", state_abr);
    console.log("Price:", price);

    document.getElementById("location-name").innerHTML = locationName;
    document.getElementById("location").innerHTML = `${city}, ${state_abr}`;


    // Update the header link
    const headerLink = document.querySelector('#location-link');
    headerLink.href = link;

    let currentDate = new Date();
    let currentSelection = "daily";
    getDailyData(supabase, tableName, formatDateToYMD(currentDate));

    document.getElementById("daily").addEventListener("click", function () {
        currentSelection = "daily";
        getDailyData(supabase, tableName, formatDateToYMD(currentDate));
    });
    document.getElementById("weekly").addEventListener("click", function () {
        currentSelection = "weekly";
        getWeeklyData(supabase, tableName, formatDateToYMD(currentDate));
    });
    document.getElementById("monthly").addEventListener("click", function () {
        currentSelection = "monthly";
        getMonthlyData(supabase, tableName, formatDateToYMD(currentDate));
    });

    function formatDateToYMD(date) {
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        return `${year}-${month}-${day}`;
    }

    async function getDailyData(supabase, tableName, dateStr) {
        const currentDate = dateStr;
        let currentLabels = [];

        if (tableName.includes("escapegame")) {
            let { data, error } = await supabase
                .from(tableName)
                .select('date, timeSlots')
                .eq('date', currentDate);
            if (error) {
                console.error('Error fetching data:', error);
            } else {
                // Assuming only one record per date
                if (data.length > 0) {
                    const timeSlotsData = data[0].timeSlots;
                    let timeSlotsArray = [];
                    let totalTimeSlots = 0;
                    let bookedTimeSlots = 0;
                    let totalTicketsSold = 0;
                    let totalPossibleTickets = 0;

                    for (const gameId in timeSlotsData) {
                        const timeSlots = timeSlotsData[gameId].timeSlots;
                        const totalTickets = timeSlotsData[gameId].totalTickets;
                        for (const time in timeSlots) {
                            const ticketsAvailable = timeSlots[time];
                            const ticketsSold = totalTickets - ticketsAvailable;

                            // Convert time to a readable format
                            const hours = Math.floor(time / 100);
                            const minutes = time % 100;
                            const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

                            timeSlotsArray.push({
                                time: formattedTime,
                                ticketsSold: ticketsSold
                            });

                            totalTimeSlots++;
                            totalTicketsSold += ticketsSold;
                            totalPossibleTickets += totalTickets;
                            if (ticketsSold > 0) {
                                bookedTimeSlots++;
                            }
                        }
                    }

                    // Sort the time slots by time in ascending order
                    timeSlotsArray.sort((a, b) => {
                        const timeA = a.time.split(':').join('');
                        const timeB = b.time.split(':').join('');
                        return timeA - timeB;
                    });

                    // Update labels and tickets
                    currentLabels = timeSlotsArray.map(slot => slot.time);
                    let tickets = timeSlotsArray.map(slot => slot.ticketsSold);

                    document.getElementById("totalSales").innerHTML = "Total Sales: " + totalTicketsSold;

                    setLabels(currentLabels);
                    setDataset(tickets);

                    const [year, month, day] = currentDate.split('-');
                    const formattedDate = new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    changeTitle(formattedDate);
                    window.showDateSelection();

                    // Calculate the percentage of time slots that had a booking
                    const percentageBooked = (bookedTimeSlots / totalTimeSlots) * 100;
                    // Calculate the capacity booked percentage
                    const capacityBooked = (totalTicketsSold / totalPossibleTickets) * 100;
                    const revenue = totalTicketsSold * price;
                    document.getElementById("revenue").innerHTML = `Estimated Revenue: $${revenue}` + ' | @ $' + price;
                    document.getElementById("percentageBooked").innerHTML = 'Time Slots Booked: ' + percentageBooked.toFixed(2) + '%' + ' | ' + bookedTimeSlots + '/' + totalTimeSlots;
                    document.getElementById("capacityBooked").innerHTML = 'Total Capacity Booked: ' + capacityBooked.toFixed(2) + '%' + ' | ' + totalTicketsSold + '/' + totalPossibleTickets;
                }
            }
        } else {
            let { data, error } = await supabase
                .from(tableName)
                .select('timeSlots, ticketsPerTime, ticketsPerDay')
                .eq('date', currentDate);

            if (error) {
                console.error('Error fetching data:', error);
            } else {
                // Assuming only one record per date
                if (data.length > 0) {
                    const timeSlots = data[0].timeSlots;
                    const ticketsPerTime = data[0].ticketsPerTime;
                    const ticketsPerDay = data[0].ticketsPerDay;

                    currentLabels = Object.keys(timeSlots);

                    let tickets = [];
                    let totalTimeSlots = 0;
                    let bookedTimeSlots = 0;
                    let totalTicketsSold = 0;
                    let totalPossibleTickets = 0;

                    for (const timeSlot in timeSlots) {
                        let ticketsAvailable = timeSlots[timeSlot];
                        let ticketMax = ticketsPerTime;
                        if (ticketsAvailable > ticketsPerTime) {
                            ticketMax = ticketMax * 2;
                        }
                        let ticketsSold = ticketMax - ticketsAvailable;
                        tickets.push(ticketsSold);

                        totalTimeSlots++;
                        totalTicketsSold += ticketsSold;
                        totalPossibleTickets += ticketMax;
                        if (ticketsSold > 0) {
                            bookedTimeSlots++;
                        }
                    }

                    totalTicketsSold = tickets.reduce((total, ticket) => total + ticket, 0);
                    document.getElementById("totalSales").innerHTML = "Total Sales: " + totalTicketsSold;

                    setLabels(currentLabels);
                    setDataset(tickets);
                    const [year, month, day] = currentDate.split('-');
                    const formattedDate = new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    changeTitle(formattedDate);
                    window.showDateSelection();

                    // Calculate the percentage of time slots that had a booking
                    const percentageBooked = (bookedTimeSlots / totalTimeSlots) * 100;
                    // Calculate the capacity booked percentage
                    const capacityBooked = (totalTicketsSold / totalPossibleTickets) * 100;
                    const revenue = totalTicketsSold * price;
                    document.getElementById("revenue").innerHTML = `Estimated Revenue: $${revenue}` + ' | @ $' + price;
                    document.getElementById("percentageBooked").innerHTML = 'Time Slots Booked: ' + percentageBooked.toFixed(2) + '%' + ' | ' + bookedTimeSlots + '/' + totalTimeSlots;
                    document.getElementById("capacityBooked").innerHTML = 'Total Capacity Booked: ' + capacityBooked.toFixed(2) + '%' + ' | ' + totalTicketsSold + '/' + totalPossibleTickets;

                }
            }
        }
    }

    async function getWeeklyData(supabase, tableName, newDate) {
        let currentLabels = [];
        let labels = [];
        let dates = [];
        const currentDate = new Date(newDate);

        for (let i = 0; i < 7; i++) {
            const date = new Date(currentDate);
            date.setDate(currentDate.getDate() + i);
            
            // Generate label for the previous day
            const labelDate = new Date(date);
            labelDate.setDate(date.getDate() + 1);
            labels.push(labelDate.toLocaleDateString('en-US', { weekday: 'long' }));
            
            dates.push(date.toISOString().split('T')[0]);
        }

        let selectFields = 'date, ticketsPerTime, timeSlots';
        if (tableName.includes("escapegame")) {
            selectFields = 'date, timeSlots';
        }

        let { data, error } = await supabase
            .from(tableName)
            .select(selectFields)
            .in('date', dates);

        if (error) {
            console.error('Error fetching data:', error);
            return;
        }
        console.log("Data:", data);
        let ticketsPerDayMap = {};
        let totalBookedTimeSlots = 0;
        let totalPossibleTimeSlots = 0;
        let totalTicketsSold = 0;
        let totalPossibleTickets = 0;

        data.forEach(record => {
            if (tableName.includes("escapegame")) {
                let dailyTicketsSold = 0;
                let dailyTotalTimeSlots = 0;
                let dailyBookedTimeSlots = 0;
                const games = record.timeSlots;
                let totalTickets = 0;
                for (const gameId in games) {
                    const timeSlots = games[gameId].timeSlots;
                    totalTickets = games[gameId].totalTickets;
                    for (const tickets of Object.values(timeSlots)) {
                        dailyTicketsSold += totalTickets - tickets;
                        dailyTotalTimeSlots++;
                        if (tickets < totalTickets) {
                            dailyBookedTimeSlots++;
                        }
                    }
                }
                ticketsPerDayMap[record.date] = dailyTicketsSold;
                totalBookedTimeSlots += dailyBookedTimeSlots;
                totalPossibleTimeSlots += dailyTotalTimeSlots;
                totalTicketsSold += dailyTicketsSold;
                totalPossibleTickets += dailyTotalTimeSlots * totalTickets;
            } else {
                let dailyTicketsSold = 0;
                let dailyTotalTimeSlots = 0;
                let dailyBookedTimeSlots = 0;
                const timeSlots = record.timeSlots;
                const ticketsPerTime = record.ticketsPerTime;
                Object.values(timeSlots).forEach(tickets => {
                    dailyTicketsSold += ticketsPerTime - tickets;
                    dailyTotalTimeSlots++;
                    if (tickets < ticketsPerTime) {
                        dailyBookedTimeSlots++;
                    }
                });
                ticketsPerDayMap[record.date] = dailyTicketsSold;
                totalBookedTimeSlots += dailyBookedTimeSlots;
                totalPossibleTimeSlots += dailyTotalTimeSlots;
                totalTicketsSold += dailyTicketsSold;
                totalPossibleTickets += dailyTotalTimeSlots * ticketsPerTime;
            }
        });

        let tickets = dates.map(date => ticketsPerDayMap[date] || 0);
        let averagePercentageBooked = (totalBookedTimeSlots / totalPossibleTimeSlots) * 100;
        let averageCapacityBooked = (totalTicketsSold / totalPossibleTickets) * 100;
        const revenue = totalTicketsSold * price;
        document.getElementById("totalSales").innerHTML = "Total Sales: " + totalTicketsSold;
        document.getElementById("revenue").innerHTML = `Estimated Revenue: $${revenue}` + ' | @ $' + price;
        document.getElementById("percentageBooked").innerHTML = 'Avergae Slots Booked: ' + averagePercentageBooked.toFixed(2) + '%' + ' | ' + totalBookedTimeSlots + '/' + totalPossibleTimeSlots;
        document.getElementById("capacityBooked").innerHTML = 'Avergae Capacity Booked: ' + averageCapacityBooked.toFixed(2) + '%' + ' | ' + totalTicketsSold + '/' + totalPossibleTickets;

        setLabels(labels);
        setDataset(tickets);

        const startDateStr = dates[0];
        const endDateStr = dates[dates.length - 1];
        const [startYear, startMonth, startDay] = startDateStr.split('-');
        const formattedStartDate = new Date(startYear, startMonth - 1, startDay).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
        const [endYear, endMonth, endDay] = endDateStr.split('-');
        const formattedEndDate = new Date(endYear, endMonth - 1, endDay).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
        const title = `${formattedStartDate} - ${formattedEndDate}`;

        changeTitle(title);
        window.showDateSelection();
    }

    async function getMonthlyData(supabase, tableName, dateStr) {
        let currentLabels = [];
        let startDate = new Date(dateStr);
        startDate = new Date(startDate.getTime() + startDate.getTimezoneOffset() * 60000); // Adjust for local timezone
        const startOfMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1); // Get the first date of the current month
        const endOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0); // Get the last date of the current month
        let labels = [];
        let dates = [];

        for (let date = new Date(startOfMonth); date <= endOfMonth; date.setDate(date.getDate() + 1)) {
            labels.push(formatDateToYMD(date));
            dates.push(formatDateToYMD(date));
        }

        let selectFields = 'date, ticketsPerTime, timeSlots';
        if (tableName.includes("escapegame")) {
            selectFields = 'date, timeSlots';
        }
        console.log("Select Fields:", selectFields);
        let { data, error } = await supabase
            .from(tableName)
            .select(selectFields)
            .in('date', dates);

        if (error) {
            console.error('Error fetching data:', error);
            return;
        }

        let ticketsPerDayMap = {};
        let totalBookedTimeSlots = 0;
        let totalPossibleTimeSlots = 0;
        let totalTicketsSold = 0;
        let totalPossibleTickets = 0;

        data.forEach(record => {
            if (tableName.includes("escapegame")) {
                let dailyTicketsSold = 0;
                let dailyTotalTimeSlots = 0;
                let dailyBookedTimeSlots = 0;
                let totalTickets = 0;
                const games = record.timeSlots;
                for (const gameId in games) {
                    const timeSlots = games[gameId].timeSlots;
                    totalTickets = games[gameId].totalTickets;
                    for (const tickets of Object.values(timeSlots)) {
                        dailyTicketsSold += totalTickets - tickets;
                        dailyTotalTimeSlots++;
                        if (tickets < totalTickets) {
                            dailyBookedTimeSlots++;
                        }
                    }
                }
                ticketsPerDayMap[record.date] = dailyTicketsSold;
                totalBookedTimeSlots += dailyBookedTimeSlots;
                totalPossibleTimeSlots += dailyTotalTimeSlots;
                totalTicketsSold += dailyTicketsSold;
                totalPossibleTickets += dailyTotalTimeSlots * totalTickets;
            } else {
                let dailyTicketsSold = 0;
                let dailyTotalTimeSlots = 0;
                let dailyBookedTimeSlots = 0;
                const timeSlots = record.timeSlots;
                const ticketsPerTime = record.ticketsPerTime;
                Object.values(timeSlots).forEach(tickets => {
                    dailyTicketsSold += ticketsPerTime - tickets;
                    dailyTotalTimeSlots++;
                    if (tickets < ticketsPerTime) {
                        dailyBookedTimeSlots++;
                    }
                });
                ticketsPerDayMap[record.date] = dailyTicketsSold;
                totalBookedTimeSlots += dailyBookedTimeSlots;
                totalPossibleTimeSlots += dailyTotalTimeSlots;
                totalTicketsSold += dailyTicketsSold;
                totalPossibleTickets += dailyTotalTimeSlots * ticketsPerTime;
            }
        });

        let tickets = dates.map(date => ticketsPerDayMap[date] || 0);
        let averagePercentageBooked = (totalBookedTimeSlots / totalPossibleTimeSlots) * 100;
        let averageCapacityBooked = (totalTicketsSold / totalPossibleTickets) * 100;
        const revenue = totalTicketsSold * price;
        document.getElementById("totalSales").innerHTML = "Total Sales: " + totalTicketsSold;
        document.getElementById("revenue").innerHTML = `Estimated Revenue: $${revenue}` + ' | @ $' + price;
        document.getElementById("percentageBooked").innerHTML = 'Average Slots Booked: ' + averagePercentageBooked.toFixed(2) + '%' + ' | ' + totalBookedTimeSlots + '/' + totalPossibleTimeSlots;
        document.getElementById("capacityBooked").innerHTML = 'Average Capacity Booked: ' + averageCapacityBooked.toFixed(2) + '%' + ' | ' + totalTicketsSold + '/' + totalPossibleTickets;

        setLabels(labels);
        setDataset(tickets);
        const formattedMonth = startDate.toLocaleString('default', { month: 'long' });
        changeTitle(formattedMonth);
        window.showMonthSelection();
    }
    window.updateData = function (dateStr) {
        // Ensure the date string is in YYYY-MM-DD format
        let dateParts;
        if (dateStr.length === 7) { // Handle YYYY-MM format
            dateParts = dateStr.split('-');
            dateParts.push('01'); // Add day 1 to make it YYYY-MM-DD
        } else {
            dateParts = dateStr.split('-');
        }

        // Create the date object with UTC to avoid timezone issues
        currentDate = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
        currentDate = new Date(currentDate.getTime() + currentDate.getTimezoneOffset() * 60000); // Adjust for local timezone      
        if (currentSelection === "daily") {
            getDailyData(supabase, tableName, dateStr);
        } else if (currentSelection === "weekly") {
            getWeeklyData(supabase, tableName, dateStr);
        } else if (currentSelection === "monthly") {
            getMonthlyData(supabase, tableName, dateStr);
        }
    }




    // ### GOOGLE REVIEWS FUNCTIONALITY ###
    // async function fetchReviews() {
    //     let placeId = getData('placeId');
    //     const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews&key=${googleApiKey}`;
    //     const response = await fetch(url);
    //     const data = await response.json();
    //     return data.result.reviews;
    // }

    // function displayReviews(reviews) {
    //     const reviewsContainer = document.getElementById('reviews');
    //     reviewsContainer.innerHTML = '';
    //     reviews.forEach(review => {
    //         const reviewElement = document.createElement('div');
    //         reviewElement.classList.add('review');
    //         reviewElement.innerHTML = `
    //             <h3>${review.author_name}</h3>
    //             <p>Rating: ${review.rating}</p>
    //             <p>${review.text}</p>
    //         `;
    //         reviewsContainer.appendChild(reviewElement);
    //     });
    // }



    // ### MAP FUNCTIONALITY ###
    const address = getData('address'); // Assuming getData('address') retrieves your address
    console.log('Updating Address:' + address);

    async function getCoordinates(address) {
        // Simplify the address by removing complex parts and formatting
        // const simplifiedAddress = address.split(',').slice(0, 2).join(','); // Use the first two parts of the address
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address.trim())}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('API Response Data:', data); // Log the full response data for debugging
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon)
                };
            } else {
                throw new Error('Address not found in response data');
            }
        } catch (error) {
            console.error('Error fetching coordinates:', error.message);
            throw error;
        }
    }

    try {
        const coords = await getCoordinates(address);
        console.log('Coordinates:', coords);

        var map = L.map('map').setView([coords.lat, coords.lon], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
        }).addTo(map);

        var marker = L.marker([coords.lat, coords.lon]).addTo(map);
        marker.bindPopup(`<b>${locationName}</b>`).openPopup();

    } catch (error) {
        console.error('Error fetching coordinates:', error);
    }

});
