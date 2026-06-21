import { spawn } from 'node:child_process';

const port = process.env.PORT || '3000';
const listen = String(port).includes('://') ? port : `tcp://0.0.0.0:${port}`;

const child = spawn('npx', ['serve', '-s', 'dist', '-l', listen], {
  stdio: 'inherit',
  shell: true,
});

child.on('exit', code => process.exit(code ?? 1));
