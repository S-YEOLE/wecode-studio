/**
 * API route handler for executing code submissions.
 * Makes requests to Piston API for code execution with:
 * - Input validation
 * - Request cancellation support
 * - Execution metadata
 * - Error handling
 *
 * 
 */

// import { NextResponse } from 'next/server';

// // export const runtime = 'edge';

// const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

// interface RequestBody {
//   code: string;
//   language: string;
//   args?: string[];
//   stdin?: string;
// }

// export async function POST(request: Request) {
//   try {
//     const body: RequestBody = await request.json();

//     // Validate request body
//     if (!body.code) {
//       return NextResponse.json({ error: 'Code is required' }, { status: 400 });
//     }

//     if (!body.language) {
//       return NextResponse.json({ error: 'Language is required' }, { status: 400 });
//     }

//     const controller = new AbortController();
//     request.signal.addEventListener('abort', () => {
//       controller.abort();
//     });

//     const response = await fetch(PISTON_API_URL, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         language: body.language.toLowerCase(),
//         version: '*',
//         files: [{ content: body.code }],
//         stdin: body.stdin || '',
//         args: Array.isArray(body.args) ? body.args : [],
//         run_timeout: 30000, // 30 seconds timeout
//         compile_timeout: 30000
//       }),
//       signal: controller.signal
//     });

//     if (!response.ok) {
//       throw new Error(`API error: ${response.status}`);
//     }

//     const data = await response.json();

//     // Add execution metadata to response
//     const metadata = {
//       args: body.args || [],
//       stdin: body.stdin || '',
//       timestamp: new Date().toISOString()
//     };

//     return NextResponse.json({
//       ...data,
//       metadata
//     });
//   } catch (error) {
//     if (error instanceof DOMException && error.name === 'AbortError') {
//       return NextResponse.json(
//         { error: 'Code execution cancelled' },
//         { status: 499 } // Using 499 Client Closed Request
//       );
//     }

//     console.error('Code execution error:', error);
//     return NextResponse.json({ error: 'Failed to execute code' }, { status: 500 });
//   }
// }







// import { NextResponse } from 'next/server';
// import { exec } from 'child_process';
// import fs from 'fs';
// import path from 'path';

// interface RequestBody {
//   code: string;
//   language: string;
//   args?: string[];
//   stdin?: string;
// }

// export async function POST(request: Request) {
//   try {
//     const body: RequestBody = await request.json();

//     if (!body.code) {
//       return NextResponse.json({ error: 'Code is required' }, { status: 400 });
//     }

//     if (!body.language) {
//       return NextResponse.json({ error: 'Language is required' }, { status: 400 });
//     }

//     const tempDir = path.join(process.cwd(), 'temp');
//     if (!fs.existsSync(tempDir)) {
//       fs.mkdirSync(tempDir);
//     }

//     const filePath = path.join(tempDir, 'temp.py');

//     if (body.language.toLowerCase() !== 'python') {
//       return NextResponse.json(
//         { error: 'Only Python execution supported in demo mode' },
//         { status: 400 }
//       );
//     }

//     fs.writeFileSync(filePath, body.code);

//     return new Promise((resolve) => {
//       exec(`python "${filePath}"`, (error, stdout, stderr) => {
//         if (error) {
//           resolve(
//             NextResponse.json({
//               run: { stdout: '', stderr: stderr || error.message }
//             })
//           );
//         } else {
//           resolve(
//             NextResponse.json({
//               run: { stdout: stdout, stderr: '' }
//             })
//           );
//         }
//       });
//     });

//   } catch (error) {
//     console.error('Execution error:', error);
//     return NextResponse.json({ error: 'Execution failed' }, { status: 500 });
//   }
// }



import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

interface RequestBody {
  code: string;
  language: string;
  args?: string[];
  stdin?: string;
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();

    // ✅ Validation
    if (!body.code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    if (!body.language) {
      return NextResponse.json({ error: 'Language is required' }, { status: 400 });
    }

    const lang = body.language.toLowerCase();

    // 📁 Create temp folder
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    let filePath = '';
    let command = '';

    // 🟢 Python
    if (lang === 'python') {
      filePath = path.join(tempDir, 'temp.py');
      fs.writeFileSync(filePath, body.code);
      command = `python "${filePath}"`;
    }

    // 🟢 JavaScript
    else if (lang === 'javascript' || lang === 'js') {
      filePath = path.join(tempDir, 'temp.js');
      fs.writeFileSync(filePath, body.code);
      command = `node "${filePath}"`;
    }

    // 🟢 Java
    else if (lang === 'java') {
      const javaFile = path.join(tempDir, 'Main.java');
      fs.writeFileSync(javaFile, body.code);

      command = `javac "${javaFile}" && java -cp "${tempDir}" Main`;
    }

    // ❌ Unsupported language
    else {
      return NextResponse.json(
        { error: 'Language not supported in local execution mode' },
        { status: 400 }
      );
    }

    // 🚀 Execute command
    return new Promise<Response>((resolve) => {
      exec(command, (error, stdout, stderr) => {
        resolve(
          NextResponse.json({
            run: {
              stdout: stdout || "",
              stderr: stderr || "",
              code: error ? 1 : 0,
              signal: null
            },
            language: lang,
            version: "local"
          })
        );
      });
    });

  } catch (error) {
    console.error('Execution error:', error);
    return NextResponse.json({ error: 'Execution failed' }, { status: 500 });
  }
}