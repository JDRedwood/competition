import { setData, getData } from './data.js';
import { setLabels, setDataset, changeTitle, changeYAxis, clearDatasets } from './charts.js';

document.addEventListener('DOMContentLoaded', async function () {
    const googleApiKey = 'AIzaSyAhH_VUgkhoPPUWp7GgTauSN_gx_cwrdhc';
    const supabaseUrl = 'https://hxllvaanqbfydeqkxpng.supabase.co';
    const supabaseKey = 'sb_publishable_3JDTmTI7Bkoe-0GaviGu1g_OyxsvCzU';
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
        clearDatasets();
        const currentDate = dateStr;
        console.log("CurrentDate: " + currentDate);
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

                    document.getElementById("totalTickets").innerHTML = "Total Tickets: " + totalTicketsSold;

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
        } else if (tableName.includes("level99")) {
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
                    let soldOutTickets = [];
                    let totalTimeSlots = 0;
                    let bookedTimeSlots = 0;
                    let totalTicketsSold = 0;
                    let totalPossibleTickets = 0;
                    let soldOutSlots = 0;

                    // First pass: identify sold-out slots and create datasets
                    for (const timeSlot in timeSlots) {
                        let ticketsAvailable = timeSlots[timeSlot];
                        let ticketMax = ticketsPerTime;
                        if (ticketsAvailable > ticketsPerTime) {
                            ticketMax = ticketMax * 2;
                        }
                        let ticketsSold = ticketMax - ticketsAvailable;
                        
                        // Check if this is a sold-out slot (ticketsAvailable = 0)
                        if (ticketsAvailable === 0) {
                            soldOutTickets.push(ticketsSold);
                            tickets.push(null); // Use null for sold-out slots in main dataset
                            soldOutSlots++;
                        } else {
                            soldOutTickets.push(null); // Use null for non-sold-out slots in sold-out dataset
                        tickets.push(ticketsSold);
                        }

                        totalTimeSlots++;
                        totalPossibleTickets += ticketMax;
                        
                        // Only count non-sold-out slots in totals
                        if (ticketsAvailable > 0) {
                            totalTicketsSold += ticketsSold;
                        if (ticketsSold > 0) {
                            bookedTimeSlots++;
                            }
                        }
                    }

                    document.getElementById("totalTickets").innerHTML = "Total Tickets: " + totalTicketsSold + ` (${soldOutSlots} sold-out slots excluded)`;

                    setLabels(currentLabels);
                    
                    // Add main dataset (normal slots)
                    setDataset(tickets, 'Regular Sales', 'rgba(54, 162, 235, 0.8)');
                    
                    // Add sold-out dataset (red color)
                    setDataset(soldOutTickets, 'Sold Out Slots', 'rgba(220, 53, 69, 0.8)');

                    const [year, month, day] = currentDate.split('-');
                    const formattedDate = new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    changeTitle(formattedDate);
                    window.showDateSelection();

                    // Calculate the percentage of time slots that had a booking (excluding sold-out)
                    const percentageBooked = (bookedTimeSlots / (totalTimeSlots - soldOutSlots)) * 100;
                    // Calculate the capacity booked percentage (excluding sold-out)
                    const capacityBooked = (totalTicketsSold / (totalPossibleTickets - (soldOutSlots * ticketsPerTime))) * 100;
                    const revenue = totalTicketsSold * price;
                    document.getElementById("revenue").innerHTML = `Estimated Revenue: $${revenue}` + ' | @ $' + price;
                    document.getElementById("percentageBooked").innerHTML = 'Time Slots Booked: ' + percentageBooked.toFixed(2) + '%' + ' | ' + bookedTimeSlots + '/' + (totalTimeSlots - soldOutSlots);
                    document.getElementById("capacityBooked").innerHTML = 'Total Capacity Booked: ' + capacityBooked.toFixed(2) + '%' + ' | ' + totalTicketsSold + '/' + (totalPossibleTickets - (soldOutSlots * ticketsPerTime));

                }
            }
        } else if (tableName.includes("bodaborg")) {
            let { data, error } = await supabase
                .from(tableName)
                .select('date, timeSlots')
                .eq('date', currentDate);
    
            if (error) {
                console.error('Error fetching data:', error);
                return;
            }
    
            let tickets2HrSold = [];
            let tickets4HrSold = [];
            let tickets2HrTickets = 0;
            let tickets4HrTickets = 0;
            let totalTicketsSoldCount = 0;
            let totalPossibleTickets = 0;
            let revenue = 0;
    
            data.forEach(record => {
                const timeSlots = record.timeSlots;
                currentLabels = Object.keys(timeSlots);  // Ensure labels are defined
    
                for (const timeSlot in timeSlots) {
                    const [sold2Hr, sold4Hr, available2Hr, available4Hr] = timeSlots[timeSlot].split(', ').map(Number);
    
                    tickets2HrSold.push(sold2Hr);
                    tickets4HrSold.push(sold4Hr);
                    tickets2HrTickets += sold2Hr;
                    tickets4HrTickets += sold4Hr;
    
                    totalTicketsSoldCount += (sold2Hr + sold4Hr);
                    totalPossibleTickets += (available2Hr + available4Hr);
    
                    revenue += (sold2Hr * 28) + (sold4Hr * 40);
                }
            });
    
            // Update the new spans
            document.getElementById("revenue").innerHTML = `Estimated Revenue: $${revenue}`;
            document.getElementById("totalTickets").innerHTML = `Total Tickets: ${totalTicketsSoldCount}`;
            document.getElementById("total2HrTickets").innerHTML = `Total 2-Hour Tickets: ${tickets2HrTickets}`;
            document.getElementById("total4HrTickets").innerHTML = `Total 4-Hour Tickets: ${tickets4HrTickets}`;
    
            setLabels(currentLabels);  // Use currentLabels here
            setDataset(tickets2HrSold, '2-Hour Tickets Sold', 'rgba(255, 100, 100, 0.6)');
            setDataset(tickets4HrSold, '4-Hour Tickets Sold', 'rgba(128, 92, 255, 0.6)');
        } else if (tableName.includes("brkthrough")) {
            let { data, error } = await supabase
                .from(tableName)
                .select('date, timeSlots')
                .eq('date', currentDate);
    
            if (error) {
                console.error('Error fetching data:', error);
                return;
            }
    
            let tickets2HrSold = [];
            let tickets4HrSold = [];
            let tickets2HrTickets = 0;
            let tickets4HrTickets = 0;
            let totalTicketsSoldCount = 0;
            let totalPossibleTickets = 0;
            let revenue = 0;
    
            data.forEach(record => {
                const timeSlots = record.timeSlots;
                currentLabels = Object.keys(timeSlots);  // Ensure labels are defined
    
                for (const timeSlot in timeSlots) {
                    const [sold2Hr, sold4Hr, available2Hr, available4Hr] = timeSlots[timeSlot].split(', ').map(Number);
    
                    tickets2HrSold.push(sold2Hr);
                    tickets4HrSold.push(sold4Hr);
                    tickets2HrTickets += sold2Hr;
                    tickets4HrTickets += sold4Hr;
    
                    totalTicketsSoldCount += (sold2Hr + sold4Hr);
                    totalPossibleTickets += (available2Hr + available4Hr);
    
                    revenue += (sold2Hr * 28) + (sold4Hr * 40);
                }
            });
    
            // Update the new spans
            document.getElementById("revenue").innerHTML = `Estimated Revenue: $${revenue}`;
            document.getElementById("totalTickets").innerHTML = `Total Tickets: ${totalTicketsSoldCount}`;
            document.getElementById("total2HrTickets").innerHTML = `Total 2-Hour Tickets: ${tickets2HrTickets}`;
            document.getElementById("total4HrTickets").innerHTML = `Total 4-Hour Tickets: ${tickets4HrTickets}`;
    
            setLabels(currentLabels);  // Use currentLabels here
            setDataset(tickets2HrSold, '2-Hour Tickets Sold', 'rgba(255, 100, 100, 0.6)');
            setDataset(tickets4HrSold, '4-Hour Tickets Sold', 'rgba(128, 92, 255, 0.6)');
        }
    }

    async function getWeeklyData(supabase, tableName, newDate) {
        clearDatasets();
        let currentLabels = [];
        let labels = [];
        let dates = [];
        const currentDate = new Date(newDate);
    
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentDate);
            date.setDate(currentDate.getDate() + i);
            
            // Generate label for each day of the week
            labels.push(date.toLocaleDateString('en-US', { weekday: 'long' }));
            dates.push(date.toISOString().split('T')[0]);
        }
    
        let selectFields = 'date, ticketsPerTime, timeSlots';
        if (tableName.includes("escapegame")) {
            selectFields = 'date, timeSlots';
        } else if (tableName.includes("bodaborg")) {
            selectFields = 'date, timeSlots';
        } else if (tableName.includes("brkthrough")) {
            selectFields = 'date, timeSlots';
        } else if (tableName.includes("level99")){
            selectFields = 'date, ticketsPerTime, timeSlots';
        }
    
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
        let totalTickets2HrSold = 0;
        let totalTickets4HrSold = 0;
        let totalSoldOutSlots = 0;
        let revenue = 0;
    
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
                let tickets = dates.map(date => ticketsPerDayMap[date] || 0);
            let averagePercentageBooked = (totalBookedTimeSlots / totalPossibleTimeSlots) * 100;
            let averageCapacityBooked = (totalTicketsSold / totalPossibleTickets) * 100;
            const revenue = totalTicketsSold * price;
            document.getElementById("totalTickets").innerHTML = "Total Tickets: " + totalTicketsSold;
            document.getElementById('total2HrTickets').style.display = 'none';
            document.getElementById('total4HrTickets').style.display = 'none';
            document.getElementById("revenue").innerHTML = `Estimated Revenue: $${revenue} | @ $${price}`;
            document.getElementById("percentageBooked").innerHTML = 'Average Slots Booked: ' + averagePercentageBooked.toFixed(2) + '%' + ' | ' + totalBookedTimeSlots + '/' + totalPossibleTimeSlots;
            document.getElementById("capacityBooked").innerHTML = 'Average Capacity Booked: ' + averageCapacityBooked.toFixed(2) + '%' + ' | ' + totalTicketsSold + '/' + totalPossibleTickets;
            setLabels(labels);
            setDataset(tickets);

            } else if (tableName.includes("level99")) {

                let dailyTicketsSold = 0;
                let dailyTotalTimeSlots = 0;
                let dailyBookedTimeSlots = 0;
                let dailySoldOutSlots = 0;
                const timeSlots = record.timeSlots;
                const ticketsPerTime = record.ticketsPerTime;
                Object.values(timeSlots).forEach(tickets => {
                    dailyTotalTimeSlots++;
                    if (tickets === 0) {
                        // This is a sold-out slot
                        dailySoldOutSlots++;
                    } else {
                        // Only count non-sold-out slots
                        dailyTicketsSold += ticketsPerTime - tickets;
                    if (tickets < ticketsPerTime) {
                        dailyBookedTimeSlots++;
                        }
                    }
                });
                ticketsPerDayMap[record.date] = dailyTicketsSold;
                totalBookedTimeSlots += dailyBookedTimeSlots;
                totalPossibleTimeSlots += dailyTotalTimeSlots;
                totalTicketsSold += dailyTicketsSold;
                totalPossibleTickets += dailyTotalTimeSlots * ticketsPerTime;
                totalSoldOutSlots += dailySoldOutSlots;
                let tickets = dates.map(date => ticketsPerDayMap[date] || 0);
                let averagePercentageBooked = (totalBookedTimeSlots / (totalPossibleTimeSlots - totalSoldOutSlots)) * 100;
                let averageCapacityBooked = (totalTicketsSold / (totalPossibleTickets - (totalSoldOutSlots * ticketsPerTime))) * 100;
                const revenue = totalTicketsSold * price;
                document.getElementById("totalTickets").innerHTML = "Total Tickets: " + totalTicketsSold + ` (${totalSoldOutSlots} sold-out slots excluded)`;
                document.getElementById('total2HrTickets').style.display = 'none';
                document.getElementById('total4HrTickets').style.display = 'none';
                document.getElementById("revenue").innerHTML = `Estimated Revenue: $${revenue} | @ $${price}`;
                document.getElementById("percentageBooked").innerHTML = 'Average Slots Booked: ' + averagePercentageBooked.toFixed(2) + '%' + ' | ' + totalBookedTimeSlots + '/' + (totalPossibleTimeSlots - totalSoldOutSlots);
                document.getElementById("capacityBooked").innerHTML = 'Average Capacity Booked: ' + averageCapacityBooked.toFixed(2) + '%' + ' | ' + totalTicketsSold + '/' + (totalPossibleTickets - (totalSoldOutSlots * ticketsPerTime));
                setLabels(labels);
                setDataset(tickets);

            } else if (tableName.includes("bodaborg")) {
                let tickets2HrSold = [];
                let tickets4HrSold = [];
                let dailyTickets2HrSold = 0;
                let dailyTickets4HrSold = 0;
                let totalTickets2HrSold = 0;
                let totalTickets4HrSold = 0;
                let totalTicketsSold = 0;
                let totalBookedTimeSlots = 0;
                let totalPossibleTimeSlots = 0;
                let totalPossibleTickets = 0;
                let revenue = 0;
                let ticketsPerDayMap = {};
            
                data.forEach(record => {
                    const timeSlots = record.timeSlots;
                    let dailyTotalSold = 0;
                    let dailyBookedTimeSlots = 0;
                    let dailyPossibleTimeSlots = 0;
            
                    for (const timeSlot in timeSlots) {
                        const [sold2Hr, sold4Hr, available2Hr, available4Hr] = timeSlots[timeSlot].split(', ').map(Number);
            
                        dailyTickets2HrSold = sold2Hr;
                        dailyTickets4HrSold = sold4Hr;
                        tickets2HrSold.push(dailyTickets2HrSold);
                        tickets4HrSold.push(dailyTickets4HrSold);
            
                        dailyTotalSold += sold2Hr + sold4Hr;
            
                        if (sold2Hr > 0 || sold4Hr > 0) {
                            dailyBookedTimeSlots++; // Increment if any tickets were sold in this time slot
                        }
            
                        dailyPossibleTimeSlots++;
                        totalPossibleTickets += available2Hr + available4Hr;
                    }
            
                    revenue += (dailyTickets2HrSold * 28) + (dailyTickets4HrSold * 40);
                    totalTickets2HrSold += dailyTickets2HrSold;
                    totalTickets4HrSold += dailyTickets4HrSold;
                    totalTicketsSold += dailyTotalSold;
            
                    totalBookedTimeSlots += dailyBookedTimeSlots;
                    totalPossibleTimeSlots += dailyPossibleTimeSlots;
            
                    ticketsPerDayMap[record.date] = dailyTotalSold;
                });
            
                let averagePercentageBooked = (totalBookedTimeSlots / totalPossibleTimeSlots) * 100;
                let averageCapacityBooked = (totalTicketsSold / totalPossibleTickets) * 100;
                let tickets = dates.map(date => ticketsPerDayMap[date] || 0);

                document.getElementById("totalTickets").innerHTML = "Total Tickets: " + totalTicketsSold;
                document.getElementById('total2HrTickets').style.display = 'block';
                document.getElementById('total4HrTickets').style.display = 'block';
                document.getElementById("revenue").innerHTML = `Estimated Revenue: $${revenue}`;
                document.getElementById('total2HrTickets').innerHTML = `Total 2-Hour Tickets: ${totalTickets2HrSold}`;
                document.getElementById('total4HrTickets').innerHTML = `Total 4-Hour Tickets: ${totalTickets4HrSold}`;
                document.getElementById("percentageBooked").innerHTML = 'Average Slots Booked: ' + averagePercentageBooked.toFixed(2) + '%' + ' | ' + totalBookedTimeSlots + '/' + totalPossibleTimeSlots;
                document.getElementById("capacityBooked").innerHTML = 'Average Capacity Booked: ' + averageCapacityBooked.toFixed(2) + '%' + ' | ' + totalTicketsSold + '/' + totalPossibleTickets;
            
                setLabels(labels);  // Use labels from the earlier loop
                setDataset(tickets2HrSold, '2-Hour Tickets Sold', 'rgba(255, 100, 100, 0.6)');
                setDataset(tickets4HrSold, '4-Hour Tickets Sold', 'rgba(128, 92, 255, 0.6)');
            } else if (tableName.includes("brkthrough")) {
                let tickets2HrSold = [];
                let tickets4HrSold = [];
                let dailyTickets2HrSold = 0;
                let dailyTickets4HrSold = 0;
                let totalTickets2HrSold = 0;
                let totalTickets4HrSold = 0;
                let totalTicketsSold = 0;
                let totalBookedTimeSlots = 0;
                let totalPossibleTimeSlots = 0;
                let totalPossibleTickets = 0;
                let revenue = 0;
                let ticketsPerDayMap = {};
            
                data.forEach(record => {
                    const timeSlots = record.timeSlots;
                    let dailyTotalSold = 0;
                    let dailyBookedTimeSlots = 0;
                    let dailyPossibleTimeSlots = 0;
            
                    for (const timeSlot in timeSlots) {
                        const [sold2Hr, sold4Hr, available2Hr, available4Hr] = timeSlots[timeSlot].split(', ').map(Number);
            
                        dailyTickets2HrSold = sold2Hr;
                        dailyTickets4HrSold = sold4Hr;
                        tickets2HrSold.push(dailyTickets2HrSold);
                        tickets4HrSold.push(dailyTickets4HrSold);
            
                        dailyTotalSold += sold2Hr + sold4Hr;
            
                        if (sold2Hr > 0 || sold4Hr > 0) {
                            dailyBookedTimeSlots++; // Increment if any tickets were sold in this time slot
                        }
            
                        dailyPossibleTimeSlots++;
                        totalPossibleTickets += available2Hr + available4Hr;
                    }
            
                    revenue += (dailyTickets2HrSold * 28) + (dailyTickets4HrSold * 40);
                    totalTickets2HrSold += dailyTickets2HrSold;
                    totalTickets4HrSold += dailyTickets4HrSold;
                    totalTicketsSold += dailyTotalSold;
            
                    totalBookedTimeSlots += dailyBookedTimeSlots;
                    totalPossibleTimeSlots += dailyPossibleTimeSlots;
            
                    ticketsPerDayMap[record.date] = dailyTotalSold;
                });
            
                let averagePercentageBooked = (totalBookedTimeSlots / totalPossibleTimeSlots) * 100;
                let averageCapacityBooked = (totalTicketsSold / totalPossibleTickets) * 100;
                let tickets = dates.map(date => ticketsPerDayMap[date] || 0);

                document.getElementById("totalTickets").innerHTML = "Total Tickets: " + totalTicketsSold;
                document.getElementById('total2HrTickets').style.display = 'block';
                document.getElementById('total4HrTickets').style.display = 'block';
                document.getElementById("revenue").innerHTML = `Estimated Revenue: $${revenue}`;
                document.getElementById('total2HrTickets').innerHTML = `Total 2-Hour Tickets: ${totalTickets2HrSold}`;
                document.getElementById('total4HrTickets').innerHTML = `Total 4-Hour Tickets: ${totalTickets4HrSold}`;
                document.getElementById("percentageBooked").innerHTML = 'Average Slots Booked: ' + averagePercentageBooked.toFixed(2) + '%' + ' | ' + totalBookedTimeSlots + '/' + totalPossibleTimeSlots;
                document.getElementById("capacityBooked").innerHTML = 'Average Capacity Booked: ' + averageCapacityBooked.toFixed(2) + '%' + ' | ' + totalTicketsSold + '/' + totalPossibleTickets;
            
                setLabels(labels);  // Use labels from the earlier loop
                setDataset(tickets2HrSold, '2-Hour Tickets Sold', 'rgba(255, 100, 100, 0.6)');
                setDataset(tickets4HrSold, '4-Hour Tickets Sold', 'rgba(128, 92, 255, 0.6)');
            }
        });
    
        
    
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
        clearDatasets();
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
        } else if (tableName.includes("bodaborg")) {
            selectFields = 'date, timeSlots';
        } else if (tableName.includes("brkthrough")) {
            selectFields = 'date, timeSlots';
        } else if (tableName.includes("level99")) {
            selectFields = 'date, ticketsPerTime, timeSlots';
        }
    
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
        let totalTickets2HrSold = 0;
        let totalTickets4HrSold = 0;
        let totalSoldOutSlots = 0;
        let revenue = 0;
    
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

                let tickets = dates.map(date => ticketsPerDayMap[date] || 0);
                let averagePercentageBooked = (totalBookedTimeSlots / totalPossibleTimeSlots) * 100;
                let averageCapacityBooked = (totalTicketsSold / totalPossibleTickets) * 100;
                const revenue = totalTicketsSold * price;

                document.getElementById("totalTickets").innerHTML = "Total Tickets: " + totalTicketsSold;
                document.getElementById("revenue").innerHTML = `Estimated Revenue: $${revenue} | @ $${price}`;
                document.getElementById("percentageBooked").innerHTML = 'Average Slots Booked: ' + averagePercentageBooked.toFixed(2) + '%' + ' | ' + totalBookedTimeSlots + '/' + totalPossibleTimeSlots;
                document.getElementById("capacityBooked").innerHTML = 'Average Capacity Booked: ' + averageCapacityBooked.toFixed(2) + '%' + ' | ' + totalTicketsSold + '/' + totalPossibleTickets;
                document.getElementById('total2HrTickets').style.display = 'none';
                document.getElementById('total4HrTickets').style.display = 'none';

                tickets = dates.map(date => ticketsPerDayMap[date] || 0);
                // Calculate the average percentage booked and capacity booked
                averagePercentageBooked = (totalBookedTimeSlots / totalPossibleTimeSlots) * 100;
                averageCapacityBooked = (totalTicketsSold / totalPossibleTickets) * 100;
                document.getElementById("percentageBooked").innerHTML = 'Average Slots Booked: ' + averagePercentageBooked.toFixed(2) + '%' + ' | ' + totalBookedTimeSlots + '/' + totalPossibleTimeSlots;
                document.getElementById("capacityBooked").innerHTML = 'Average Capacity Booked: ' + averageCapacityBooked.toFixed(2) + '%' + ' | ' + totalTicketsSold + '/' + totalPossibleTickets;
                setLabels(labels);
                setDataset(tickets);


            } else if (tableName.includes("level99")) {

                let dailyTicketsSold = 0;
                let dailyTotalTimeSlots = 0;
                let dailyBookedTimeSlots = 0;
                let dailySoldOutSlots = 0;
                const timeSlots = record.timeSlots;
                const ticketsPerTime = record.ticketsPerTime;
                Object.values(timeSlots).forEach(tickets => {
                    dailyTotalTimeSlots++;
                    if (tickets === 0) {
                        // This is a sold-out slot
                        dailySoldOutSlots++;
                    } else {
                        // Only count non-sold-out slots
                        dailyTicketsSold += ticketsPerTime - tickets;
                    if (tickets < ticketsPerTime) {
                        dailyBookedTimeSlots++;
                        }
                    }
                });
                ticketsPerDayMap[record.date] = dailyTicketsSold;
                totalBookedTimeSlots += dailyBookedTimeSlots;
                totalPossibleTimeSlots += dailyTotalTimeSlots;
                totalTicketsSold += dailyTicketsSold;
                totalPossibleTickets += dailyTotalTimeSlots * ticketsPerTime;
                totalSoldOutSlots += dailySoldOutSlots;

                let tickets = dates.map(date => ticketsPerDayMap[date] || 0);
                let averagePercentageBooked = (totalBookedTimeSlots / (totalPossibleTimeSlots - totalSoldOutSlots)) * 100;
                let averageCapacityBooked = (totalTicketsSold / (totalPossibleTickets - (totalSoldOutSlots * ticketsPerTime))) * 100;
                const revenue = totalTicketsSold * price;

                document.getElementById("totalTickets").innerHTML = "Total Tickets: " + totalTicketsSold + ` (${totalSoldOutSlots} sold-out slots excluded)`;
                document.getElementById("revenue").innerHTML = `Estimated Revenue: $${revenue} | @ $${price}`;
                document.getElementById("percentageBooked").innerHTML = 'Average Slots Booked: ' + averagePercentageBooked.toFixed(2) + '%' + ' | ' + totalBookedTimeSlots + '/' + (totalPossibleTimeSlots - totalSoldOutSlots);
                document.getElementById("capacityBooked").innerHTML = 'Average Capacity Booked: ' + averageCapacityBooked.toFixed(2) + '%' + ' | ' + totalTicketsSold + '/' + (totalPossibleTickets - (totalSoldOutSlots * ticketsPerTime));
                document.getElementById('total2HrTickets').style.display = 'none';
                document.getElementById('total4HrTickets').style.display = 'none';

                setLabels(labels);
                setDataset(tickets);


            } else if (tableName.includes("bodaborg")) {
                let tickets2HrSold = [];
                let tickets4HrSold = [];
                let ticketsSold = [];
                let totalTickets2HrSold = 0;
                let totalTickets4HrSold = 0;
                let totalTicketsSold = 0;
                let totalBookedTimeSlots = 0;
                let totalPossibleTimeSlots = 0;
                let totalPossibleTickets = 0;
                let revenue = 0;
                let ticketsPerDayMap = {};
            
                data.forEach(record => {
                    const timeSlots = record.timeSlots;
                    let dailyTickets2HrSold = 0;
                    let dailyTickets4HrSold = 0;
                    let dailyTotalSold = 0;
                    let dailyBookedTimeSlots = 0;
                    let dailyPossibleTimeSlots = 0;
            
                    for (const timeSlot in timeSlots) {
                        const [sold2Hr, sold4Hr, available2Hr, available4Hr] = timeSlots[timeSlot].split(', ').map(Number);
            
                        dailyTickets2HrSold += sold2Hr;
                        dailyTickets4HrSold += sold4Hr;
                        dailyTotalSold += sold2Hr + sold4Hr;
            
                        // Accumulate daily values into the monthly totals
                        if (sold2Hr > 0 || sold4Hr > 0) {
                            dailyBookedTimeSlots++;
                        }
            
                        dailyPossibleTimeSlots++;
                        totalPossibleTickets += available2Hr + available4Hr;
                    }
            
                    // Accumulate the daily values into the total monthly values
                    tickets2HrSold.push(dailyTickets2HrSold);
                    tickets4HrSold.push(dailyTickets4HrSold);
                    ticketsSold.push(dailyTotalSold);
                    totalTickets2HrSold += dailyTickets2HrSold;
                    totalTickets4HrSold += dailyTickets4HrSold;
                    totalTicketsSold += dailyTotalSold;
                    totalBookedTimeSlots += dailyBookedTimeSlots;
                    totalPossibleTimeSlots += dailyPossibleTimeSlots;
            
                    revenue += (dailyTickets2HrSold * 28) + (dailyTickets4HrSold * 40);
            
                    // Store daily totals in the ticketsPerDayMap for charting purposes
                    ticketsPerDayMap[record.date] = dailyTotalSold;
                });
            
                // Calculate the average booking and capacity percentages for the month
                let averagePercentageBooked = (totalBookedTimeSlots / totalPossibleTimeSlots) * 100;
                let averageCapacityBooked = (totalTicketsSold / totalPossibleTickets) * 100;
            
                // Update the DOM elements with the calculated monthly values
                document.getElementById("totalTickets").innerHTML = "Total Tickets: " + totalTicketsSold;
                document.getElementById('total2HrTickets').style.display = 'block';
                document.getElementById('total4HrTickets').style.display = 'block';
                document.getElementById("revenue").innerHTML = `Estimated Revenue: $${revenue}`;
                document.getElementById('total2HrTickets').innerHTML = `Total 2-Hour Tickets: ${totalTickets2HrSold}`;
                document.getElementById('total4HrTickets').innerHTML = `Total 4-Hour Tickets: ${totalTickets4HrSold}`;
                document.getElementById("percentageBooked").innerHTML = 'Average Slots Booked: ' + averagePercentageBooked.toFixed(2) + '%' + ' | ' + totalBookedTimeSlots + '/' + totalPossibleTimeSlots;
                document.getElementById("capacityBooked").innerHTML = 'Average Capacity Booked: ' + averageCapacityBooked.toFixed(2) + '%' + ' | ' + totalTicketsSold + '/' + totalPossibleTickets;
            
                // Update the chart with the 2-hour and 4-hour ticket sales datasets
                setLabels(labels);  // Use labels from the earlier loop
                setDataset(ticketsSold, 'Total Tickets Sold per Day', 'rgba(75, 192, 192, 0.6)');
                setDataset(tickets2HrSold, '2-Hour Tickets Sold', 'rgba(255, 100, 100, 0.6)');
                setDataset(tickets4HrSold, '4-Hour Tickets Sold', 'rgba(128, 92, 255, 0.6)');
            } else if (tableName.includes("brkthrough")) {
                let tickets2HrSold = [];
                let tickets4HrSold = [];
                let ticketsSold = [];
                let totalTickets2HrSold = 0;
                let totalTickets4HrSold = 0;
                let totalTicketsSold = 0;
                let totalBookedTimeSlots = 0;
                let totalPossibleTimeSlots = 0;
                let totalPossibleTickets = 0;
                let revenue = 0;
                let ticketsPerDayMap = {};
            
                data.forEach(record => {
                    const timeSlots = record.timeSlots;
                    let dailyTickets2HrSold = 0;
                    let dailyTickets4HrSold = 0;
                    let dailyTotalSold = 0;
                    let dailyBookedTimeSlots = 0;
                    let dailyPossibleTimeSlots = 0;
            
                    for (const timeSlot in timeSlots) {
                        const [sold2Hr, sold4Hr, available2Hr, available4Hr] = timeSlots[timeSlot].split(', ').map(Number);
            
                        dailyTickets2HrSold += sold2Hr;
                        dailyTickets4HrSold += sold4Hr;
                        dailyTotalSold += sold2Hr + sold4Hr;
            
                        // Accumulate daily values into the monthly totals
                        if (sold2Hr > 0 || sold4Hr > 0) {
                            dailyBookedTimeSlots++;
                        }
            
                        dailyPossibleTimeSlots++;
                        totalPossibleTickets += available2Hr + available4Hr;
                    }
            
                    // Accumulate the daily values into the total monthly values
                    tickets2HrSold.push(dailyTickets2HrSold);
                    tickets4HrSold.push(dailyTickets4HrSold);
                    ticketsSold.push(dailyTotalSold);
                    totalTickets2HrSold += dailyTickets2HrSold;
                    totalTickets4HrSold += dailyTickets4HrSold;
                    totalTicketsSold += dailyTotalSold;
                    totalBookedTimeSlots += dailyBookedTimeSlots;
                    totalPossibleTimeSlots += dailyPossibleTimeSlots;
            
                    revenue += (dailyTickets2HrSold * 28) + (dailyTickets4HrSold * 40);
            
                    // Store daily totals in the ticketsPerDayMap for charting purposes
                    ticketsPerDayMap[record.date] = dailyTotalSold;
                });
            
                // Calculate the average booking and capacity percentages for the month
                let averagePercentageBooked = (totalBookedTimeSlots / totalPossibleTimeSlots) * 100;
                let averageCapacityBooked = (totalTicketsSold / totalPossibleTickets) * 100;
            
                // Update the DOM elements with the calculated monthly values
                document.getElementById("totalTickets").innerHTML = "Total Tickets: " + totalTicketsSold;
                document.getElementById('total2HrTickets').style.display = 'block';
                document.getElementById('total4HrTickets').style.display = 'block';
                document.getElementById("revenue").innerHTML = `Estimated Revenue: $${revenue}`;
                document.getElementById('total2HrTickets').innerHTML = `Total 2-Hour Tickets: ${totalTickets2HrSold}`;
                document.getElementById('total4HrTickets').innerHTML = `Total 4-Hour Tickets: ${totalTickets4HrSold}`;
                document.getElementById("percentageBooked").innerHTML = 'Average Slots Booked: ' + averagePercentageBooked.toFixed(2) + '%' + ' | ' + totalBookedTimeSlots + '/' + totalPossibleTimeSlots;
                document.getElementById("capacityBooked").innerHTML = 'Average Capacity Booked: ' + averageCapacityBooked.toFixed(2) + '%' + ' | ' + totalTicketsSold + '/' + totalPossibleTickets;
            
                // Update the chart with the 2-hour and 4-hour ticket sales datasets
                setLabels(labels);  // Use labels from the earlier loop
                setDataset(ticketsSold, 'Total Tickets Sold per Day', 'rgba(75, 192, 192, 0.6)');
                setDataset(tickets2HrSold, '2-Hour Tickets Sold', 'rgba(255, 100, 100, 0.6)');
                setDataset(tickets4HrSold, '4-Hour Tickets Sold', 'rgba(128, 92, 255, 0.6)');
            }
        });

        const formattedMonth = startDate.toLocaleString('default', { month: 'long' });
        changeTitle(formattedMonth);
        window.showMonthSelection();
    }
    

    // ### MAP FUNCTIONALITY ###
    console.log('Setting up multi-location map...');

    // Add loading indicator
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 400px; background: #f0f0f0; border-radius: 5px;"><div style="text-align: center;"><div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div><p>Loading map...</p></div></div>';
    
    // Add CSS for spinner animation and custom markers
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .custom-marker {
            background: transparent !important;
            border: none !important;
        }
        .custom-marker svg {
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }
    `;
    document.head.appendChild(style);

    // Cache management for coordinates and location data
    const CACHE_KEY_COORDINATES = 'competition_coordinates_cache';
    const CACHE_KEY_LOCATIONS = 'competition_locations_cache';
    const CACHE_EXPIRY_HOURS = 24; // Cache expires after 24 hours

    // Initialize cache from localStorage
    function initializeCache() {
        const coordinatesCache = new Map();
        const locationsCache = new Map();
        
        try {
            // Load coordinates cache
            const coordsData = localStorage.getItem(CACHE_KEY_COORDINATES);
            if (coordsData) {
                const parsed = JSON.parse(coordsData);
                if (parsed.expiry > Date.now()) {
                    Object.entries(parsed.data).forEach(([key, value]) => {
                        coordinatesCache.set(key, value);
                    });
                    console.log('Loaded coordinates cache:', coordinatesCache.size, 'entries');
                } else {
                    console.log('Coordinates cache expired, clearing...');
                    localStorage.removeItem(CACHE_KEY_COORDINATES);
                }
            }

            // Load locations cache
            const locationsData = localStorage.getItem(CACHE_KEY_LOCATIONS);
            if (locationsData) {
                const parsed = JSON.parse(locationsData);
                if (parsed.expiry > Date.now()) {
                    Object.entries(parsed.data).forEach(([key, value]) => {
                        locationsCache.set(key, value);
                    });
                    console.log('Loaded locations cache:', locationsCache.size, 'entries');
                } else {
                    console.log('Locations cache expired, clearing...');
                    localStorage.removeItem(CACHE_KEY_LOCATIONS);
                }
            }
        } catch (error) {
            console.error('Error loading cache:', error);
        }

        return { coordinatesCache, locationsCache };
    }

    // Save cache to localStorage
    function saveCacheToStorage(cache, cacheKey) {
        try {
            const cacheData = {
                data: Object.fromEntries(cache),
                expiry: Date.now() + (CACHE_EXPIRY_HOURS * 60 * 60 * 1000)
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Error saving cache:', error);
        }
    }

    // Initialize caches
    const { coordinatesCache, locationsCache } = initializeCache();

    // Color mapping for different location types
    // TO CHANGE MARKER COLORS: Edit the 'color' values below using hex color codes
    // Examples: '#FF0000' = Red, '#00FF00' = Green, '#0000FF' = Blue, '#FFA500' = Orange
    const locationTypeColors = {
        'level99': {
            color: '#FF6B6B', // Red - Change this to any hex color like '#FF0000'
            name: 'Level99'
        },
        'escapegame': {
            color: '#4ECDC4', // Teal - Change this to any hex color like '#00FFFF'
            name: 'Escape Game'
        },
        'bodaborg': {
            color: '#0000FF', // Blue - Change this to any hex color like '#0000FF'
            name: 'Boda Borg'
        },
        'brkthrough': {
            color: '#00FF00', // Green - Change this to any hex color like '#00FF00'
            name: 'Breakthrough'
        },
        'default': {
            color: '#FFEAA7', // Yellow - Change this to any hex color like '#FFFF00'
            name: 'Other'
        }
    };

    // Function to get color for location type
    function getLocationTypeColor(tableName, locationName = '') {
        // Check table name first
        for (const [type, config] of Object.entries(locationTypeColors)) {
            if (tableName.includes(type)) {
                return config;
            }
        }
        
        // Check location name for Level 99 variations (case-insensitive)
        if (locationName.toLowerCase().includes('level 99') || 
            locationName.toLowerCase().includes('level99')) {
            return locationTypeColors.level99;
        }
        
        return locationTypeColors.default;
    }

    // Function to get location type string (for toggling)
    function getLocationType(tableName, locationName = '') {
        // Check table name first
        for (const type of Object.keys(locationTypeColors)) {
            if (tableName.includes(type)) {
                return type;
            }
        }
        
        // Check location name for Level 99 variations (case-insensitive)
        if (locationName.toLowerCase().includes('level 99') || 
            locationName.toLowerCase().includes('level99')) {
            return 'level99';
        }
        
        return 'default';
    }

    // Function to create custom colored marker
    function createCustomMarker(color) {
        const svgIcon = `
            <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="${color}" stroke="#fff" stroke-width="1"/>
                <circle cx="12.5" cy="12.5" r="6" fill="#fff"/>
            </svg>
        `;
        
        return L.divIcon({
            html: svgIcon,
            className: 'custom-marker',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
        });
    }

    async function getCoordinates(address) {
        // Check memory cache first
        if (coordinatesCache.has(address)) {
            console.log('Using cached coordinates for:', address);
            return coordinatesCache.get(address);
        }

        console.log('Fetching coordinates for:', address);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address.trim())}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data && data.length > 0) {
                const coords = {
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon)
                };
                // Cache the result in memory
                coordinatesCache.set(address, coords);
                // Save to localStorage
                saveCacheToStorage(coordinatesCache, CACHE_KEY_COORDINATES);
                return coords;
            } else {
                throw new Error('Address not found in response data');
            }
        } catch (error) {
            console.error('Error fetching coordinates:', error.message);
            throw error;
        }
    }

    // Function to get all locations (with caching)
    async function getAllLocations() {
        // Check cache first
        if (locationsCache.has('all_locations')) {
            console.log('Using cached locations data');
            return locationsCache.get('all_locations');
        }

        console.log('Fetching locations from Supabase...');
        let { data: locations, error } = await supabase
            .from('locations')
            .select('id, city, state_abr, country, name, address, table_name, link, placeId, ticketPrice');

        if (error) {
            throw error;
        }

        // Cache the locations data
        locationsCache.set('all_locations', locations);
        saveCacheToStorage(locationsCache, CACHE_KEY_LOCATIONS);
        
        console.log('Cached locations data:', locations.length, 'entries');
        return locations;
    }

    async function setupMultiLocationMap() {
        try {
            // First, show current location immediately
            const currentAddress = getData('address');
            const currentLocationName = getData('locationName');
            
            if (currentAddress) {
                try {
                    const currentCoords = await getCoordinates(currentAddress);
                    
                    // Create map immediately with current location
                    var map = L.map('map').setView([currentCoords.lat, currentCoords.lon], 4);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
        }).addTo(map);

                    // Add current location marker immediately
                    const currentLocationTypeConfig = getLocationTypeColor(tableName, currentLocationName);
                    const currentMarker = L.marker([currentCoords.lat, currentCoords.lon], {
                        icon: createCustomMarker(currentLocationTypeConfig.color)
                    }).addTo(map);
                    currentMarker.bindPopup(`<b>${currentLocationName}</b><br><span style="color: ${currentLocationTypeConfig.color}; font-weight: bold;">${currentLocationTypeConfig.name}</span><br>Current Location`).openPopup();
                    
                    // Store current marker by type for toggling
                    const currentType = getLocationType(tableName, currentLocationName);
                    console.log(`Current Location: ${currentLocationName}, Table: ${tableName}, Type: ${currentType}`);
                    markersByType[currentType].push(currentMarker);

                    console.log('Current location loaded, fetching other locations...');
    } catch (error) {
                    console.error('Error loading current location:', error);
                }
            }

            // Get all locations (using cache if available)
            const locations = await getAllLocations();
            console.log('Found locations:', locations.length);

            // Process locations in batches to avoid overwhelming the API
            const batchSize = 5;
            const markers = [];
            const markersByType = {}; // Store markers by location type for toggling
            const currentLocationId = getData('location');
            
            // Initialize marker groups for each location type
            Object.keys(locationTypeColors).forEach(type => {
                markersByType[type] = [];
            });

            for (let i = 0; i < locations.length; i += batchSize) {
                const batch = locations.slice(i, i + batchSize);
                
                const batchPromises = batch.map(async (location) => {
                    try {
                        const coords = await getCoordinates(location.address);
                        return {
                            ...location,
                            coordinates: coords
                        };
                    } catch (error) {
                        console.error(`Error getting coordinates for ${location.name}:`, error);
                        return null;
                    }
                });

                const batchResults = (await Promise.all(batchPromises)).filter(loc => loc !== null);
                
                // Add markers for this batch
                batchResults.forEach((location) => {
                    // Skip if this is the current location (already added)
                    if (location.id === currentLocationId) {
                        return;
                    }

                    const locationTypeConfig = getLocationTypeColor(location.table_name, location.name);
                    const marker = L.marker([location.coordinates.lat, location.coordinates.lon], {
                        icon: createCustomMarker(locationTypeConfig.color)
                    }).addTo(map);
                    
                    // Create popup content with clickable link
                    const popupContent = `
                        <div style="text-align: center;">
                            <b>${location.name}</b><br>
                            <span style="color: ${locationTypeConfig.color}; font-weight: bold;">${locationTypeConfig.name}</span><br>
                            ${location.city}, ${location.state_abr}<br>
                            <button onclick="navigateToLocation('${location.id}', '${location.name}', '${location.table_name}', '${location.link}', '${location.placeId}', '${location.address}', '${location.state_abr}', '${location.city}', '${location.ticketPrice}')" 
                                    style="background: ${locationTypeConfig.color}; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-top: 5px;">
                                View Details
                            </button>
                        </div>
                    `;
                    
                    marker.bindPopup(popupContent);
                    markers.push(marker);
                    
                    // Store marker by type for toggling
                    const locationType = getLocationType(location.table_name, location.name);
                    console.log(`Location: ${location.name}, Table: ${location.table_name}, Type: ${locationType}`);
                    markersByType[locationType].push(marker);
                });

                // Small delay between batches to be respectful to the API
                if (i + batchSize < locations.length) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }

            // Fit map bounds to show all markers
            if (markers.length > 0) {
                const allMarkers = [...markers];
                if (currentAddress) {
                    // Add current location marker to bounds calculation
                    const currentCoords = await getCoordinates(currentAddress);
                    const currentMarker = L.marker([currentCoords.lat, currentCoords.lon]);
                    allMarkers.push(currentMarker);
                }
                
                const group = new L.featureGroup(allMarkers);
                map.fitBounds(group.getBounds().pad(0.1));
            }

            // Add interactive legend to the map
            const legend = L.control({position: 'bottomright'});
            legend.onAdd = function(map) {
                const div = L.DomUtil.create('div', 'map-legend');
                div.style.cssText = `
                    background: white;
                    padding: 10px;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    line-height: 1.4;
                    color: #333;
                `;
                
                let legendHTML = '<div style="font-weight: bold; margin-bottom: 5px; color: #333;">Location Types (Click to Toggle):</div>';
                Object.entries(locationTypeColors).forEach(([type, config]) => {
                    const markerCount = markersByType[type] ? markersByType[type].length : 0;
                    legendHTML += `
                        <div class="legend-item" data-type="${type}" style="margin: 2px 0; color: #333; cursor: pointer; padding: 2px; border-radius: 3px; transition: background-color 0.2s;" 
                             onmouseover="this.style.backgroundColor='#f0f0f0'" 
                             onmouseout="this.style.backgroundColor='transparent'">
                            <span style="display: inline-block; width: 12px; height: 12px; background-color: ${config.color}; border-radius: 50%; margin-right: 5px; vertical-align: middle; border: 1px solid #ccc;"></span>
                            ${config.name} (${markerCount})
                        </div>
                    `;
                });
                
                div.innerHTML = legendHTML;
                
                // Add click handlers for toggling
                div.addEventListener('click', function(e) {
                    const legendItem = e.target.closest('.legend-item');
                    if (legendItem) {
                        const type = legendItem.dataset.type;
                        toggleLocationType(type, legendItem);
                    }
                });
                
                return div;
            };
            legend.addTo(map);
            
            // Function to toggle location type visibility
            window.toggleLocationType = function(type, legendElement) {
                const markers = markersByType[type] || [];
                console.log(`Toggling ${type}: Found ${markers.length} markers`);
                if (markers.length === 0) return;
                
                // Check if markers are currently visible by checking if they're on the map
                const isVisible = map.hasLayer(markers[0]);
                console.log(`Markers are currently ${isVisible ? 'visible' : 'hidden'}`);
                
                if (isVisible) {
                    // Hide markers
                    markers.forEach(marker => {
                        map.removeLayer(marker);
                    });
                    legendElement.style.opacity = '0.5';
                    legendElement.style.textDecoration = 'line-through';
                    console.log(`Hidden ${markers.length} ${type} markers`);
                } else {
                    // Show markers
                    markers.forEach(marker => {
                        map.addLayer(marker);
                    });
                    legendElement.style.opacity = '1';
                    legendElement.style.textDecoration = 'none';
                    console.log(`Showed ${markers.length} ${type} markers`);
                }
            };

            console.log('Map setup complete!');

        } catch (error) {
            console.error('Error setting up multi-location map:', error);
            // Show error message in map container
            mapContainer.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 400px; background: #f0f0f0; border-radius: 5px; color: #e74c3c;"><p>Error loading map. Please refresh the page.</p></div>';
        }
    }

    // Function to navigate to a specific location
    window.navigateToLocation = function(id, name, tableName, link, placeId, address, stateAbr, city, price) {
        setData('location', id);
        setData('locationName', name);
        setData('tableName', tableName);
        setData('link', link);
        setData('placeId', placeId);
        setData('address', address);
        setData('state_abr', stateAbr);
        setData('city', city);
        setData('price', price);
        
        // Reload the page to show the selected location's data
        window.location.reload();
    };

    // Cache management functions
    window.clearMapCache = function() {
        try {
            localStorage.removeItem(CACHE_KEY_COORDINATES);
            localStorage.removeItem(CACHE_KEY_LOCATIONS);
            coordinatesCache.clear();
            locationsCache.clear();
            console.log('Map cache cleared successfully');
            alert('Cache cleared! The map will reload fresh data on next visit.');
        } catch (error) {
            console.error('Error clearing cache:', error);
            alert('Error clearing cache. Please try again.');
        }
    };

    window.getCacheInfo = function() {
        try {
            const coordsData = localStorage.getItem(CACHE_KEY_COORDINATES);
            const locationsData = localStorage.getItem(CACHE_KEY_LOCATIONS);
            
            let coordsCount = 0;
            let locationsCount = 0;
            let coordsExpiry = 'N/A';
            let locationsExpiry = 'N/A';
            
            if (coordsData) {
                const parsed = JSON.parse(coordsData);
                coordsCount = Object.keys(parsed.data).length;
                coordsExpiry = new Date(parsed.expiry).toLocaleString();
            }
            
            if (locationsData) {
                const parsed = JSON.parse(locationsData);
                locationsCount = Object.keys(parsed.data).length;
                locationsExpiry = new Date(parsed.expiry).toLocaleString();
            }
            
            const info = `Cache Status:
Coordinates: ${coordsCount} entries (expires: ${coordsExpiry})
Locations: ${locationsCount} entries (expires: ${locationsExpiry})`;
            
            console.log(info);
            alert(info);
        } catch (error) {
            console.error('Error getting cache info:', error);
        }
    };

    // Debug function to check marker types
    window.debugMarkerTypes = function() {
        console.log('=== MARKER TYPE DEBUG ===');
        if (typeof markersByType === 'undefined') {
            console.log('markersByType not available yet - map may not be loaded');
            return;
        }
        Object.entries(markersByType).forEach(([type, markers]) => {
            console.log(`${type}: ${markers.length} markers`);
            markers.forEach((marker, index) => {
                const popup = marker.getPopup();
                const content = popup.getContent();
                const name = content.split('<b>')[1]?.split('</b>')[0] || 'Unknown';
                console.log(`  ${index + 1}. ${name}`);
            });
        });
        console.log('========================');
    };

    // Initialize the multi-location map
    setupMultiLocationMap();

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

});
