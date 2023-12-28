export class NetworkConfiguration {
  constructor(
    public name: string,
    public fullNodeUrl: string,
    public faucetUrl: string,
    public contract: string,
    public backend: string,
    public backendNet: string,
    public isMainNet = false
  ) {}
}

export const msgToSign = 'Congrats! Moveflow caught you! ';
