var data = {
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'],
    datasets: [{
        label: 'Ticket Sales',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        data: [65, 59, 80, 81, 56, 55, 40, 45, 60, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170],
        lineTension: 0, // Adjust line tension as needed
    }]
};

// Configuration options
var options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        title: {
            display: true,
            text: 'Monthly Data',
            font: {
                size: 32,
                family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                weight: 'bold',
                color: '#FFF' // Title color
            }
        },
        legend: {
            display: true,
            labels: {
                font: {
                    size: 24,
                    family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    style: 'italic',
                    color: '#555' // Legend label color
                }
            }
        }
    },
    scales: {
        x: {
            display: true,
            title: {
                display: true,
                text: 'Month',
                font: {
                    size: 14,
                    family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    style: 'normal',
                    color: '#777' // X-axis label color
                }
            },
            ticks: {
                font: {
                    size: 12,
                    family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    style: 'normal',
                    color: '#666' // X-axis tick color
                }
            }
        },
        y: {
            display: true,
            title: {
                display: true,
                text: 'Sales',
                font: {
                    size: 14,
                    family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    style: 'normal',
                    color: '#777' // Y-axis label color
                }
            },
            ticks: {
                font: {
                    size: 12,
                    family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    style: 'normal',
                    color: '#666' // Y-axis tick color
                }
            }
        }
    }
};

// Get the canvas element
var ctx = document.getElementById('myChart').getContext('2d');

// Create the chart
var myChart = new Chart(ctx, {
    type: 'line',
    data: data,
    options: options
});

export function setLabels(labels) {
    data.labels = labels;
    myChart.update();
}

export function setDataset(tickets) {
    if (data.datasets[0]) {
        data.datasets[0].data = tickets;
    } else {
        data.datasets.push({
            label: 'Ticket Sales',
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            data: tickets,
            lineTension: 0, // Adjust line tension as needed
        });
    }
    myChart.update();
}

export function changeTitle(title){
    myChart.options.plugins.title.text = title;
    myChart.update();
    console.log("Title changed to: ", title);
}

export function changeYAxis(max){
    myChart.options.scales.y.ticks.max = max;
    myChart.update();
    console.log("Y-axis max changed to: ", max);
}
