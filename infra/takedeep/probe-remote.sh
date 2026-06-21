#!/bin/bash
curl -s -w "\nhttp:%{http_code}\n" --connect-timeout 15 -m 25 \
  'https://llm-qualtron.qgi.dev/v1/models' \
  -H 'Authorization: Bearer sk-a114e4eef093740c9e3f67e396d5c788d28ff7a3c7a877b9' \
  -H 'CF-Access-Client-Id: 01eaf6f2d36728b5a3a8b1a8d0e4c597.access' \
  -H 'CF-Access-Client-Secret: 1fa777305e19805eadd54a9b87bbc9fd38f684aae2c977681c0524a260a4aac0' \
  -H 'User-Agent: TakeDeep-probe/1.0' | tail -5
