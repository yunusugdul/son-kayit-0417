import { execFileSync } from 'node:child_process';

const tools = [
  { name: 'Node.js', command: 'node', args: ['--version'], required: true },
  { name: 'npm', command: 'npm', args: ['--version'], required: true },
  { name: 'Git', command: 'git', args: ['--version'], required: true },
  { name: 'Blender', command: 'blender', args: ['--version'], required: false },
];
let missing = false;
for (const tool of tools) {
  try {
    const version = execFileSync(tool.command, tool.args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n')[0];
    console.log(`✓ ${tool.name}: ${version}`);
  } catch {
    console.log(`${tool.required ? '✗' : '○'} ${tool.name}: bulunamadı${tool.required ? '' : ' (Aşama 0 sahnesi için zorunlu değil)'}`);
    if (tool.required) missing = true;
  }
}
if (missing) process.exitCode = 1;
