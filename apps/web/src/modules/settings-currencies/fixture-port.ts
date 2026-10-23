import type { CurrenciesPort, HomeCurrencyProposal } from "./port";

export const FIXTURE_HOME_CURRENCY: HomeCurrencyProposal = {
  currencyName: "Turkish Lira",
  isoCode: "TRY",
  displayName: "Turkish Lira - TRY",
  symbol: "TL",
  isBase: false,
};

export const fixtureCurrenciesPort: CurrenciesPort = {
  async getHomeCurrency() {
    return FIXTURE_HOME_CURRENCY;
  },
};
