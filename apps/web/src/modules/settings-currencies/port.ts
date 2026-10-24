export type HomeCurrencyProposal = {
  currencyName: string;
  isoCode: string;
  displayName: string;
  symbol?: string;
  isBase?: boolean;
};

export type CurrenciesPort = {
  getHomeCurrency(): Promise<HomeCurrencyProposal>;
};
