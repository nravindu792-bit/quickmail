exports.handler = async function(event) {
    try {
        const response = await fetch(
            "https://api.tempmailportal.com/api/inbox",
            {
                method: "POST"
            }
        );

        const data = await response.json();

        return {
            statusCode: response.status,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({
                error: "Could not create temporary email"
            })
        };
    }
};