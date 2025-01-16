import { ebayMain, easyShipMain, creationsMattelMain } from "@/parts";
import { hostnames, hostname } from "@/config";

function main() {
  if (hostname.includes(hostnames.ebayHostname)) {
    ebayMain();
  }

  if (
    hostname.includes(hostnames.easyShipHostname) ||
    hostname.includes(hostnames._localhost)
  ) {
    easyShipMain();
  }

  if (hostname.includes(hostnames.creationsMattel)) {
    creationsMattelMain();
  }
}

main();
