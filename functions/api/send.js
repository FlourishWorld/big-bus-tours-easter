export async function onRequest(context) {
    const appId = context.env.MOENGAGE_APP_ID;
    const username = context.env.MOENGAGE_USERNAME;
    const password = context.env.MOENGAGE_PASSWORD;
  
    // Ensure these values are present
    if (!username || !password || !appId) {
        return new Response("Missing credentials", { status: 400 });
    }
  
    // Parse the incoming request (form data)
    const requestBody = await context.request.json();
    const { first_name, last_name, email, country, answer } = requestBody.attributes;

    // Ensure form data is valid
    if (!first_name || !last_name || !email || !country || !answer) {
        return new Response("Missing required form fields", { status: 400 });
    }
  
    // Prepare Base64 credentials for Basic Authentication
    const base64Credentials = btoa(`${username}:${password}`);
  
    // Prepare the user data to send to MoEngage
    const userData = {
        type: 'customer',
        customer_id: email,
        update_existing_only: 'false',
        attributes: {
            first_name,
            last_name,
            email,
            country,
            answer
        }
    };
  
    try {
        // Make the API request to MoEngage
        const response = await fetch(`https://api-01.moengage.com/v1/customer?app_id=${appId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${base64Credentials}`
            },
            body: JSON.stringify(userData)
        });
    
        // Check if the response is successful
        if (!response.ok) {
            const errorMessage = await response.text();
            return new Response(`Error: ${errorMessage}`, { status: response.status });
        }
  
        // If successful, return a success message
        return new Response("Form data successfully sent to MoEngage!", { status: 200 });
  
    } catch (error) {
        console.error("Error during MoEngage API request:", error);
        return new Response("Error submitting form.", { status: 500 });
    }
}
