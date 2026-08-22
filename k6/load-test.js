import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  iterations: 12,
};

export default function () {
  const res = http.get('http://localhost/');

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  const body = JSON.parse(res.body);
  console.log(`Request ${__ITER + 1} → ${body.instance}`);
}