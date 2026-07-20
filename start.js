/**
 * 一键启动脚本 - 同时启动后端和前端
 * 用法: node start.js
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isWindows = process.platform === 'win32';
const shell = isWindows;
const cmd = isWindows ? 'cmd' : 'npm';
const args = isWindows ? ['/c', 'npm'] : [];

const SERVER_DIR = path.join(__dirname, 'server');
const CLIENT_DIR = __dirname;

function run(name, cwd, command) {
  const child = spawn(cmd, [...args, ...command], { cwd, shell, stdio: 'pipe' });
  child.stdout.on('data', d => {
    d.toString().split('\n').forEach(line => {
      if (line.trim()) console.log(`[${name}] ${line}`);
    });
  });
  child.stderr.on('data', d => {
    d.toString().split('\n').forEach(line => {
      if (line.trim()) console.error(`[${name}] ${line}`);
    });
  });
  child.on('exit', code => {
    console.log(`[${name}] 进程退出，code=${code}`);
    process.exit(code);
  });
  return child;
}

console.log('┌────────────────────────────────────────────┐');
console.log('│  CoXoF Ai Studio - 一键启动                │');
console.log('│  后端: http://localhost:3002               │');
console.log('│  前端: http://localhost:5173               │');
console.log('└────────────────────────────────────────────┘\n');

const backend = run('Backend', SERVER_DIR, ['run', 'dev']);
const frontend = run('Frontend', CLIENT_DIR, ['run', 'dev']);

// Ctrl+C 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭所有服务...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  backend.kill();
  frontend.kill();
  process.exit(0);
});
