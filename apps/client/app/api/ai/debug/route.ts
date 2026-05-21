import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Debug API Route
 * Analyzes code and errors using Google Gemini API.
 * 
 * Customized and extended by Shruti Yeole as part of a Final Year Major Project.
 */

export async function POST(req: NextRequest) {
    try {
        const { code, error } = await req.json();

        if (!code || !error) {
            return NextResponse.json(
                { error: 'Code and error message are required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error('GEMINI_API_KEY is not defined');
            return NextResponse.json(
                { error: 'AI service configuration error' },
                { status: 500 }
            );
        }

        const prompt = `Analyze the following code and error. Explain the issue and suggest a fix.
Return the response in a structured JSON format with exactly two keys: "explanation" and "suggested_fix".

Code:
\`\`\`
${code}
\`\`\`

Error:
${error}`;

        console.log("Gemini key exists:", !!apiKey);
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt,
                                },
                            ],
                        },
                    ],

                }),
            }
        );

        if (!response.ok) {
            const status = response.status;
            const errorText = await response.text();

            console.error("Gemini Status:", status);
            console.error("Gemini Raw Error:", errorText);

            return NextResponse.json(
                { error: `AI service unavailable (${status})` },
                { status: 503 }
            );
        }

        const data = await response.json();
        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!resultText) {
            return NextResponse.json(
                { error: 'Empty response from AI service' },
                { status: 500 }
            );
        }

        try {
            // The model might return the JSON wrapped in code blocks or as a raw string
            const jsonContent = resultText.replace(/```json\n?|```/g, '').trim();
            const parsedResult = JSON.parse(jsonContent);

            return NextResponse.json({
                explanation: parsedResult.explanation || 'No explanation provided.',
                suggested_fix: parsedResult.suggested_fix || 'No fix suggested.',
            });
        } catch (parseError) {
            console.error('Failed to parse AI response:', resultText, parseError);
            return NextResponse.json(
                {
                    explanation: resultText,
                    suggested_fix: 'Manual fix required.'
                }
            );
        }
    } catch (err) {
        console.error('AI Debug Route Error:', err);
        return NextResponse.json(
            { error: 'AI service unavailable' },
            { status: 500 }
        );
    }
}
