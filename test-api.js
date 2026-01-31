const apiKey = 'AIzaSyAqMUy-j8GImMeYG3NavHh6jJhAQX2iIRE';
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

(async () => {
    try {
        console.log('Testing API key...\n');
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [{ text: 'Say hello in one word' }]
                }]
            })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        
        if (response.ok) {
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log('Response:', reply);
            console.log('\n✅ API KEY IS WORKING!');
        } else {
            console.log('Error:', data.error?.message);
            console.log('\n❌ API KEY HAS ISSUES');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
})();
