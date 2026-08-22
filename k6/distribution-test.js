import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  iterations: 30,
};

const counts = { 'api-1': 0, 'api-2': 0, 'api-3': 0 };

export default function () {
  const res = http.get('http://localhost/');

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  const body = JSON.parse(res.body);
  const instance = body.instance;
  counts[instance] = (counts[instance] || 0) + 1;
  console.log(`[${instance}]`);
}

export function handleSummary() {
  console.log('\n--- Distribution Summary ---');
  for (const [instance, count] of Object.entries(counts)) {
    console.log(`${instance}: ${count} requests`);
  }
  console.log('----------------------------\n');
  return {};
}