/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-empty-function */
export function generateDigits(numberOfDigits: number) {
  if (numberOfDigits <= 0) {
    throw new Error('Number of digits must be greater than 0');
  }

  const min = Math.pow(10, numberOfDigits - 1); // Smallest number with `numberOfDigits`
  const max = Math.pow(10, numberOfDigits); // Largest number with `numberOfDigits`

  return Math.floor(min + Math.random() * (max - min));
}

export function generateBatchNumber(length = 12): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
