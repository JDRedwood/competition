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

    document.getElementById("location-name").innerHTML = locationName;

    console.log("Fetching data from Supabase...");
    console.log("Table Name:", tableName);
    console.log("Location Name:", locationName);
    console.log("Link:", link);


    // Update the header link
    const headerLink = document.querySelector('#header a');
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
        let { data, error } = await supabase
            .from(tableName)
            .select('timeSlots, ticketsPerTime, ticketsPerDay')
            .eq('date', currentDate);

        if (error) {
            console.error('Error fetching data:', error);
        } else {
            // console.log('Data fetched:', data);
            // Assuming only one record per date
            if (data.length > 0) {
                const timeSlots = data[0].timeSlots;
                const ticketsPerTime = data[0].ticketsPerTime;
                const ticketsPerDay = data[0].ticketsPerDay;

                currentLabels = Object.keys(timeSlots);

                let tickets = [];
                for (const timeSlot in timeSlots) {
                    let ticketsAvailable = timeSlots[timeSlot];
                    let ticketMax = ticketsPerTime;
                    if (ticketsAvailable > ticketsPerTime){
                        ticketMax = ticketMax * 2;
                    }
                    let ticketsSold = ticketMax - ticketsAvailable;
                    tickets.push(ticketsSold);
                }

                let totalTicketsSold = tickets.reduce((total, ticket) => total + ticket, 0);
                // console.log("Total Tickets Sold:", totalTicketsSold);

                document.getElementById("totalSales").innerHTML = totalTicketsSold;

                setLabels(currentLabels);
                setDataset(tickets);
                const [year, month, day] = currentDate.split('-');
                const formattedDate = new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                changeTitle(formattedDate);
                window.showDateSelection();
            }
        }

    }

    async function getWeeklyData(supabase, tableName, newDate) {
        let currentLabels = [];
        const currentDate = new Date(newDate); // Ensure currentDate is a Date object

        let labels = [];
        let dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentDate);
            date.setDate(currentDate.getDate() + i);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'long' }));
            dates.push(date.toISOString().split('T')[0]);
        }

        let { data, error } = await supabase
            .from(tableName)
            .select('date, ticketsPerTime, timeSlots')
            .in('date', dates);

        if (error) {
            console.error('Error fetching data:', error);
        } else {
            console.log('Data fetched:', data);
            let ticketsPerDayMap = {};
            let maxTicketsPerDay = 0;
            data.forEach(record => {
                let totalTicketsAvailable = 0;
                Object.values(record.timeSlots).forEach(tickets => {
                    totalTicketsAvailable += tickets;
                });

                let ticketsSold = (record.ticketsPerTime * Object.keys(record.timeSlots).length) - totalTicketsAvailable;
                ticketsPerDayMap[record.date] = ticketsSold;

                maxTicketsPerDay = record.ticketsPerDay;
            });

            let tickets = dates.map(date => ticketsPerDayMap[date] || 0);

            let totalTicketsSold = tickets.reduce((total, ticket) => total + ticket, 0);
            console.log("Total Tickets Sold:", totalTicketsSold);

            document.getElementById("totalSales").innerHTML = totalTicketsSold;

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

    }

    async function getMonthlyData(supabase, tableName, dateStr) {
        const currentDate = new Date(dateStr);
        let currentLabels = [];

        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // Get the first date of the current month
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Get the last date of the current month

        let labels = [];
        let dates = [];
        for (let date = new Date(startOfMonth); date <= endOfMonth; date.setDate(date.getDate() + 1)) {
            labels.push(formatDateToYMD(date));
            dates.push(formatDateToYMD(date));
        }

        let { data, error } = await supabase
            .from(tableName)
            .select('date, ticketsPerTime, timeSlots')
            .in('date', dates);

        if (error) {
            console.error('Error fetching data:', error);
        } else {
            console.log('Data fetched:', data);
            let ticketsPerDayMap = {};
            data.forEach(record => {
                let totalTicketsAvailable = 0;
                Object.values(record.timeSlots).forEach(tickets => {
                    totalTicketsAvailable += tickets;
                });
                let ticketsSold = (record.ticketsPerTime * Object.keys(record.timeSlots).length) - totalTicketsAvailable;
                ticketsPerDayMap[record.date] = ticketsSold;
            });

            let tickets = dates.map(date => ticketsPerDayMap[date] || 0);

            let totalTicketsSold = tickets.reduce((total, ticket) => total + ticket, 0);
            console.log("Total Tickets Sold:", totalTicketsSold);

            document.getElementById("totalSales").innerHTML = totalTicketsSold;

            setLabels(labels);
            setDataset(tickets);
            const formattedMonth = currentDate.toLocaleString('default', { month: 'long' });
            changeTitle(formattedMonth);
            window.showMonthSelection();
        }

    }

    window.updateData = function (dateStr) {
        console.log("Updating data for date:", dateStr);
        const date = dateStr; // Keep date as a string in YYYY-MM-DD format
        if (currentSelection === "daily") {
            getDailyData(supabase, tableName, date);
        } else if (currentSelection === "weekly") {
            getWeeklyData(supabase, tableName, date);
        } else if (currentSelection === "monthly") {
            getMonthlyData(supabase, tableName, date);
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

    async function getCoordinates(address) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
        } else {
            throw new Error('Address not found');
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
