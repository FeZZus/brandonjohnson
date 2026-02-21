async function main() {
  // TODO: replace with actual API call
  const response = await fetch("https://example.com/api");
  const data = await response.json();
  console.log(data);
}

main().catch(console.error);
