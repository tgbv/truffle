import type { BlockSpecifier, RegularizedBlockSpecifier } from "./types";
import type BN from "bn.js";
import type { Provider } from "web3/providers";
import { promisify } from "util";

// lifted from @types/web3
type Log = {
    address: string;
    data: string;
    topics: string[];
    logIndex: number;
    transactionHash: string;
    transactionIndex: number;
    blockHash: string;
    blockNumber: number;
}
type PastLogsOptions = {
  toBlock?: string | number;
  fromBlock?: string | number;
  address?: string | string[];
};
type SendRequestArgs = {
  method: string;
  params: unknown[];
  formatOutput?: (arg: any) => any;
};
type Eip1193Provider = {
  request: (options: { method: string; params?: unknown[] | object; }) => Promise<any>;
}

type Block = {
  number: string;
  hash: string;
  parentHash: string;
  mixHash: string;
  nonce: string;
  sha3Uncles: string;
  logsBloom: string;
  transactionsRoot: string;
  stateRoot: string;
  receiptsRoot: string;
  miner: string;
  difficulty: string;
  totalDifficulty: string;
  extraData: string;
  size: string;
  gasLimit: string;
  gasUsed: string;
  timestamp: string;
  transactions: string[];
  uncles: string[];
}

type FormattedBlock = {
  number: number;
  size: number;
  gasLimit: number;
  gasUsed: number;
  timestamp: number;
  hash: string;
  parentHash: string;
  mixHash: string;
  nonce: string;
  sha3Uncles: string;
  logsBloom: string;
  transactionsRoot: string;
  stateRoot: string;
  receiptsRoot: string;
  miner: string;
  difficulty: string;
  totalDifficulty: string;
  extraData: string;
  transactions: string[];
  uncles: string[];
}
const stringWhitelist = [
  "latest",
  "pending",
  "genesis",
  "earliest"
];

const formatBlockSpecifier = (block: BlockSpecifier): string => {
  if (typeof block === "string" && stringWhitelist.includes(block)) {
    // block is one of 'latest', 'pending', 'earliest', or 'genesis'
    return block === "genesis" ?
      // convert old web3 input format which uses 'genesis'
      "earliest" :
      block;
  } else if (typeof block === "string" && !isNaN(parseInt(block))) {
    // block is a string representation of a number
    if (block.startsWith("0x")) return block;
    // convert to hex and add '0x' prefix in case block is decimal
    return `0x${parseInt(block).toString(16)}`;
  } else if (typeof block === "number") {
    return `0x${block.toString(16)}`;
  } else {
    throw new Error(
      "The block specified must be a number or one of the strings 'latest'," +
      "'pending', or 'earliest'."
    );
  }
};
const formatBlock = (block: Block): FormattedBlock => {
  return {
    ...block,
    number: parseInt(block.number),
    size: parseInt(block.size),
    gasLimit: parseInt(block.gasLimit),
    gasUsed: parseInt(block.gasUsed),
    timestamp: parseInt(block.timestamp)
  };
};

export class ProviderAdapter {
  public provider: Provider | Eip1193Provider;

  constructor (provider: Provider | Eip1193Provider) {
    this.provider = provider;
  }

  private async sendRequest ({
    method,
    params,
    formatOutput
  }: SendRequestArgs): Promise<any> {
    if (!this.provider) {
      throw new Error("There is not a valid provider present.")
    }
    // check to see if the provider is compliant with eip1193
    // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md
    let result: any;
    if ("request" in this.provider) {
      result = (await this.provider.request({ method, params })).result;
    } else {
      const sendMethod = promisify(this.provider.send).bind(this.provider);
      result = (await sendMethod({
        jsonrpc: "2.0",
        id: new Date().getTime(),
        method,
        params
      })).result;
    }
    if (formatOutput) return formatOutput(result);
    return result;
  }

  public async getCode (address: string, block: RegularizedBlockSpecifier): Promise<string> {
    const blockToFetch = formatBlockSpecifier(block);
    return await this.sendRequest({
      method: "eth_getCode",
      params: [
        address,
        blockToFetch
      ]
    });
  }

  public async getBlockByNumber (block: BlockSpecifier): Promise<FormattedBlock> {
    const blockToFetch = formatBlockSpecifier(block);
    return await this.sendRequest({
      method: "eth_getBlockByNumber",
      params: [ blockToFetch, false ],
      formatOutput: formatBlock
    });
  }

  public async getPastLogs ({ address, fromBlock, toBlock }: PastLogsOptions): Promise<Log[]> {
    return await this.sendRequest({
      method: "eth_getLogs",
      params: [{ fromBlock, toBlock, address }]
    });
  }

  public async getNetworkId (): Promise<string> {
    return await this.sendRequest({
      method: "net_version",
      params: [],
      formatOutput: result => parseInt(result)
    });
  }

  public async getBlockNumber (): Promise<number> {
    return await this.sendRequest({
      method: "eth_blockNumber",
      params: [],
      formatOutput: result => parseInt(result)
    });
  }

  public async getBalance (address: string, block: BlockSpecifier): Promise<string> {
    return await this.sendRequest({
      method: "eth_getBalance",
      params: [
        address,
        formatBlockSpecifier(block)
      ],
      formatOutput: result => parseInt(result).toString()
    });
  }

  public async getTransactionCount (address: string, block: BlockSpecifier): Promise<string> {
    return await this.sendRequest({
      method: "eth_getTransactionCount",
      params: [
        address,
        formatBlockSpecifier(block)
      ],
      formatOutput: result => parseInt(result).toString()
    });
  }

  public async getStorageAt (address: string, position: BN, block: BlockSpecifier): Promise<string> {
    return await this.sendRequest({
      method: "eth_getStorageAt",
      params: [
        address,
        position,
        formatBlockSpecifier(block)
      ]
    });
  }
}
