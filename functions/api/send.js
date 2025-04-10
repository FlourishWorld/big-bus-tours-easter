export async function onRequest(context) {
    const appId = context.env.MOENGAGE_APP_ID;
    const username = context.env.MOENGAGE_USERNAME;
    const password = context.env.MOENGAGE_PASSWORD;
    const turnstileSecret = context.env.TURNSTILE_SECRET;
  
    // Ensure these values are present
    if (!username || !password || !appId || !turnstileSecret) {
        return new Response("Missing credentials", { status: 400 });
    }
  
    // Parse the incoming request (form data)
    // const requestBody = await context.request.json();
    // console.log(requestBody['cf-turnstile-response']);
    // const { first_name, last_name, email, country, answer } = requestBody.attributes;
    // const turnstileToken = requestBody['cf-turnstile-response'];

    const body = await context.request.formData();

    const first_name = body.get('first_name');
    const last_name = body.get('attributes[last_name]');
    const email = body.get('email');
    const country = body.get('country');
    const answer = body.get('answer');
    const token = body.get("cf-turnstile-response");

    console.log(token);
    console.log(first_name);
    console.log(last_name);

    // Ensure form data is valid
    if (!first_name || !last_name || !email || !country || !answer || !turnstileToken) {
        console.log('Missing field');
        return new Response("Missing required form fields", { status: 400 });
    }

    // Turnstile verification
    const verifyResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            secret: turnstileSecret,
            response: turnstileToken,
            remoteip: context.request.headers.get("CF-Connecting-IP") || ""
        })
    });

    const verification = await verifyResponse.json();

    if (!verification.success) {
        console.log('Turnstile verification failed');
        return new Response("Turnstile verification failed", { status: 403 });
    }

    console.log('Turnstile verification succeeded');

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
        const response = await fetch(`https://api-02.moengage.com/v1/customer?app_id=${appId}`, {
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
