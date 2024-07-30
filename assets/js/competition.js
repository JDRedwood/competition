import { setData, getData } from './data.js';
import { setLabels, setDataset } from './charts.js';

document.addEventListener('DOMContentLoaded', async function () {
    const supabaseUrl = 'https://mqvxtjqmiamjlbexwhbk.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xdnh0anFtaWFtamxiZXh3aGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk1MjYzNTMsImV4cCI6MjAzNTEwMjM1M30.MAD3avhcjcvqEBECSgAsmkvRpY_zoQiF7OLqnYat6jk';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    const locationName = getData("locationName");
    const tableName = getData("tableName");
    const link = getData("link");
    console.log("Location Name:", locationName);
    console.log("Table Name:", tableName);
    console.log("Link:", link);

    document.getElementById("location-name").innerHTML = locationName;


    getDailyData(supabase, tableName);

    const weeklyLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const dailyLabels = ["00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"];
    const monthlyLabels = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"];

    document.getElementById("weekly").addEventListener("click", function () {
        getWeeklyData(supabase, tableName);
        // document.getElementById("date").innerHTML = "Weekly";
    });

    document.getElementById("daily").addEventListener("click", function () {

        getDailyData(supabase, tableName);
    });
    document.getElementById("monthly").addEventListener("click", function () {
        getMonthlyData(supabase, tableName);
    });

    async function getDailyData(supabase, tableName) {
        let currentLabels = [];
        if (tableName === "level99natick") {
            const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

            let { data, error } = await supabase
                .from(tableName)
                .select('timeSlots, ticketsPerTime, ticketsPerDay')
                .eq('date', today);

            if (error) {
                console.error('Error fetching data:', error);
            } else {
                console.log('Data fetched:', data);
                // Assuming only one record per date
                if (data.length > 0) {
                    const timeSlots = data[0].timeSlots;
                    const ticketsPerTime = data[0].ticketsPerTime;
                    const ticketsPerDay = data[0].ticketsPerDay;

                    currentLabels = Object.keys(timeSlots);

                    let tickets = [];
                    for (const timeSlot in timeSlots) {
                        let ticketsAvailable = timeSlots[timeSlot];
                        let ticketsSold = ticketsPerTime - ticketsAvailable;
                        tickets.push(ticketsSold);
                    }

                    let totalTicketsSold = tickets.reduce((total, ticket) => total + ticket, 0);
                    console.log("Total Tickets Sold:", totalTicketsSold);

                    document.getElementById("totalSales").innerHTML = totalTicketsSold;

                    setLabels(currentLabels);
                    setDataset(tickets);
                }
            }
        }
    }

    async function getWeeklyData(supabase, tableName) {
        let currentLabels = [];
        if (tableName === "level99natick") {
            const today = new Date();
    
            let labels = [];
            let dates = [];
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
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
            }
        }
    }
    
    async function getMonthlyData(supabase, tableName) {
        let currentLabels = [];
        if (tableName === "level99natick") {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); // Get the first date of the current month
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Get the last date of the current month

            let labels = [];
            let dates = [];
            for (let date = new Date(startOfMonth); date <= endOfMonth; date.setDate(date.getDate() + 1)) {
                labels.push(date.toISOString().split('T')[0]);
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
            }
        }
    }
});

