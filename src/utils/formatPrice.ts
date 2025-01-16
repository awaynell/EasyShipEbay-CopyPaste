export function formatPrice(price: string) {
  return price.replace(/^\D+/g, "").replace(",", ".");
}
