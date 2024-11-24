import { Repository } from './repository';
import {
  CollateralAccountLink,
  CollateralAccount,
  CollateralLinkStatus,
  Environment,
  CollateralAsset,
  Blockchain,
  CryptocurrencySymbol,
  Account,
} from '../../client/generated';
import { XComError } from '../../error';

export class CollateralAccountNotExist extends XComError {
  constructor() {
    super('Collateral Account Not Found');
  }
}

function isUUIDv4(uuid: string): boolean {
  const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidv4Regex.test(uuid);
}
export class CollateralController {
  private readonly collateralRepository = new Repository<CollateralAccount & Account>();

  constructor() {}

  public generateCollateralAssets(numAssets: number, env: Environment): CollateralAsset[] {
    const assets: CollateralAsset[] = [];

    for (let i = 0; i < numAssets; i++) {
      assets.push(this.createCollateralAsset(env));
    }

    return assets;
  }

  private createCollateralAsset(env: Environment): CollateralAsset {
    const isTestAsset: boolean = env === Environment.SANDBOX ? true : false;
    return {
      blockchain: Blockchain.BITCOIN,
      cryptocurrencySymbol: CryptocurrencySymbol.BTC,
      testAsset: isTestAsset,
    };
  }

  public createCollateralAccountLink(
    accountId: string,
    collateralAccount: CollateralAccount
  ): CollateralAccount {
    if (!accountId) {
      throw new CollateralAccountNotExist();
    }

    for (const signer of collateralAccount.collateralSigners) {
      if (!isUUIDv4(signer)) {
        throw new CollateralAccountNotExist();
      }
    }

    const newCollateralAccountLink: CollateralAccountLink = {
      collateralId: collateralAccount.collateralId,
      collateralSigners: collateralAccount.collateralSigners || [],
      eligibleCollateralAssets: this.generateCollateralAssets(2, collateralAccount.env),
      status: CollateralLinkStatus.ELIGIBLE,
      env: Environment.PROD,
    };
    return newCollateralAccountLink;
  }

  public getCollateralAccountLinks(): CollateralAccount[] {
    return this.collateralRepository.list();
  }
}
