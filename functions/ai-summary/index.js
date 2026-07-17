/*
Takes POSTS requests in order to create a summary of a given legislative bill.
Communicates with ai-summary.js to extract billText from a pdf.
Uses Llama 2.
Returns as a summary with a JSON response with CORS headers.
*/
export async function onRequestPost({ request, env }) {
    try {
        console.log('AI Summary request received');
        
        const { bill_text } = await request.json();
        
        if (!bill_text) {
            return new Response(JSON.stringify({ error: 'Missing bill_text' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('Bill text length:', bill_text.length);

        // Use Cloudflare AI to generate summary
        const messages = [
            {
                role: 'system',
                //PROMPT 
                content: `Create a short summary of this legaslative bill and keep it at less than 250 words. 
                Do not include any other information but the summary in your reply and do not preface the summary with an introduction. 
                Try to include any important numbers as well
                `
                
            },
            {
                role: 'user',
                content: `Please analyze this legislative bill:\n\n${bill_text.substring(0, 160000)}`
            }
        ];

        console.log('Calling AI model...');
        const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fast', { messages });
        console.log('AI response received successfully');

        return new Response(JSON.stringify({ 
            success: true,
            summary: response.response
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });

    } catch (error) {
        console.error('AI Summary Error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to generate summary: ' + error.message
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// Handle CORS preflight
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
