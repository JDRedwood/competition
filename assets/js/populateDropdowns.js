document.addEventListener('DOMContentLoaded', async function() {
    // Initialize Supabase client
    const supabaseUrl = 'https://mqvxtjqmiamjlbexwhbk.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xdnh0anFtaWFtamxiZXh3aGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk1MjYzNTMsImV4cCI6MjAzNTEwMjM1M30.MAD3avhcjcvqEBECSgAsmkvRpY_zoQiF7OLqnYat6jk';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    try {
        console.log('Fetching locations from Supabase...');
        
        // Fetch locations from Supabase
        let { data, error } = await supabase
            .from('locations') // Your table name
            .select('id, city, state_abr, country, name, table_name, link'); // Adjust based on your table schema

        if (error) {
            throw error;
        }

        console.log('Data fetched:', data);

        // Populate the dropdown
        const locationSelect = document.getElementById('location');
        if (data.length > 0) {
            data.forEach(location => {
                const option = document.createElement('option');
                option.value = location.id; // Assuming each location has a unique ID
                option.textContent = `${location.name}, ${location.city}, ${location.state_abr}`;
                option.setAttribute('name', location.name);
                option.setAttribute('tableName', location.table_name); // Store the table name in the option element
                option.setAttribute('link', location.link);
                locationSelect.appendChild(option);
            });
        } else {
            console.log('No data found.');
        }
    } catch (error) {
        console.error('Error fetching locations:', error);
    }
});

