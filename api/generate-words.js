export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get API key from environment variable
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ 
            error: 'Anthropic API key is not configured on the server' 
        });
    }

    const { experienceText } = req.body;

    if (!experienceText || !experienceText.trim()) {
        return res.status(400).json({ 
            error: 'Experience text is required' 
        });
    }

    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1000,
                messages: [{
                    role: "user",
                    content: `Based on this experience, suggest exactly 3 words that capture its essence. Follow these rules from "The 3 Word Journal":
- Use specific, concrete words (not generalities)
- Include a person, place, or thing if possible
- Make the words uniquely identify this experience
- Words should be memorable and evocative

Experience: "${experienceText}"

Respond with ONLY 3 words separated by commas, nothing else.`
                }],
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({ 
                error: `API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}` 
            });
        }

        const data = await response.json();
        
        if (!data.content || !data.content[0] || !data.content[0].text) {
            return res.status(500).json({ 
                error: 'Unexpected API response format' 
            });
        }
        
        const text = data.content[0].text.trim();
        const words = text.split(',').map(w => w.trim()).filter(w => w.length > 0).slice(0, 3);
        
        if (words.length < 3) {
            return res.status(500).json({ 
                error: `AI returned only ${words.length} word(s). Response: "${text}"` 
            });
        }

        return res.status(200).json({ words });
    } catch (error) {
        console.error('Error in generate-words API:', error);
        return res.status(500).json({ 
            error: error.message || 'Internal server error' 
        });
    }
}

