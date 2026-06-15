import { execSync } from 'child_process';
try {
  const out = execSync('php -v');
  console.log('PHP Found:', out.toString());
} catch (e) {
  console.log('PHP Not Found');
}
