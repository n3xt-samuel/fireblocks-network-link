import config from '../config';
import { randomUUID } from 'crypto';
import { buildRequestSignature } from '../security/auth-provider';
import { request as requestInternal } from './generated/core/request';
import { ApiRequestOptions } from './generated/core/ApiRequestOptions';
import {
  AccountsService,
  BalancesService,
  BaseHttpRequest,
  CancelablePromise,
  CapabilitiesService,
  HistoricBalancesService,
  LiquidityService,
  OpenAPI,
  OpenAPIConfig,
  TradingService,
  TransfersBlockchainService,
  TransfersFiatService,
  TransfersPeerAccountsService,
  TransfersService,
} from './generated';
import { Method } from 'axios';

export type SecurityHeaders = {
  xFbapiKey: string;
  xFbapiNonce: string;
  xFbapiTimestamp: number;
  xFbapiSignature: string;
};

type Func = (arg) => any;
type FirstFuncParam<F extends Func> = Parameters<F>[0];

type FirstFuncParamWithoutSecurityHeaders<M extends Func> = Omit<
  FirstFuncParam<M>,
  keyof SecurityHeaders
>;

type WithoutSecurityHeaders<F extends Func> = (
  args: FirstFuncParamWithoutSecurityHeaders<F>
) => ReturnType<F>;

// This type is designed to take one of the generated service types
// and for its each method, remove the security header parameters
type SecureService<Service> = {
  [k in keyof Service]: Service[k] extends Func ? WithoutSecurityHeaders<Service[k]> : never;
};

/**
 * Creates a new object with the same methods as in {@link service} but
 * with the security header parameters stripped. The security parameters
 * are supplied later by {@link HttpRequestWithSecurityHeaders}.
 */
function stripSecurityHeaderArgs<ServiceType extends object>(
  service: ServiceType
): SecureService<ServiceType> {
  const emptySecurityHeaders = {
    xFbapiKey: '',
    xFbapiNonce: '',
    xFbapiTimestamp: 0,
    xFbapiSignature: '',
  };

  const securedService = {};

  const propNames = Object.getOwnPropertyNames(Object.getPrototypeOf(service));
  for (const propName of propNames) {
    const prop = service[propName];

    if (prop instanceof Function) {
      const originalMethod = prop.bind(service);
      securedService[propName] = (args) => originalMethod({ ...args, ...emptySecurityHeaders });
    }
  }

  return securedService as SecureService<ServiceType>;
}

type SecurityHeadersFactory = (options: ApiRequestOptions) => SecurityHeaders;

export class SecureClient {
  public readonly accounts: SecureService<AccountsService>;
  public readonly balances: SecureService<BalancesService>;
  public readonly capabilities: SecureService<CapabilitiesService>;
  public readonly historicBalances: SecureService<HistoricBalancesService>;
  public readonly liquidity: SecureService<LiquidityService>;
  public readonly trading: SecureService<TradingService>;
  public readonly transfers: SecureService<TransfersService>;
  public readonly transfersBlockchain: SecureService<TransfersBlockchainService>;
  public readonly transfersFiat: SecureService<TransfersFiatService>;
  public readonly transfersPeerAccounts: SecureService<TransfersPeerAccountsService>;

  private readonly request: BaseHttpRequest;

  constructor(securityHeadersFactory: SecurityHeadersFactory = createSecurityHeaders) {
    this.request = new HttpRequestWithSecurityHeaders(securityHeadersFactory, {
      ...OpenAPI,
      BASE: config.get('client').serverBaseUrl,
    });

    this.accounts = stripSecurityHeaderArgs(new AccountsService(this.request));
    this.balances = stripSecurityHeaderArgs(new BalancesService(this.request));
    this.capabilities = stripSecurityHeaderArgs(new CapabilitiesService(this.request));
    this.historicBalances = stripSecurityHeaderArgs(new HistoricBalancesService(this.request));
    this.liquidity = stripSecurityHeaderArgs(new LiquidityService(this.request));
    this.trading = stripSecurityHeaderArgs(new TradingService(this.request));
    this.transfers = stripSecurityHeaderArgs(new TransfersService(this.request));
    this.transfersBlockchain = stripSecurityHeaderArgs(
      new TransfersBlockchainService(this.request)
    );
    this.transfersFiat = stripSecurityHeaderArgs(new TransfersFiatService(this.request));
    this.transfersPeerAccounts = stripSecurityHeaderArgs(
      new TransfersPeerAccountsService(this.request)
    );
  }
}

export class HttpRequestWithSecurityHeaders extends BaseHttpRequest {
  constructor(
    private readonly securityHeadersFactory: SecurityHeadersFactory,
    config: OpenAPIConfig
  ) {
    super(config);
  }

  public override request<T>(options: ApiRequestOptions): CancelablePromise<T> {
    const headers = this.securityHeadersFactory(options);
    return requestInternal(this.config, {
      ...options,
      headers: {
        'X-FBAPI-KEY': headers.xFbapiKey,
        'X-FBAPI-NONCE': headers.xFbapiNonce,
        'X-FBAPI-TIMESTAMP': headers.xFbapiTimestamp,
        'X-FBAPI-SIGNATURE': headers.xFbapiSignature,
      },
    });
  }
}

function createSecurityHeaders({ method, url, body }: ApiRequestOptions): SecurityHeaders {
  const apiKey = config.get('authentication').apiKey;
  const nonce = randomUUID();
  const timestamp = Date.now();

  const payload = buildSignaturePayload(method, url, body, timestamp, nonce);
  const signature = buildRequestSignature(payload);

  return {
    xFbapiKey: apiKey,
    xFbapiSignature: signature,
    xFbapiTimestamp: timestamp,
    xFbapiNonce: nonce,
  };
}

/**
 * Builds the payload to sign from the request components
 */
function buildSignaturePayload(
  method: Method,
  endpoint: string,
  body: object,
  timestamp: number,
  nonce: string
): string {
  return `${timestamp}${nonce}${method.toUpperCase()}${endpoint}${stringifyBody(body)}`;
}

function stringifyBody(body): string {
  if (!body) {
    return '';
  }
  return JSON.stringify(body);
}
